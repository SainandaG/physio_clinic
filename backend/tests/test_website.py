"""Editable website content, the blog, treatment pages and server-side SEO."""
import json
import re
from datetime import datetime, timedelta

import pytest

from app.database import SessionLocal
from app.seo import page_meta, render_index
from app.routes.website import load_content
from app.slots import CLINIC_TZ

BASE = "https://clinic.example.com"


def post_body(**overrides):
    return {"title": "Five ways to ease a stiff neck", "excerpt": "Desk habits that help.",
            "content": "## Move often\n\nStand up every **30 minutes**.", "tags": ["Neck pain"], "status": "published", **overrides}


def create_post(client, headers, **overrides):
    r = client.post("/api/blog/manage", headers=headers, json=post_body(**overrides))
    assert r.status_code == 201, r.text
    return r.json()


def meta_for(path):
    db = SessionLocal()
    try:
        content = load_content(db)
        return page_meta(db, path, content, BASE), content
    finally:
        db.close()


# ── Site content ─────────────────────────────────────────────────────────────

class TestContent:
    def test_defaults_are_served_publicly(self, client):
        c = client.get("/api/content").json()
        assert set(c) == {"clinic", "seo", "home", "about", "treatments", "contact", "blog", "letterhead"}
        assert c["home"]["title_line_1"] == "Move better."
        assert c["clinic"]["whatsapp_number"] == "918019141096"

    def test_admin_edits_go_live_and_untouched_fields_keep_defaults(self, client, admin):
        r = client.put("/api/content/home", headers=admin, json={"title_line_1": "  Move freely.  "})
        assert r.status_code == 200
        home = client.get("/api/content").json()["home"]
        assert home["title_line_1"] == "Move freely."          # trimmed
        assert home["title_line_2"] == "Recover stronger."     # default kept

    def test_later_saves_merge_with_earlier_ones(self, client, admin):
        client.put("/api/content/about", headers=admin, json={"hero_title": "First"})
        client.put("/api/content/about", headers=admin, json={"hero_intro": "Second"})
        about = client.get("/api/content").json()["about"]
        assert (about["hero_title"], about["hero_intro"]) == ("First", "Second")

    def test_reset_restores_the_original_wording(self, client, admin):
        client.put("/api/content/home", headers=admin, json={"title_line_1": "Changed"})
        r = client.delete("/api/content/home", headers=admin)
        assert r.json()["title_line_1"] == "Move better."

    def test_lists_and_items_are_cleaned(self, client, admin):
        r = client.put("/api/content/contact", headers=admin, json={"faqs": [
            {"question": " Parking? ", "answer": "Yes, outside."}, {"question": "", "answer": ""},
        ]})
        assert r.json()["faqs"] == [{"question": "Parking?", "answer": "Yes, outside."}]
        r = client.put("/api/content/about", headers=admin, json={"expect_points": ["One", "  ", "Two"]})
        assert r.json()["expect_points"] == ["One", "Two"]

    def test_unknown_fields_are_ignored(self, client, admin):
        client.put("/api/content/home", headers=admin, json={"made_up": "x", "eyebrow": "Hello"})
        home = client.get("/api/content").json()["home"]
        assert "made_up" not in home and home["eyebrow"] == "Hello"

    @pytest.mark.parametrize("body", [{"eyebrow": 5}, {"doctor_points": "not a list"}, {"steps": [{"title": 1, "text": "x"}]}])
    def test_wrong_shapes_are_rejected(self, client, admin, body):
        assert client.put("/api/content/home", headers=admin, json=body).status_code == 422

    def test_whatsapp_number_is_normalised_and_checked(self, client, admin):
        assert client.put("/api/content/clinic", headers=admin, json={"whatsapp_number": "+91 80191 41096"}).json()["whatsapp_number"] == "918019141096"
        assert client.put("/api/content/clinic", headers=admin, json={"whatsapp_number": "12345"}).status_code == 422

    def test_unknown_section(self, client, admin):
        assert client.put("/api/content/nope", headers=admin, json={}).status_code == 404

    def test_only_admins_can_edit(self, client, receptionist, signup):
        patient, _ = signup()
        assert client.put("/api/content/home", headers=receptionist, json={"eyebrow": "x"}).status_code == 403
        assert client.put("/api/content/home", headers=patient, json={"eyebrow": "x"}).status_code == 403
        assert client.put("/api/content/home", json={"eyebrow": "x"}).status_code == 401
        assert client.delete("/api/content/home", headers=receptionist).status_code == 403


# ── Blog ─────────────────────────────────────────────────────────────────────

class TestBlog:
    def test_published_post_is_public(self, client, admin):
        p = create_post(client, admin)
        assert p["slug"] == "five-ways-to-ease-a-stiff-neck"
        assert p["published_at"] and p["author_name"] == "Test Admin"
        listed = client.get("/api/blog").json()
        assert [x["slug"] for x in listed] == [p["slug"]]
        assert "content" not in listed[0] and listed[0]["reading_minutes"] == 1
        assert client.get(f"/api/blog/{p['slug']}").json()["content"].startswith("## Move often")

    def test_drafts_stay_private(self, client, admin):
        p = create_post(client, admin, status="draft")
        assert p["published_at"] is None
        assert client.get("/api/blog").json() == []
        assert client.get(f"/api/blog/{p['slug']}").status_code == 404
        assert [x["id"] for x in client.get("/api/blog/manage", headers=admin).json()] == [p["id"]]

    def test_scheduled_posts_appear_only_from_their_date(self, client, admin):
        later = (datetime.now(CLINIC_TZ) + timedelta(days=3)).isoformat()
        p = create_post(client, admin, published_at=later)
        assert client.get("/api/blog").json() == []
        assert client.get(f"/api/blog/{p['slug']}").status_code == 404

    def test_unpublishing_hides_the_post_but_keeps_its_date(self, client, admin):
        p = create_post(client, admin)
        r = client.put(f"/api/blog/manage/{p['id']}", headers=admin, json=post_body(status="draft"))
        assert r.json()["published_at"] == p["published_at"]
        assert client.get("/api/blog").json() == []

    def test_republishing_keeps_the_original_date(self, client, admin):
        p = create_post(client, admin)
        r = client.put(f"/api/blog/manage/{p['id']}", headers=admin, json=post_body(title="Five ways to ease a stiff neck (updated)"))
        assert r.json()["published_at"] == p["published_at"]

    def test_slugs_are_unique_and_never_reserved(self, client, admin):
        a = create_post(client, admin)
        b = create_post(client, admin)
        assert b["slug"] == f"{a['slug']}-2"
        assert create_post(client, admin, title="Manage", slug="manage")["slug"] == "manage-post"
        custom = create_post(client, admin, slug="Knee Pain: What Helps?")
        assert custom["slug"] == "knee-pain-what-helps"

    def test_editing_keeps_its_own_slug(self, client, admin):
        p = create_post(client, admin)
        r = client.put(f"/api/blog/manage/{p['id']}", headers=admin, json=post_body(slug=p["slug"]))
        assert r.json()["slug"] == p["slug"]

    def test_filter_by_topic(self, client, admin):
        create_post(client, admin, title="Runner's knee", tags=["Running", "Knee pain"])
        create_post(client, admin, title="Desk neck", tags=["Neck pain"])
        assert [p["title"] for p in client.get("/api/blog", params={"tag": "running"}).json()] == ["Runner's knee"]

    def test_tags_are_tidied(self, client, admin):
        p = create_post(client, admin, tags=[" Running ", "", "Running", "knee"])
        assert p["tags"] == ["knee", "Running"]

    def test_invalid_status_and_title(self, client, admin):
        assert client.post("/api/blog/manage", headers=admin, json=post_body(status="live")).status_code == 422
        assert client.post("/api/blog/manage", headers=admin, json=post_body(title="Hi")).status_code == 422

    def test_receptionists_can_write_posts(self, client, receptionist):
        assert create_post(client, receptionist)["author_name"] == "Front Desk"

    def test_patients_and_visitors_cannot_manage_posts(self, client, admin, signup):
        p = create_post(client, admin)
        patient, _ = signup()
        for headers in (patient, {}):
            assert client.get("/api/blog/manage", headers=headers).status_code in (401, 403)
            assert client.post("/api/blog/manage", headers=headers, json=post_body()).status_code in (401, 403)
            assert client.delete(f"/api/blog/manage/{p['id']}", headers=headers).status_code in (401, 403)

    def test_delete(self, client, admin):
        p = create_post(client, admin)
        assert client.delete(f"/api/blog/manage/{p['id']}", headers=admin).status_code == 200
        assert client.get(f"/api/blog/manage/{p['id']}", headers=admin).status_code == 404


# ── Treatment pages ─────────────────────────────────────────────────────────

class TestTreatmentPages:
    def test_seeded_treatments_have_pages(self, client):
        services = {s["name"]: s for s in client.get("/api/services").json()}
        dn = services["Dry Needling"]
        assert dn["slug"] == "dry-needling"
        assert dn["about"] and dn["helps_with"] and dn["expect"] and dn["note"]
        assert dn["description"].startswith("Fine, sterile needles")

    def test_new_service_gets_a_unique_slug(self, client, admin):
        a = client.post("/api/services", headers=admin, json={"name": "Shockwave Therapy"}).json()
        b = client.post("/api/services", headers=admin, json={"name": "Shockwave therapy"}).json()
        assert (a["slug"], b["slug"]) == ("shockwave-therapy", "shockwave-therapy-2")

    def test_page_text_can_be_edited(self, client, admin):
        sid = next(s["id"] for s in client.get("/api/services").json() if s["slug"] == "cupping")
        r = client.put(f"/api/services/{sid}", headers=admin, json={
            "about": "New text", "helps_with": ["A", " ", "B"], "slug": "Cupping Therapy", "seo_title": "Cupping in Kondapur",
        })
        assert r.status_code == 200
        body = r.json()
        assert (body["about"], body["helps_with"], body["slug"], body["seo_title"]) == ("New text", ["A", "B"], "cupping-therapy", "Cupping in Kondapur")

    def test_slug_cannot_clash(self, client, admin):
        sid = next(s["id"] for s in client.get("/api/services").json() if s["slug"] == "cupping")
        assert client.put(f"/api/services/{sid}", headers=admin, json={"slug": "dry-needling"}).json()["slug"] == "dry-needling-2"


# ── SEO ─────────────────────────────────────────────────────────────────────

class TestSeo:
    def test_robots_blocks_private_pages_and_points_to_sitemap(self, client):
        text = client.get("/robots.txt").text
        for path in ("/admin", "/account", "/login", "/signup"):
            assert f"Disallow: {path}" in text
        lines = text.splitlines()
        assert "Disallow: /api" not in lines and "Disallow: /api/" not in lines   # rendering data stays crawlable
        assert "Sitemap: http://testserver/sitemap.xml" in text

    def test_sitemap_lists_pages_treatments_and_published_posts(self, client, admin):
        live = create_post(client, admin, title="Live article")
        draft = create_post(client, admin, title="Draft article", status="draft")
        r = client.get("/sitemap.xml")
        assert r.headers["content-type"].startswith("application/xml")
        locs = re.findall(r"<loc>([^<]+)</loc>", r.text)
        for path in ("/", "/treatments", "/about", "/contact", "/blog", "/treatments/dry-needling", f"/blog/{live['slug']}"):
            assert f"http://testserver{path}" in locs
        assert f"http://testserver/blog/{draft['slug']}" not in locs
        assert "<lastmod>" in r.text

    def test_site_url_setting_wins(self, client, monkeypatch):
        from app.config import settings
        monkeypatch.setattr(settings, "SITE_URL", "https://sriniphysio.in/")
        assert "<loc>https://sriniphysio.in/about</loc>" in client.get("/sitemap.xml").text

    def test_home_page_meta_and_clinic_data(self, client):
        meta, _ = meta_for("/")
        assert meta["title"].startswith("Srini Physio Clinics")
        assert meta["canonical"] == BASE + "/"
        clinic = meta["jsonld"][0]
        assert "Physiotherapy" in clinic["@type"] and clinic["address"]["addressLocality"] == "Hyderabad"
        assert {"@type": "MedicalTherapy", "name": "Dry Needling"} in clinic["availableService"]

    def test_edited_seo_text_is_used(self, client, admin):
        client.put("/api/content/about", headers=admin, json={"seo_title": "About our physios", "seo_description": "Who we are."})
        meta, _ = meta_for("/about")
        assert meta["title"] == "About our physios | Srini Physio Clinics, Kondapur"
        assert meta["description"] == "Who we are."

    def test_treatment_page_meta(self, client):
        meta, _ = meta_for("/treatments/dry-needling")
        assert meta["title"] == "Dry Needling | Srini Physio Clinics, Kondapur"
        assert meta["description"].startswith("Fine, sterile needles")
        assert meta["image"] == BASE + "/treatments/dry-needling.jpg"

    def test_post_meta_has_article_data(self, client, admin):
        p = create_post(client, admin, seo_description="Neck tips.", cover_image_url="/treatments/manual-therapy.jpg")
        meta, _ = meta_for(f"/blog/{p['slug']}")
        assert meta["type"] == "article" and meta["description"] == "Neck tips."
        article = next(j for j in meta["jsonld"] if j["@type"] == "BlogPosting")
        assert article["headline"] == p["title"] and article["author"]["name"] == "Test Admin"
        assert article["image"] == BASE + "/treatments/manual-therapy.jpg"

    def test_contact_page_sends_faqs_to_google(self, client):
        meta, content = meta_for("/contact")
        faq = next(j for j in meta["jsonld"] if j["@type"] == "FAQPage")
        assert len(faq["mainEntity"]) == len(content["contact"]["faqs"])

    @pytest.mark.parametrize("path", ["/admin/dashboard", "/account", "/login", "/treatments/nope", "/blog/nope", "/random"])
    def test_private_and_missing_pages_are_not_indexed(self, client, path):
        assert meta_for(path)[0]["noindex"] is True

    def test_drafts_are_not_indexed(self, client, admin):
        p = create_post(client, admin, status="draft")
        assert meta_for(f"/blog/{p['slug']}")[0]["noindex"] is True

    def test_render_index_replaces_head_and_preloads_content(self, client):
        index = '<html><head><title>Old</title>\n<meta name="description" content="old" />\n</head><body><div id="root"></div></body></html>'
        meta, content = meta_for("/about")
        page = render_index(index, meta, content)
        assert page.count("<title>") == 1 and "<title>Old</title>" not in page
        assert 'content="old"' not in page
        assert f'<link rel="canonical" href="{BASE}/about" />' in page
        assert 'property="og:image"' in page and "application/ld+json" in page
        preload = re.search(r"window.__SITE_CONTENT__ = (.*?);</script>", page).group(1)
        assert json.loads(preload)["home"]["title_line_1"] == "Move better."

    def test_render_index_cannot_be_broken_out_of(self, client, admin):
        evil = '</script><script>alert(1)</script>"><img src=x onerror=alert(1)>'
        client.put("/api/content/clinic", headers=admin, json={"name": evil})
        client.put("/api/content/about", headers=admin, json={"seo_title": evil})
        meta, content = meta_for("/about")
        page = render_index("<html><head><title>x</title></head><body></body></html>", meta, content)
        assert "<script>alert(1)" not in page
        assert "<img src=x" not in page
