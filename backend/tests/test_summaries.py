"""Treatment summaries: created on completion, edited by the doctor, shared on WhatsApp, opened by the patient."""
from urllib.parse import unquote

import pytest

from app import whatsapp
from app.config import settings
from tests.conftest import at, day


class FakeResponse:
    def __init__(self, status=200, body=None):
        self.status_code, self._body = status, body or {"messages": [{"id": "wamid.1"}]}

    def json(self):
        return self._body


@pytest.fixture
def whatsapp_api(monkeypatch):
    """Pretend the WhatsApp Business API is configured; capture what would be sent."""
    calls = []
    monkeypatch.setattr(settings, "WHATSAPP_API_TOKEN", "test-token")
    monkeypatch.setattr(settings, "WHATSAPP_PHONE_NUMBER_ID", "12345")

    def fake_post(url, json=None, headers=None, timeout=None):
        calls.append({"url": url, "json": json, "headers": headers})
        return calls_response[0]

    calls_response = [FakeResponse()]
    monkeypatch.setattr(whatsapp.httpx, "post", fake_post)
    return calls, calls_response


@pytest.fixture
def appt(client, admin):
    p = client.post("/api/patients", headers=admin, json={"name": "Ravi Kumar", "phone": "98765 43210", "age": 34}).json()
    a = client.post("/api/appointments", headers=admin, json={"patient_id": p["id"], "scheduled_at": at(day(), 11)}).json()
    client.put(f"/api/appointments/{a['id']}", headers=admin, json={"exercises": ["Wall slides 3x10"], "follow_up_date": day(14)})
    return a


def complete(client, headers, appt_id):
    for status in ("checked_in", "in_therapy", "completed"):
        r = client.put(f"/api/appointments/{appt_id}", headers=headers, json={"status": status})
        assert r.status_code == 200, r.text


def summaries(client, headers, appt_id):
    return client.get("/api/summaries", headers=headers, params={"appointment_id": appt_id}).json()


class TestCreation:
    def test_completing_treatment_prepares_a_summary_from_the_chart(self, client, admin, appt):
        complete(client, admin, appt["id"])
        [s] = summaries(client, admin, appt["id"])
        assert s["auto_created"] is True
        assert s["exercises"] == ["Wall slides 3x10"] and s["follow_up_date"] == day(14)
        assert s["send_status"] == "not_sent"           # no WhatsApp API → staff send it
        assert s["url"].startswith("http://testserver/api/documents/") and s["url"].endswith(".pdf")

    def test_one_summary_per_appointment(self, client, admin, appt):
        a = client.post(f"/api/summaries/for-appointment/{appt['id']}", headers=admin).json()
        b = client.post(f"/api/summaries/for-appointment/{appt['id']}", headers=admin).json()
        assert a["id"] == b["id"]
        complete(client, admin, appt["id"])
        assert len(summaries(client, admin, appt["id"])) == 1

    def test_doctor_can_write_notes_any_time(self, client, admin, appt):
        s = client.post(f"/api/summaries/for-appointment/{appt['id']}", headers=admin).json()
        r = client.put(f"/api/summaries/{s['id']}", headers=admin, json={
            "findings": " Shoulder impingement ", "notes": "Avoid overhead lifting.", "exercises": ["A", " ", "B"],
        })
        assert r.status_code == 200
        body = r.json()
        assert (body["findings"], body["notes"], body["exercises"]) == ("Shoulder impingement", "Avoid overhead lifting.", ["A", "B"])

    def test_unknown_appointment(self, client, admin):
        assert client.post("/api/summaries/for-appointment/99999", headers=admin).status_code == 404


class TestPdf:
    def test_patient_link_serves_the_letterhead_pdf(self, client, admin, appt):
        s = client.post(f"/api/summaries/for-appointment/{appt['id']}", headers=admin).json()
        client.put(f"/api/summaries/{s['id']}", headers=admin, json={"notes": "Line one\nLine <two> & three"})
        r = client.get(s["url"].replace("http://testserver", ""))
        assert r.status_code == 200
        assert r.headers["content-type"] == "application/pdf"
        assert r.content.startswith(b"%PDF") and len(r.content) > 5000
        assert "noindex" in r.headers["x-robots-tag"]
        assert "no-store" in r.headers["cache-control"]
        assert r.headers["content-disposition"].startswith('inline; filename="Treatment-summary-Ravi-Kumar-')

    def test_pdf_links_stay_on_the_backend_when_the_website_is_elsewhere(self, client, admin, appt, monkeypatch):
        monkeypatch.setattr(settings, "SITE_URL", "https://sriniphysio.in")   # frontend deployed separately
        s = client.post(f"/api/summaries/for-appointment/{appt['id']}", headers=admin).json()
        assert s["url"].startswith("http://testserver/api/documents/")

    def test_download_option(self, client, admin, appt):
        s = client.post(f"/api/summaries/for-appointment/{appt['id']}", headers=admin).json()
        r = client.get(s["url"].replace("http://testserver", "") + "?download=true")
        assert r.headers["content-disposition"].startswith("attachment;")

    @pytest.mark.parametrize("token", ["nope", "x" * 32])
    def test_unknown_links_find_nothing(self, client, token):
        assert client.get(f"/api/documents/{token}.pdf").status_code == 404

    def test_deleting_switches_the_link_off(self, client, admin, appt):
        s = client.post(f"/api/summaries/for-appointment/{appt['id']}", headers=admin).json()
        client.delete(f"/api/summaries/{s['id']}", headers=admin)
        assert client.get(s["url"].replace("http://testserver", "")).status_code == 404

    def test_letterhead_edits_still_render(self, client, admin, appt):
        client.put("/api/content/letterhead", headers=admin, json={"doctor_name": "Dr. G. Tharun Sai", "qr_link": "https://g.page/r/review", "address_lines": []})
        s = client.post(f"/api/summaries/for-appointment/{appt['id']}", headers=admin).json()
        assert client.get(s["url"].replace("http://testserver", "")).content.startswith(b"%PDF")

    def test_documents_are_kept_out_of_search(self, client):
        assert "Disallow: /api/documents/" in client.get("/robots.txt").text


class TestSending:
    def test_without_the_api_staff_get_a_whatsapp_link(self, client, admin, appt):
        s = client.post(f"/api/summaries/for-appointment/{appt['id']}", headers=admin).json()
        r = client.post(f"/api/summaries/{s['id']}/send", headers=admin)
        assert r.status_code == 200
        body = r.json()
        assert body["channel"] == "link"
        assert body["wa_url"].startswith("https://wa.me/919876543210?text=")
        text = unquote(body["wa_url"].split("text=", 1)[1])
        assert "Ravi Kumar" in text and s["url"] in text
        assert body["summary"]["send_status"] == "shared"

    def test_completion_sends_automatically_with_the_api(self, client, admin, appt, whatsapp_api):
        calls, _ = whatsapp_api
        complete(client, admin, appt["id"])
        [s] = summaries(client, admin, appt["id"])
        assert (s["send_status"], s["send_channel"]) == ("sent", "api")
        [call] = calls
        assert call["url"].endswith("/12345/messages")
        assert call["headers"]["Authorization"] == "Bearer test-token"
        msg = call["json"]
        assert msg["to"] == "919876543210" and msg["template"]["name"] == settings.WHATSAPP_SUMMARY_TEMPLATE
        header = msg["template"]["components"][0]["parameters"][0]["document"]
        assert header["link"] == s["url"] and header["filename"].endswith(".pdf")

    def test_automatic_sending_can_be_switched_off(self, client, admin, appt, whatsapp_api):
        calls, _ = whatsapp_api
        client.put("/api/content/letterhead", headers=admin, json={"auto_send": "no"})
        complete(client, admin, appt["id"])
        assert calls == []
        assert summaries(client, admin, appt["id"])[0]["send_status"] == "not_sent"

    def test_manual_send_through_the_api(self, client, admin, appt, whatsapp_api):
        calls, _ = whatsapp_api
        s = client.post(f"/api/summaries/for-appointment/{appt['id']}", headers=admin).json()
        r = client.post(f"/api/summaries/{s['id']}/send", headers=admin)
        assert r.json()["channel"] == "api" and len(calls) == 1

    def test_whatsapp_errors_are_recorded(self, client, admin, appt, whatsapp_api):
        _, response = whatsapp_api
        response[0] = FakeResponse(400, {"error": {"message": "Template name does not exist"}})
        s = client.post(f"/api/summaries/for-appointment/{appt['id']}", headers=admin).json()
        r = client.post(f"/api/summaries/{s['id']}/send", headers=admin)
        assert r.status_code == 502 and "Template name does not exist" in r.json()["detail"]
        [s] = summaries(client, admin, appt["id"])
        assert s["send_status"] == "failed" and "Template" in s["send_error"]

    def test_patient_without_a_valid_number(self, client, admin):
        p = client.post("/api/patients", headers=admin, json={"name": "No Phone", "phone": "123"}).json()
        a = client.post("/api/appointments", headers=admin, json={"patient_id": p["id"], "scheduled_at": at(day(), 12)}).json()
        s = client.post(f"/api/summaries/for-appointment/{a['id']}", headers=admin).json()
        assert client.post(f"/api/summaries/{s['id']}/send", headers=admin).status_code == 422

    @pytest.mark.parametrize("phone,expected", [
        ("98765 43210", "919876543210"), ("+91 98765-43210", "919876543210"), ("09876543210", "919876543210"),
        ("919876543210", "919876543210"), ("12345", None),
    ])
    def test_phone_numbers(self, phone, expected):
        assert whatsapp.wa_number(phone) == expected


class TestAccess:
    def test_staff_only(self, client, admin, appt, signup, receptionist):
        s = client.post(f"/api/summaries/for-appointment/{appt['id']}", headers=admin).json()
        patient, _ = signup()
        for headers, code in ((patient, 403), ({}, 401)):
            assert client.get("/api/summaries", headers=headers).status_code == code
            assert client.put(f"/api/summaries/{s['id']}", headers=headers, json={"notes": "x"}).status_code == code
            assert client.post(f"/api/summaries/{s['id']}/send", headers=headers).status_code == code
        assert client.put(f"/api/summaries/{s['id']}", headers=receptionist, json={"notes": "x"}).status_code == 200

    def test_patients_see_their_shared_documents(self, client, admin, signup):
        mine, me = signup(email="me@example.com")
        other, _ = signup(email="other@example.com", phone="9000000002")
        a = client.post("/api/appointments", headers=admin, json={"patient_id": me["patient_id"], "scheduled_at": at(day(), 11)}).json()
        s = client.post(f"/api/summaries/for-appointment/{a['id']}", headers=admin).json()
        assert client.get("/api/me/overview", headers=mine).json()["documents"] == []   # not shared yet
        client.post(f"/api/summaries/{s['id']}/send", headers=admin)
        [doc] = client.get("/api/me/overview", headers=mine).json()["documents"]
        assert doc["url"] == s["url"] and doc["title"] == "Treatment Summary"
        assert client.get("/api/me/overview", headers=other).json()["documents"] == []
