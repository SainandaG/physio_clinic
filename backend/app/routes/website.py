"""Editable website wording, the blog, and the search-engine files (sitemap.xml, robots.txt)."""
import math
import re
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_admin
from app.content import DEFAULT_CONTENT, merged_content, slugify
from app.database import get_db
from app.models.website import BlogPost, SiteContent
from app.schemas import BlogPostIn, BlogPostOut, BlogPostSummary
from app.slots import CLINIC_TZ

content_router = APIRouter(prefix="/api/content", tags=["Website content"])
blog_router = APIRouter(prefix="/api/blog", tags=["Blog"])
seo_router = APIRouter(tags=["SEO"])

POST_STATUSES = ("draft", "published")
RESERVED_SLUGS = {"manage", "tags"}


# ── Site content ─────────────────────────────────────────────────────────────

def load_content(db: Session) -> dict:
    return merged_content({row.key: row.value for row in db.query(SiteContent).all()})


def _clean_section(key: str, data: dict) -> dict:
    """Keep known fields of the right shape; trim text; drop empty list entries."""
    defaults = DEFAULT_CONTENT[key]
    clean = {}
    for field, value in data.items():
        if field not in defaults:
            continue
        default = defaults[field]
        if isinstance(default, str):
            if not isinstance(value, str):
                raise HTTPException(status_code=422, detail=f"{field} must be text")
            clean[field] = value.strip()
        elif isinstance(default, list):
            if not isinstance(value, list):
                raise HTTPException(status_code=422, detail=f"{field} must be a list")
            if default and isinstance(default[0], dict):
                keys = list(default[0])
                items = []
                for item in value:
                    if not isinstance(item, dict) or not all(isinstance(item.get(k, ""), str) for k in keys):
                        raise HTTPException(status_code=422, detail=f"{field} items need {', '.join(keys)}")
                    row = {k: item.get(k, "").strip() for k in keys}
                    if any(row.values()):
                        items.append(row)
                clean[field] = items
            else:
                if not all(isinstance(v, str) for v in value):
                    raise HTTPException(status_code=422, detail=f"{field} must be a list of text")
                clean[field] = [v.strip() for v in value if v.strip()]
    return clean


@content_router.get("")
def get_content(db: Session = Depends(get_db)):
    """Public — every section of website wording, defaults filled in."""
    return load_content(db)


@content_router.put("/{key}")
def save_content(key: str, data: dict = Body(...), db: Session = Depends(get_db), current_user=Depends(require_admin)):
    if key not in DEFAULT_CONTENT:
        raise HTTPException(status_code=404, detail="Unknown content section")
    clean = _clean_section(key, data)
    if key == "clinic" and "whatsapp_number" in clean:
        digits = re.sub(r"\D", "", clean["whatsapp_number"])
        if len(digits) < 10:
            raise HTTPException(status_code=422, detail="WhatsApp number needs the country code, e.g. 918019141096")
        clean["whatsapp_number"] = digits
    row = db.query(SiteContent).filter(SiteContent.key == key).first()
    if row:
        row.value = {**row.value, **clean}
        row.updated_by = current_user.id
    else:
        db.add(SiteContent(key=key, value=clean, updated_by=current_user.id))
    db.commit()
    return load_content(db)[key]


@content_router.delete("/{key}")
def reset_content(key: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Back to the default wording for this section."""
    if key not in DEFAULT_CONTENT:
        raise HTTPException(status_code=404, detail="Unknown content section")
    db.query(SiteContent).filter(SiteContent.key == key).delete()
    db.commit()
    return load_content(db)[key]


# ── Blog ─────────────────────────────────────────────────────────────────────

def reading_minutes(text: str) -> int:
    return max(1, math.ceil(len(re.findall(r"\w+", text or "")) / 200))


def _summary(p: BlogPost) -> BlogPostSummary:
    return BlogPostSummary(
        id=p.id, title=p.title, slug=p.slug, excerpt=p.excerpt, cover_image_url=p.cover_image_url,
        author_name=p.author_name, tags=p.tags or [], status=p.status, published_at=p.published_at,
        reading_minutes=reading_minutes(p.content), updated_at=p.updated_at,
    )


def _live(q):
    """Published and not scheduled for later."""
    return q.filter(BlogPost.status == "published", BlogPost.published_at <= datetime.now(CLINIC_TZ))


def _unique_slug(db: Session, wanted: str, exclude_id: Optional[int] = None) -> str:
    base = slugify(wanted)[:200]
    if base in RESERVED_SLUGS:
        base = f"{base}-post"
    slug, n = base, 2
    while db.query(BlogPost).filter(BlogPost.slug == slug, BlogPost.id != (exclude_id or 0)).first():
        slug, n = f"{base}-{n}", n + 1
    return slug


def _apply(db: Session, post: BlogPost, data: BlogPostIn):
    if data.status not in POST_STATUSES:
        raise HTTPException(status_code=422, detail="Status must be draft or published")
    post.title = data.title.strip()
    post.slug = _unique_slug(db, data.slug or data.title, exclude_id=post.id)
    post.excerpt = (data.excerpt or "").strip() or None
    post.content = data.content
    post.cover_image_url = (data.cover_image_url or "").strip() or None
    post.author_name = (data.author_name or "").strip() or None
    post.tags = sorted({t.strip() for t in data.tags if t.strip()}, key=str.lower)
    post.status = data.status
    post.seo_title = (data.seo_title or "").strip() or None
    post.seo_description = (data.seo_description or "").strip() or None
    if data.published_at:
        post.published_at = data.published_at
    elif data.status == "published" and not post.published_at:
        post.published_at = datetime.now(CLINIC_TZ)


@blog_router.get("", response_model=List[BlogPostSummary])
def list_posts(tag: Optional[str] = None, db: Session = Depends(get_db)):
    """Public — published posts, newest first."""
    posts = _live(db.query(BlogPost)).order_by(BlogPost.published_at.desc()).all()
    if tag:
        posts = [p for p in posts if tag.lower() in [t.lower() for t in (p.tags or [])]]
    return [_summary(p) for p in posts]


# Staff routes are declared before /{slug} so "manage" is never read as a post slug
@blog_router.get("/manage", response_model=List[BlogPostSummary])
def manage_list(search: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(BlogPost)
    if search:
        q = q.filter(or_(BlogPost.title.ilike(f"%{search}%"), BlogPost.excerpt.ilike(f"%{search}%")))
    return [_summary(p) for p in q.order_by(BlogPost.updated_at.desc().nullslast(), BlogPost.id.desc()).all()]


@blog_router.get("/manage/{post_id}", response_model=BlogPostOut)
def manage_get(post_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@blog_router.post("/manage", response_model=BlogPostOut, status_code=201)
def manage_create(data: BlogPostIn, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    post = BlogPost(created_by=current_user.id, author_name=current_user.name)
    _apply(db, post, data)
    post.author_name = post.author_name or current_user.name
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@blog_router.put("/manage/{post_id}", response_model=BlogPostOut)
def manage_update(post_id: int, data: BlogPostIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    _apply(db, post, data)
    db.commit()
    db.refresh(post)
    return post


@blog_router.delete("/manage/{post_id}")
def manage_delete(post_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"message": "Post deleted"}


@blog_router.get("/{slug}", response_model=BlogPostOut)
def get_post(slug: str, db: Session = Depends(get_db)):
    """Public — one published post."""
    post = _live(db.query(BlogPost)).filter(BlogPost.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


# ── Search engines ───────────────────────────────────────────────────────────

@seo_router.get("/sitemap.xml", include_in_schema=False)
def sitemap(request: Request, db: Session = Depends(get_db)):
    from app.seo import sitemap_xml, site_url
    return Response(sitemap_xml(db, site_url(request)), media_type="application/xml")


@seo_router.get("/robots.txt", include_in_schema=False)
def robots(request: Request):
    from app.seo import robots_txt, site_url
    return PlainTextResponse(robots_txt(site_url(request)))
