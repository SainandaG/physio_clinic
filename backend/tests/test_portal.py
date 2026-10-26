"""The patient account: own requests and appointments only, self-service cancellation, no clinical notes."""
from tests.conftest import MORNING, at, bearer, day


def overview(client, headers):
    r = client.get("/api/me/overview", headers=headers)
    assert r.status_code == 200, r.text
    return r.json()


def test_a_signed_in_request_shows_in_the_account(client, signup, enquire):
    headers, user = signup()
    e = enquire(day(), MORNING, headers=headers, name=user["name"]).json()
    assert e["converted_patient_id"] == user["patient_id"]
    data = overview(client, headers)
    assert [r["id"] for r in data["requests"]] == [e["id"]]
    assert data["appointments"] == []


def test_an_invalid_token_does_not_block_a_public_request(client, enquire):
    r = enquire(day(), MORNING, headers=bearer("stale-token"))
    assert r.status_code == 201
    assert r.json()["converted_patient_id"] is None


def test_booking_moves_the_request_into_appointments_without_duplicating_the_patient(client, admin, signup, enquire):
    headers, user = signup()
    e = enquire(day(), MORNING, headers=headers).json()
    client.post(f"/api/enquiries/{e['id']}/book", headers=admin, json={"notes": "Internal: check MRI"})
    data = overview(client, headers)
    assert data["requests"] == []
    assert len(data["appointments"]) == 1
    assert len(client.get("/api/patients", headers=admin).json()) == 1


def test_internal_notes_and_triage_are_hidden(client, admin, signup, enquire):
    headers, _ = signup()
    e = enquire(day(), MORNING, headers=headers, pain_level=9).json()
    client.post(f"/api/enquiries/{e['id']}/book", headers=admin, json={"notes": "Internal: check MRI"})
    appt = overview(client, headers)["appointments"][0]
    for hidden in ("notes", "priority", "pain_level", "patient", "source"):
        assert hidden not in appt
    assert "Internal" not in client.get("/api/me/overview", headers=headers).text


def test_patients_see_only_their_own_appointments(client, admin, signup):
    mine_headers, me = signup(email="me@example.com")
    _, other = signup(email="other@example.com", phone="9000000002")
    client.post("/api/appointments", headers=admin, json={"patient_id": other["patient_id"], "scheduled_at": at(day(), 11)})
    assert overview(client, mine_headers)["appointments"] == []


def test_cancelling_an_upcoming_appointment(client, admin, signup):
    headers, user = signup()
    appt = client.post("/api/appointments", headers=admin, json={"patient_id": user["patient_id"], "scheduled_at": at(day(), 11)}).json()
    assert client.post(f"/api/me/appointments/{appt['id']}/cancel", headers=headers).status_code == 200
    assert overview(client, headers)["appointments"][0]["status"] == "cancelled"
    assert client.post(f"/api/me/appointments/{appt['id']}/cancel", headers=headers).status_code == 400


def test_cannot_cancel_someone_elses_appointment(client, admin, signup):
    _, owner = signup(email="owner@example.com")
    intruder, _ = signup(email="intruder@example.com", phone="9000000003")
    appt = client.post("/api/appointments", headers=admin, json={"patient_id": owner["patient_id"], "scheduled_at": at(day(), 11)}).json()
    assert client.post(f"/api/me/appointments/{appt['id']}/cancel", headers=intruder).status_code == 404


def test_cannot_cancel_a_visit_that_is_under_way_or_past(client, admin, signup):
    headers, user = signup()
    started = client.post("/api/appointments", headers=admin, json={"patient_id": user["patient_id"], "scheduled_at": at(day(), 11)}).json()
    client.put(f"/api/appointments/{started['id']}", headers=admin, json={"status": "checked_in"})
    assert client.post(f"/api/me/appointments/{started['id']}/cancel", headers=headers).status_code == 400
    past = client.post("/api/appointments?force=true", headers=admin, json={"patient_id": user["patient_id"], "scheduled_at": at(day(-2), 11)}).json()
    assert client.post(f"/api/me/appointments/{past['id']}/cancel", headers=headers).status_code == 400


def test_withdrawing_a_request_frees_the_slot(client, signup, enquire):
    headers, _ = signup()
    d = day()
    e = enquire(d, MORNING, headers=headers).json()
    assert client.post(f"/api/me/requests/{e['id']}/cancel", headers=headers).status_code == 200
    assert overview(client, headers)["requests"] == []
    assert enquire(d, MORNING).status_code == 201


def test_cannot_withdraw_someone_elses_request(client, signup, enquire):
    owner, _ = signup(email="owner@example.com")
    intruder, _ = signup(email="intruder@example.com", phone="9000000003")
    e = enquire(day(), MORNING, headers=owner).json()
    assert client.post(f"/api/me/requests/{e['id']}/cancel", headers=intruder).status_code == 404


def test_exercise_plan_is_visible_to_the_patient(client, admin, signup):
    headers, user = signup()
    appt = client.post("/api/appointments", headers=admin, json={"patient_id": user["patient_id"], "scheduled_at": at(day(), 11)}).json()
    client.put(f"/api/appointments/{appt['id']}", headers=admin, json={"exercises": ["Clamshells 3x15"]})
    assert overview(client, headers)["appointments"][0]["exercises"] == ["Clamshells 3x15"]
