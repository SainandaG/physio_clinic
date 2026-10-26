"""Smoke test for a running deployment (the production Docker image, or the live site).

    python scripts/smoke_test.py https://srini-physio.onrender.com

Checks the health endpoint, that the website and its client-side routes load, that static
assets are served, and that unknown API paths return JSON errors. Set SMOKE_ADMIN_EMAIL and
SMOKE_ADMIN_PASSWORD to also check that staff sign-in works. Waits up to SMOKE_WAIT seconds
(default 90) for the service to come up — a sleeping free Render instance takes about a minute.
Standard library only.
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000").rstrip("/")
failures = []


def fetch(path, data=None, headers=None):
    req = urllib.request.Request(BASE + path, data=data, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.headers.get("content-type", ""), r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("content-type", ""), e.read()


def check(name, ok, info=""):
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  ({info})" if info and not ok else ""))
    if not ok:
        failures.append(name)


def wait_until_up():
    deadline = time.time() + int(os.environ.get("SMOKE_WAIT", "90"))
    while True:
        try:
            if fetch("/api/health")[0] == 200:
                return True
        except OSError:
            pass
        if time.time() > deadline:
            return False
        time.sleep(3)


print(f"Smoke testing {BASE}")
if not wait_until_up():
    print("  FAIL  service did not become healthy in time")
    sys.exit(1)

status, ctype, body = fetch("/api/health")
check("health check", status == 200 and json.loads(body).get("status") == "ok", f"{status} {body[:100]!r}")

status, ctype, home = fetch("/")
check("home page loads", status == 200 and "text/html" in ctype and b'id="root"' in home, f"{status} {ctype}")

for route in ("/treatments/dry-needling", "/login", "/admin/dashboard", "/account"):
    status, ctype, body = fetch(route)
    check(f"page refresh works on {route}", status == 200 and b'id="root"' in body, f"{status} {ctype}")

assets = re.findall(rb'(?:src|href)="(/assets/[^"]+)"', home)
check("page references built assets", bool(assets))
for asset in assets[:3]:
    status, _, _ = fetch(asset.decode())
    check(f"asset {asset.decode()}", status == 200, str(status))

check("home page has its SEO tags", b'property="og:title"' in home and b'rel="canonical"' in home and b"application/ld+json" in home)
check("home page preloads site content", b"window.__SITE_CONTENT__" in home)
status, _, body = fetch("/treatments/dry-needling")
check("treatment page has its own title", re.search(rb"<title>[^<]*Dry Needling", body) is not None)
status, _, body = fetch("/admin/dashboard")
check("admin pages are hidden from search", b"noindex" in body)

status, ctype, body = fetch("/robots.txt")
check("robots.txt", status == 200 and b"Disallow: /admin" in body and b"Sitemap:" in body, f"{status}")
status, ctype, body = fetch("/sitemap.xml")
check("sitemap.xml", status == 200 and "xml" in ctype and b"/treatments/dry-needling</loc>" in body, f"{status} {ctype}")
status, _, body = fetch("/api/content")
check("website content API", status == 200 and "home" in json.loads(body), str(status))
status, _, body = fetch("/api/blog")
check("blog API", status == 200 and isinstance(json.loads(body), list), str(status))
status, _, body = fetch("/blog")
check("blog page loads", status == 200 and b'id="root"' in body, str(status))

status, ctype, _ = fetch("/brand/logo-mark.png")
check("brand logo served", status == 200 and "image" in ctype, f"{status} {ctype}")

status, ctype, body = fetch("/api/services")
check("public API answers", status == 200 and isinstance(json.loads(body), list), f"{status}")

status, ctype, _ = fetch("/api/does-not-exist")
check("unknown API path is a JSON 404", status == 404 and "json" in ctype, f"{status} {ctype}")

status, _, _ = fetch("/api/dashboard/stats")
check("staff data needs sign-in", status == 401, str(status))

email, password = os.environ.get("SMOKE_ADMIN_EMAIL"), os.environ.get("SMOKE_ADMIN_PASSWORD")
if email and password:
    form = urllib.parse.urlencode({"username": email, "password": password}).encode()
    status, _, body = fetch("/api/auth/login", form, {"Content-Type": "application/x-www-form-urlencoded"})
    ok = status == 200
    check("admin can sign in", ok, str(status))
    if ok:
        token = json.loads(body)["access_token"]
        status, _, _ = fetch("/api/dashboard/overview", headers={"Authorization": f"Bearer {token}"})
        check("admin dashboard data loads", status == 200, str(status))
else:
    print("  SKIP  admin sign-in (set SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD)")

print(f"\n{'All checks passed' if not failures else f'{len(failures)} check(s) failed'}")
sys.exit(1 if failures else 0)
