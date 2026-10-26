"""Test setup: a dedicated PostgreSQL database, wiped and re-seeded before every test.

Database: TEST_DATABASE_URL if set (CI), otherwise the server in backend/.env with the
database name `srini_physio_test`. Created if missing. Tests refuse to run against a
database whose name doesn't end in `_test`, because every test empties all tables.
"""
import os
from datetime import datetime, timedelta

from dotenv import dotenv_values
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL, make_url

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ADMIN_EMAIL = "admin@clinic.example.com"
ADMIN_PASSWORD = "Admin-Test-123"


def _test_database_url() -> URL:
    if os.environ.get("TEST_DATABASE_URL"):
        url = make_url(os.environ["TEST_DATABASE_URL"])
        return url.set(drivername="postgresql+psycopg2")
    env = dotenv_values(os.path.join(BACKEND, ".env"))
    return URL.create(
        "postgresql+psycopg2",
        username=env.get("DB_USER", "postgres"), password=env.get("DB_PASSWORD", "password"),
        host=env.get("DB_HOST", "localhost"), port=int(env.get("DB_PORT", "5432")),
        database="srini_physio_test",
    )


TEST_DB_URL = _test_database_url()
if not (TEST_DB_URL.database or "").endswith("_test"):
    raise RuntimeError(f"Refusing to run tests against '{TEST_DB_URL.database}': the database name must end in _test")


def _ensure_database():
    server = create_engine(TEST_DB_URL.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with server.connect() as conn:
        if not conn.execute(text("SELECT 1 FROM pg_database WHERE datname = :n"), {"n": TEST_DB_URL.database}).scalar():
            conn.execute(text(f'CREATE DATABASE "{TEST_DB_URL.database}"'))
    server.dispose()


_ensure_database()

# Configure the app before it is imported: environment variables override backend/.env
os.environ.update({
    "DATABASE_URL": TEST_DB_URL.render_as_string(hide_password=False),
    "SECRET_KEY": "test-secret-key",
    "ADMIN_EMAIL": ADMIN_EMAIL,
    "ADMIN_PASSWORD": ADMIN_PASSWORD,
    "ADMIN_NAME": "Test Admin",
    "FRONTEND_DIST": "",
})

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app import main  # noqa: E402
from app.database import Base, engine  # noqa: E402
from app.slots import CLINIC_TZ, SLOTS  # noqa: E402

SLOT_LABELS = list(SLOTS.values())
MORNING = "11:00 AM (Morning)"
NOON = "12:00 PM (Noon)"


@pytest.fixture(scope="session")
def client():
    with TestClient(main.app) as c:   # runs startup: create tables, add columns, seed
        yield c
    engine.dispose()


@pytest.fixture(autouse=True)
def clean_db(client):
    """Every test starts from a freshly seeded clinic: one admin, one doctor, six services with their pages."""
    tables = ", ".join(t.name for t in Base.metadata.sorted_tables)
    with engine.begin() as conn:
        conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))
    main._seed_data()
    main._assign_default_doctor()
    main._fill_treatment_pages()


# ── Helpers ────────────────────────────────────────────────────────────────

def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def login(client, email, password) -> dict:
    r = client.post("/api/auth/login", data={"username": email, "password": password})
    assert r.status_code == 200, r.text
    return bearer(r.json()["access_token"])


def day(offset: int = 7) -> str:
    """A clinic-local date `offset` days from today, as YYYY-MM-DD."""
    return (datetime.now(CLINIC_TZ).date() + timedelta(days=offset)).isoformat()


def clinic_time(iso: str) -> datetime:
    """An API timestamp as clinic-local time. The database may hand back UTC (e.g. in CI),
    so compare instants, never the raw strings."""
    return datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(CLINIC_TZ)


def at(date_str: str, hour: int) -> str:
    """ISO datetime for an hour on a clinic-local date."""
    return f"{date_str}T{hour:02d}:00:00+05:30"


@pytest.fixture
def admin(client):
    return login(client, ADMIN_EMAIL, ADMIN_PASSWORD)


@pytest.fixture
def receptionist(client, admin):
    r = client.post("/api/auth/users", headers=admin, json={
        "name": "Front Desk", "email": "desk@clinic.example.com", "password": "Desk-Test-123", "role": "receptionist",
    })
    assert r.status_code == 200, r.text
    return login(client, "desk@clinic.example.com", "Desk-Test-123")


@pytest.fixture
def signup(client):
    """signup(email=...) -> (headers, user) for a new patient account."""
    def _signup(email="ravi@example.com", name="Ravi Kumar", phone="9876543210", password="secret123"):
        r = client.post("/api/auth/signup", json={"name": name, "email": email, "phone": phone, "password": password})
        assert r.status_code == 201, r.text
        return bearer(r.json()["access_token"]), r.json()["user"]
    return _signup


@pytest.fixture
def lead_doctor(client):
    return client.get("/api/doctors").json()[0]["id"]


@pytest.fixture
def second_doctor(client, admin):
    r = client.post("/api/doctors", headers=admin, json={"name": "Dr Second", "qualification": "BPT"})
    assert r.status_code == 201, r.text
    return r.json()["id"]


@pytest.fixture
def enquire(client):
    """enquire(date, slot, **extra) -> response for a public booking request."""
    def _enquire(date_str, slot, headers=None, **extra):
        body = {"name": "Website Patient", "phone": "9000000001", "preferred_date": date_str, "preferred_slot": slot, **extra}
        return client.post("/api/enquiries", json=body, headers=headers or {})
    return _enquire


@pytest.fixture
def patient_id(client, admin):
    r = client.post("/api/patients", headers=admin, json={"name": "Walk In", "phone": "9111111111"})
    assert r.status_code == 201, r.text
    return r.json()["id"]
