"""Sign-in, sign-up, profile changes and who may reach which endpoints."""
import pytest

from app import main
from app.config import settings
from tests.conftest import ADMIN_EMAIL, ADMIN_PASSWORD, bearer, login

STAFF_ENDPOINTS = [
    "/api/patients",
    "/api/appointments",
    "/api/appointments/queue",
    "/api/enquiries",
    "/api/dashboard/stats",
    "/api/dashboard/overview",
    "/api/schedule/blocks",
    "/api/doctors/all",
    "/api/services/all",
]
ADMIN_ONLY_ENDPOINTS = ["/api/auth/users"]


class TestLogin:
    def test_admin_signs_in(self, client):
        r = client.post("/api/auth/login", data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "admin"

    def test_email_is_case_insensitive(self, client):
        assert client.post("/api/auth/login", data={"username": ADMIN_EMAIL.upper(), "password": ADMIN_PASSWORD}).status_code == 200

    @pytest.mark.parametrize("email,password", [(ADMIN_EMAIL, "wrong-password"), ("nobody@clinic.example.com", ADMIN_PASSWORD)])
    def test_bad_credentials_are_rejected(self, client, email, password):
        r = client.post("/api/auth/login", data={"username": email, "password": password})
        assert r.status_code == 401
        assert r.json()["detail"] == "Incorrect email or password"   # same message: doesn't reveal which accounts exist

    def test_me_requires_a_valid_token(self, client, admin):
        assert client.get("/api/auth/me", headers=admin).json()["email"] == ADMIN_EMAIL
        assert client.get("/api/auth/me").status_code == 401
        assert client.get("/api/auth/me", headers=bearer("not-a-real-token")).status_code == 401


class TestSignup:
    def test_creates_a_patient_account_with_its_own_record(self, client, signup):
        headers, user = signup()
        assert user["role"] == "patient"
        assert user["patient_id"] is not None
        assert client.get("/api/auth/me", headers=headers).json()["id"] == user["id"]

    def test_duplicate_email_is_rejected_case_insensitively(self, client, signup):
        signup(email="ravi@example.com")
        r = client.post("/api/auth/signup", json={"name": "Other", "email": "RAVI@example.com", "phone": "9876500000", "password": "secret123"})
        assert r.status_code == 400

    @pytest.mark.parametrize("change", [
        {"password": "short"},
        {"email": "not-an-email"},
        {"phone": "123"},
        {"name": "R"},
    ])
    def test_invalid_details_are_rejected(self, client, change):
        body = {"name": "Ravi", "email": "ravi@example.com", "phone": "9876543210", "password": "secret123", **change}
        assert client.post("/api/auth/signup", json=body).status_code == 422

    def test_signup_never_attaches_an_existing_patient_record(self, client, admin, signup):
        existing = client.post("/api/patients", headers=admin, json={"name": "Ravi Kumar", "phone": "9876543210"}).json()
        _, user = signup(phone="9876543210")
        assert user["patient_id"] != existing["id"]


class TestProfile:
    def test_password_change_needs_the_current_password(self, client, signup):
        headers, _ = signup(email="p@example.com", password="secret123")
        wrong = client.put("/api/auth/me", headers=headers, json={"current_password": "nope", "new_password": "newsecret1"})
        assert wrong.status_code == 400
        ok = client.put("/api/auth/me", headers=headers, json={"current_password": "secret123", "new_password": "newsecret1"})
        assert ok.status_code == 200
        login(client, "p@example.com", "newsecret1")

    def test_name_and_phone_changes_reach_the_clinic_record(self, client, admin, signup):
        headers, user = signup()
        client.put("/api/auth/me", headers=headers, json={"name": "Ravi K", "phone": "9000012345"})
        record = client.get(f"/api/patients/{user['patient_id']}", headers=admin).json()
        assert (record["name"], record["phone"]) == ("Ravi K", "9000012345")


class TestAccess:
    @pytest.mark.parametrize("path", STAFF_ENDPOINTS + ADMIN_ONLY_ENDPOINTS)
    def test_patients_are_refused_staff_endpoints(self, client, signup, path):
        headers, _ = signup()
        assert client.get(path, headers=headers).status_code == 403

    @pytest.mark.parametrize("path", STAFF_ENDPOINTS + ADMIN_ONLY_ENDPOINTS)
    def test_anonymous_visitors_are_refused_staff_endpoints(self, client, path):
        assert client.get(path).status_code == 401

    @pytest.mark.parametrize("path", STAFF_ENDPOINTS)
    def test_receptionists_reach_front_desk_endpoints(self, client, receptionist, path):
        assert client.get(path, headers=receptionist).status_code == 200

    def test_receptionists_cannot_manage_staff_or_doctors(self, client, receptionist):
        assert client.get("/api/auth/users", headers=receptionist).status_code == 403
        assert client.post("/api/doctors", headers=receptionist, json={"name": "Dr X"}).status_code == 403
        r = client.post("/api/auth/users", headers=receptionist, json={"name": "X", "email": "x@clinic.example.com", "password": "secret123", "role": "admin"})
        assert r.status_code == 403

    def test_staff_cannot_use_the_patient_portal(self, client, admin):
        assert client.get("/api/me/overview", headers=admin).status_code == 403

    def test_staff_list_excludes_patient_accounts(self, client, admin, signup):
        signup()
        assert {u["role"] for u in client.get("/api/auth/users", headers=admin).json()} == {"admin"}

    def test_admin_cannot_create_patient_role_through_staff_form(self, client, admin):
        r = client.post("/api/auth/users", headers=admin, json={"name": "Z", "email": "z@clinic.example.com", "password": "secret123", "role": "patient"})
        assert r.status_code == 400

    def test_admin_cannot_delete_own_account(self, client, admin):
        me = client.get("/api/auth/me", headers=admin).json()
        assert client.delete(f"/api/auth/users/{me['id']}", headers=admin).status_code == 400


def test_blank_admin_password_is_never_seeded(monkeypatch, client):
    monkeypatch.setattr(settings, "ADMIN_EMAIL", "second-admin@clinic.example.com")
    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "")
    main._seed_data()
    r = client.post("/api/auth/login", data={"username": "second-admin@clinic.example.com", "password": ""})
    assert r.status_code in (401, 422)
