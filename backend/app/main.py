from pathlib import Path
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from sqlalchemy import text, inspect
from app.database import engine, Base, SessionLocal
from app.routes import (
    auth_router, patients_router, appointments_router,
    services_router, enquiries_router, dashboard_router, schedule_router, doctors_router, portal_router,
    content_router, blog_router, seo_router, summaries_router, documents_router,
)

# Import all models so SQLAlchemy can create their tables
import app.models  # noqa: F401

app = FastAPI(
    title="Srini Physio Clinics API",
    description="Backend API for Srini Physio Clinics — patient management, appointments and enquiries",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(appointments_router)
app.include_router(services_router)
app.include_router(enquiries_router)
app.include_router(dashboard_router)
app.include_router(schedule_router)
app.include_router(doctors_router)
app.include_router(portal_router)
app.include_router(content_router)
app.include_router(blog_router)
app.include_router(seo_router)
app.include_router(summaries_router)
app.include_router(documents_router)


@app.on_event("startup")
def startup():
    """Create tables and seed default admin + services on first run."""
    Base.metadata.create_all(bind=engine)
    _upgrade_schema()
    _seed_data()
    _assign_default_doctor()
    _fill_treatment_pages()


def _upgrade_schema():
    """create_all() doesn't add columns to existing tables — add any model column the database lacks.
    Added columns are nullable; defaults are applied by the models when rows are written."""
    insp = inspect(engine)
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            existing = {c["name"] for c in insp.get_columns(table.name)}
            for col in table.columns:
                if col.name in existing:
                    continue
                ddl = f'ALTER TABLE {table.name} ADD COLUMN IF NOT EXISTS "{col.name}" {col.type.compile(dialect=engine.dialect)}'
                for fk in col.foreign_keys:
                    ddl += f" REFERENCES {fk.column.table.name}({fk.column.name})"
                conn.execute(text(ddl))
                print(f"[OK] Added column {table.name}.{col.name}")


def _assign_default_doctor():
    """Bookings made before doctors existed belong to the lead doctor."""
    with engine.begin() as conn:
        lead = conn.execute(text(
            "SELECT id FROM doctors WHERE is_active ORDER BY display_order, id LIMIT 1"
        )).scalar()
        if lead:
            conn.execute(text("UPDATE appointments SET doctor_id = :d WHERE doctor_id IS NULL"), {"d": lead})
            conn.execute(text("UPDATE enquiries SET doctor_id = :d WHERE doctor_id IS NULL"), {"d": lead})


# Card text the first version seeded; replaced by the treatment-page tagline when the page content is filled in
_FIRST_SEED_DESCRIPTIONS = {
    "Modalities that support pain management and rehabilitation when clinically appropriate.",
    "Progressive strength, mobility, balance and conditioning aligned with your goals.",
    "Hands-on assessment and care, as part of a broader recovery plan.",
    "A clinician-led technique for selected muscle-related symptoms after screening.",
    "An optional adjunct some people use for muscle discomfort and recovery.",
    "Supportive taping to help with movement confidence or symptom management during activity.",
}


def _fill_treatment_pages():
    """Give every service a URL slug, and the six standard treatments their default page wording,
    so it can be edited in Admin → Services. Never overwrites wording that has been edited."""
    from app.models.service import Service
    from app.content import TREATMENT_DEFAULTS, slugify

    db = SessionLocal()
    try:
        taken = {s.slug for s in db.query(Service).filter(Service.slug.isnot(None))}
        for s in db.query(Service).order_by(Service.id).all():
            if not s.slug:
                base = slug = TREATMENT_DEFAULTS.get(s.name, {}).get("slug") or slugify(s.name)
                n = 2
                while slug in taken:
                    slug, n = f"{base}-{n}", n + 1
                s.slug = slug
                taken.add(slug)
            d = TREATMENT_DEFAULTS.get(s.name)
            if d and s.about is None:
                s.about, s.helps_with, s.expect, s.note = d["about"], d["helps_with"], d["expect"], d["note"]
                if not s.description or s.description in _FIRST_SEED_DESCRIPTIONS:
                    s.description = d["tagline"]
        db.commit()
    finally:
        db.close()


def _seed_data():
    from app.models.user import User
    from app.models.service import Service
    from app.models.doctor import Doctor
    from app.auth import hash_password

    db = SessionLocal()
    try:
        # Seed admin (never with a blank password — e.g. an unset secret on the host)
        if not settings.ADMIN_PASSWORD:
            print("[WARN] ADMIN_PASSWORD is empty — admin account not created")
        elif not db.query(User).filter(User.email == settings.ADMIN_EMAIL).first():
            admin = User(
                name=settings.ADMIN_NAME,
                email=settings.ADMIN_EMAIL,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                role="admin",
            )
            db.add(admin)
            db.commit()
            print(f"[OK] Admin user created: {settings.ADMIN_EMAIL}")

        # Seed the clinic's physiotherapist — details as published on the clinic website; edit in Admin → Doctors
        if db.query(Doctor).count() == 0:
            db.add(Doctor(
                name="Dr Tharun",
                qualification="MPT (Sports & Manual Therapy)",
                specialization="Sports injuries, manual therapy & rehabilitation",
                display_order=1,
            ))
            db.commit()
            print("[OK] Default doctor seeded")

        # Seed services
        if db.query(Service).count() == 0:
            services = [
                Service(name="Electrotherapy", icon="⚡", display_order=1,
                    description="Modalities that support pain management and rehabilitation when clinically appropriate.",
                    whatsapp_message="Hello, I'm interested in Electrotherapy treatment at Srini Physio Clinics."),
                Service(name="Rehab Gym & Exercise", icon="🏋️", display_order=2,
                    description="Progressive strength, mobility, balance and conditioning aligned with your goals.",
                    whatsapp_message="Hello, I'm interested in Rehab Gym & Exercise therapy at Srini Physio Clinics."),
                Service(name="Manual Therapy", icon="👐", display_order=3,
                    description="Hands-on assessment and care, as part of a broader recovery plan.",
                    whatsapp_message="Hello, I'm interested in Manual Therapy at Srini Physio Clinics."),
                Service(name="Dry Needling", icon="🎯", display_order=4,
                    description="A clinician-led technique for selected muscle-related symptoms after screening.",
                    whatsapp_message="Hello, I'm interested in Dry Needling at Srini Physio Clinics."),
                Service(name="Cupping Therapy", icon="⭕", display_order=5,
                    description="An optional adjunct some people use for muscle discomfort and recovery.",
                    whatsapp_message="Hello, I'm interested in Cupping Therapy at Srini Physio Clinics."),
                Service(name="Chiropractic Care", icon="🦴", display_order=7,
                    description="Hands-on adjustment of the spine and joints to ease stiffness and help you move freely.",
                    whatsapp_message="Hello, I'm interested in Chiropractic Care at Srini Physio Clinics."),
                Service(name="Kinesiology Taping", icon="〰️", display_order=6,
                    description="Supportive taping to help with movement confidence or symptom management during activity.",
                    whatsapp_message="Hello, I'm interested in Kinesiology Taping at Srini Physio Clinics."),
            ]
            db.add_all(services)
            db.commit()
            print("[OK] Default services seeded")
    finally:
        db.close()


@app.get("/api/health")
def health():
    """Liveness check for the host; also confirms the database answers."""
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok"}


# ── Production: serve the built React app from the same service ────────────────
# Registered last so every API route above wins. Unknown /api paths stay JSON 404s;
# any other path that isn't a real file gets index.html so client-side routes work on refresh.
DIST = Path(settings.FRONTEND_DIST).resolve() if settings.FRONTEND_DIST else None

if DIST and (DIST / "index.html").is_file():
    INDEX_HTML = (DIST / "index.html").read_text(encoding="utf-8")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str, request: Request):
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(status_code=404, detail="Not found")
        candidate = (DIST / full_path).resolve()
        if full_path and candidate.is_file() and candidate.is_relative_to(DIST):
            # Vite fingerprints everything under /assets, so those can be cached for good
            cache = "public, max-age=31536000, immutable" if full_path.startswith("assets/") else "public, max-age=3600"
            return FileResponse(candidate, headers={"Cache-Control": cache})
        # Every page gets its own title, description, share tags and schema.org data
        from app.seo import page_meta, render_index, site_url
        from app.routes.website import load_content
        db = SessionLocal()
        try:
            content = load_content(db)
            meta = page_meta(db, "/" + full_path, content, site_url(request))
        finally:
            db.close()
        return HTMLResponse(render_index(INDEX_HTML, meta, content), headers={"Cache-Control": "no-cache"})
else:
    @app.get("/")
    def root():
        return {"message": "Srini Physio Clinics API", "docs": "/docs"}
