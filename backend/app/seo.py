"""Server-side SEO for the single-page app.

Search engines and link previews (WhatsApp, Facebook, LinkedIn) read the HTML before any
JavaScript runs, so every page is served with its own <title>, description, canonical URL,
Open Graph tags and schema.org data, built here from the editable site content.
"""
import html
import json
import re
from datetime import datetime
from typing import Optional
from xml.sax.saxutils import escape as xml_escape

from fastapi import Request
from sqlalchemy.orm import Session

from app.config import settings
from app.content import TREATMENT_DEFAULTS, slugify
from app.models.doctor import Doctor
from app.models.service import Service
from app.models.website import BlogPost
from app.slots import CLINIC_TZ

PRIVATE_PREFIXES = ("/admin", "/account", "/login", "/signup")
STATIC_PAGES = ("/", "/treatments", "/about", "/contact", "/blog")


def site_url(request: Request) -> str:
    """Public origin, e.g. https://srini-physio.onrender.com — SITE_URL wins (custom domain)."""
    return (settings.SITE_URL or str(request.base_url)).rstrip("/")


def api_url(request: Request) -> str:
    """This server's own address — for files it serves itself (e.g. patients' PDFs), which stay on
    the backend even when the website is deployed separately under SITE_URL."""
    return str(request.base_url).rstrip("/")


def _absolute(base: str, url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    return url if re.match(r"^https?://", url) else f"{base}/{url.lstrip('/')}"


def _plain(markdown: str, limit: int = 160) -> str:
    """A rough plain-text summary of Markdown for meta descriptions."""
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", markdown or "")
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[#>*_`~|-]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text if len(text) <= limit else text[: limit - 1].rsplit(" ", 1)[0] + "…"


def _services(db: Session):
    return db.query(Service).filter(Service.is_active == True).order_by(Service.display_order).all()


def service_slug(s: Service) -> str:
    return s.slug or slugify(s.name)


def _live_posts(db: Session):
    return db.query(BlogPost).filter(
        BlogPost.status == "published", BlogPost.published_at <= datetime.now(CLINIC_TZ),
    )


def postal_address(address: str) -> dict:
    """'1st Floor, GVR Sapphire, Above Masjid Banda, Kondapur, Hyderabad, Telangana 500084' → schema.org
    PostalAddress. City, state and PIN code are split off when present so Google can match them."""
    parts = [p.strip() for p in (address or "").split(",") if p.strip()]
    pin = None
    if parts:
        m = re.search(r"\b(\d{6})\b", parts[-1])
        if m:
            pin = m.group(1)
            parts[-1] = parts[-1].replace(pin, "").strip(" -")
            if not parts[-1]:
                parts.pop()
    if parts and parts[-1].lower() == "telangana":
        parts.pop()
    if parts and parts[-1].lower() == "hyderabad":
        parts.pop()
    out = {"@type": "PostalAddress", "streetAddress": ", ".join(parts) or address,
           "addressLocality": "Hyderabad", "addressRegion": "Telangana", "addressCountry": "IN"}
    if pin:
        out["postalCode"] = pin
    return out


DAY_CODES = {"mon": "Mo", "tue": "Tu", "wed": "We", "thu": "Th", "fri": "Fr", "sat": "Sa", "sun": "Su"}


def opening_hours_spec(text: str) -> Optional[str]:
    """'Mon–Sat 9 AM – 8 PM' → 'Mo-Sa 09:00-20:00' (schema.org openingHours); None if it can't be read."""
    m = re.match(r"\s*([A-Za-z]{3})\w*\s*[–-]\s*([A-Za-z]{3})\w*\s+(\d{1,2})(?::(\d{2}))?\s*([AP]M)\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*([AP]M)",
                 text or "", re.I)
    if not m or m.group(1).lower() not in DAY_CODES or m.group(2).lower() not in DAY_CODES:
        return None

    def hhmm(h, mins, ampm):
        h = int(h) % 12 + (12 if ampm.upper() == "PM" else 0)
        return f"{h:02d}:{mins or '00'}"

    return (f"{DAY_CODES[m.group(1).lower()]}-{DAY_CODES[m.group(2).lower()]} "
            f"{hhmm(m.group(3), m.group(4), m.group(5))}-{hhmm(m.group(6), m.group(7), m.group(8))}")


def clinic_jsonld(content: dict, base: str, db: Session) -> dict:
    clinic, seo = content["clinic"], content["seo"]
    lead = db.query(Doctor).filter(Doctor.is_active == True).order_by(Doctor.display_order, Doctor.id).first()
    data = {
        "@context": "https://schema.org",
        "@type": ["MedicalClinic", "Physiotherapy"],
        "name": clinic["name"],
        "url": base + "/",
        "image": _absolute(base, seo["share_image"]),
        "logo": _absolute(base, "/brand/logo-mark.png"),
        "description": seo["default_description"],
        "telephone": clinic["phone_display"] or None,
        "email": clinic["email"] or None,
        "address": postal_address(clinic["address"]),
        "hasMap": clinic["map_link"] or None,
        "openingHours": opening_hours_spec(clinic["opening_hours"]),
        "sameAs": [f"https://wa.me/{clinic['whatsapp_number']}"] if clinic["whatsapp_number"] else None,
        "contactPoint": {"@type": "ContactPoint", "contactType": "appointments", "telephone": clinic["phone_display"],
                         "url": f"https://wa.me/{clinic['whatsapp_number']}"} if clinic["whatsapp_number"] else None,
        "medicalSpecialty": "Physiotherapy",
        "availableService": [{"@type": "MedicalTherapy", "name": s.name} for s in _services(db)],
    }
    if lead:
        data["employee"] = {"@type": "Person", "name": lead.name, "jobTitle": lead.qualification or "Physiotherapist"}
    return {k: v for k, v in data.items() if v not in (None, "", [])}


def page_meta(db: Session, path: str, content: dict, base: str) -> dict:
    """Title, description, image, robots and structured data for one URL path."""
    seo = content["seo"]
    path = "/" + path.strip("/") if path.strip("/") else "/"

    def titled(t):
        return f"{t} | {seo['title_suffix']}" if t else seo["site_title"]

    meta = {
        "title": seo["site_title"], "description": seo["default_description"],
        "image": seo["share_image"], "type": "website", "canonical": base + path,
        "noindex": False, "jsonld": [clinic_jsonld(content, base, db)],
    }

    def from_section(key, fallback_title):
        sec = content[key]
        meta["title"] = titled(sec.get("seo_title") or fallback_title)
        meta["description"] = sec.get("seo_description") or seo["default_description"]

    if path == "/":
        home = content["home"]
        meta["title"] = home["seo_title"] or seo["site_title"]
        meta["description"] = home["seo_description"] or seo["default_description"]
        meta["canonical"] = base + "/"
    elif path == "/treatments":
        from_section("treatments", "Treatments")
    elif path == "/about":
        from_section("about", "About")
    elif path == "/contact":
        from_section("contact", "Contact")
        meta["jsonld"].append({
            "@context": "https://schema.org", "@type": "FAQPage",
            "mainEntity": [{"@type": "Question", "name": f["question"],
                            "acceptedAnswer": {"@type": "Answer", "text": f["answer"]}}
                           for f in content["contact"]["faqs"] if f.get("question") and f.get("answer")],
        })
    elif path == "/blog":
        from_section("blog", "Blog")
    elif path.startswith("/treatments/"):
        slug = path.split("/", 2)[2]
        service = next((s for s in _services(db) if service_slug(s) == slug), None)
        if service:
            meta["title"] = titled(service.seo_title or service.name)
            meta["description"] = service.seo_description or service.description or _plain(service.about or "") or meta["description"]
            meta["image"] = service.image_url or TREATMENT_DEFAULTS.get(service.name, {}).get("image") or meta["image"]
        else:
            meta.update(title=titled("Page not found"), noindex=True)
    elif path.startswith("/blog/"):
        slug = path.split("/", 2)[2]
        post = _live_posts(db).filter(BlogPost.slug == slug).first()
        if post:
            meta.update(
                title=titled(post.seo_title or post.title),
                description=post.seo_description or post.excerpt or _plain(post.content) or meta["description"],
                image=post.cover_image_url or meta["image"], type="article",
            )
            meta["published"] = post.published_at.isoformat() if post.published_at else None
            meta["jsonld"].append({
                "@context": "https://schema.org", "@type": "BlogPosting",
                "headline": post.title, "description": meta["description"],
                "image": _absolute(base, meta["image"]), "url": base + path,
                "datePublished": meta["published"],
                "dateModified": (post.updated_at or post.published_at).isoformat() if (post.updated_at or post.published_at) else None,
                "author": {"@type": "Person", "name": post.author_name or content["clinic"]["name"]},
                "publisher": {"@type": "Organization", "name": content["clinic"]["name"],
                              "logo": {"@type": "ImageObject", "url": _absolute(base, "/brand/logo-mark.png")}},
                "keywords": ", ".join(post.tags or []) or None,
            })
        else:
            meta.update(title=titled("Post not found"), noindex=True)
    elif path.startswith(PRIVATE_PREFIXES):
        meta.update(title=titled("Sign in" if path in ("/login", "/signup") else "Account"), noindex=True)
    else:
        meta.update(title=titled("Page not found"), noindex=True)

    meta["image"] = _absolute(base, meta["image"])
    return meta


def head_tags(meta: dict, content: dict) -> str:
    a = lambda v: html.escape(str(v), quote=True)  # noqa: E731
    tags = [
        f"<title>{html.escape(meta['title'])}</title>",
        f'<meta name="description" content="{a(meta["description"])}" />',
        f'<link rel="canonical" href="{a(meta["canonical"])}" />',
        f'<meta name="robots" content="{"noindex, nofollow" if meta["noindex"] else "index, follow, max-image-preview:large"}" />',
        f'<meta property="og:type" content="{a(meta["type"])}" />',
        f'<meta property="og:site_name" content="{a(content["clinic"]["name"])}" />',
        f'<meta property="og:title" content="{a(meta["title"])}" />',
        f'<meta property="og:description" content="{a(meta["description"])}" />',
        f'<meta property="og:url" content="{a(meta["canonical"])}" />',
        '<meta property="og:locale" content="en_IN" />',
        '<meta name="twitter:card" content="summary_large_image" />',
        f'<meta name="twitter:title" content="{a(meta["title"])}" />',
        f'<meta name="twitter:description" content="{a(meta["description"])}" />',
    ]
    if meta.get("image"):
        tags += [f'<meta property="og:image" content="{a(meta["image"])}" />',
                 f'<meta name="twitter:image" content="{a(meta["image"])}" />']
    if meta.get("published"):
        tags.append(f'<meta property="article:published_time" content="{a(meta["published"])}" />')
    if content["seo"]["google_site_verification"]:
        tags.append(f'<meta name="google-site-verification" content="{a(content["seo"]["google_site_verification"])}" />')
    if not meta["noindex"]:
        for block in meta["jsonld"]:
            tags.append(f'<script type="application/ld+json">{_safe_json(block)}</script>')
    return "\n    ".join(tags)


def _safe_json(data) -> str:
    """JSON that can't close the surrounding <script> tag."""
    return json.dumps(data, ensure_ascii=False).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")


def render_index(index_html: str, meta: dict, content: dict) -> str:
    """index.html with this page's head tags, and the site content preloaded for the app."""
    # index.html carries static fallback SEO tags for static hosting; the per-page ones below replace them
    page = re.sub(r"<!-- static-seo -->.*?<!-- /static-seo -->\s*", "", index_html, flags=re.S)
    page = re.sub(r"<title>.*?</title>\s*", "", page, flags=re.S)
    page = re.sub(r'<meta\s+name="description"[^>]*>\s*', "", page)
    preload = f"<script>window.__SITE_CONTENT__ = {_safe_json(content)};</script>"
    return page.replace("</head>", f"    {head_tags(meta, content)}\n    {preload}\n  </head>", 1)


def sitemap_xml(db: Session, base: str) -> str:
    urls = [(base + p if p != "/" else base + "/", None) for p in STATIC_PAGES]
    urls += [(f"{base}/treatments/{service_slug(s)}", None) for s in _services(db)]
    for post in _live_posts(db).order_by(BlogPost.published_at.desc()).all():
        modified = post.updated_at or post.published_at
        urls.append((f"{base}/blog/{post.slug}", modified.date().isoformat() if modified else None))
    rows = "".join(
        f"\n  <url><loc>{xml_escape(loc)}</loc>" + (f"<lastmod>{lastmod}</lastmod>" if lastmod else "") + "</url>"
        for loc, lastmod in urls
    )
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{rows}\n</urlset>\n'


def robots_txt(base: str) -> str:
    # /api stays crawlable (search engines fetch it while rendering pages), except patients' documents
    disallow = "\n".join(f"Disallow: {p}" for p in PRIVATE_PREFIXES + ("/api/documents/",))
    return f"User-agent: *\n{disallow}\n\nSitemap: {base}/sitemap.xml\n"
