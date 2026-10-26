"""Public booking requests and live slot availability: no double booking, closures, leave."""
from tests.conftest import MORNING, NOON, SLOT_LABELS, at, day


def available(client, date_str, doctor_id=None):
    params = {"date": date_str, **({"doctor_id": doctor_id} if doctor_id else {})}
    return {s["slot"]: s for s in client.get("/api/schedule/availability", params=params).json()["slots"]}


def test_a_future_day_starts_fully_open(client):
    slots = available(client, day())
    assert list(slots) == SLOT_LABELS
    assert all(s["available"] for s in slots.values())


def test_a_request_holds_its_slot(client, enquire):
    d = day()
    assert enquire(d, MORNING).status_code == 201
    slot = available(client, d)[MORNING]
    assert (slot["available"], slot["reason"]) == (False, "booked")
    assert available(client, d)[NOON]["available"]


def test_a_taken_slot_cannot_be_requested_again(client, enquire):
    d = day()
    enquire(d, MORNING)
    r = enquire(d, MORNING, name="Second Patient")
    assert r.status_code == 409
    detail = r.json()["detail"]
    assert detail["code"] == "slot_unavailable"
    assert detail["reason"] == "booked"
    assert detail["alternatives"], "should offer other free slots"
    assert {"date": d, "slot": MORNING} not in detail["alternatives"]


def test_availability_reveals_no_patient_details(client, enquire):
    d = day()
    enquire(d, MORNING, name="Private Name")
    assert "Private Name" not in client.get("/api/schedule/availability", params={"date": d}).text


def test_the_same_time_with_another_doctor_is_free(client, enquire, second_doctor):
    d = day()
    enquire(d, MORNING)
    assert available(client, d, second_doctor)[MORNING]["available"]
    assert enquire(d, MORNING, doctor_id=second_doctor).status_code == 201


def test_past_slots_are_refused(client, enquire):
    r = enquire(day(-1), MORNING)
    assert r.status_code == 409
    assert r.json()["detail"]["reason"] == "past"


def test_a_clinic_closure_blocks_every_slot_and_suggests_other_days(client, admin, enquire):
    d = day()
    client.post("/api/schedule/blocks", headers=admin, json={"date": d, "reason": "Holiday"})
    r = enquire(d, MORNING)
    assert r.status_code == 409 and r.json()["detail"]["reason"] == "closed"
    result = client.get("/api/schedule/availability", params={"date": d}).json()
    assert not any(s["available"] for s in result["slots"])
    assert result["alternatives"] and all(a["date"] != d for a in result["alternatives"])


def test_a_blocked_slot_only_closes_that_slot(client, admin, enquire):
    d = day()
    client.post("/api/schedule/blocks", headers=admin, json={"date": d, "slot": MORNING})
    assert enquire(d, MORNING).json()["detail"]["reason"] == "blocked"
    assert enquire(d, NOON).status_code == 201


def test_doctor_leave_only_affects_that_doctor(client, admin, enquire, lead_doctor, second_doctor):
    d = day()
    client.post("/api/schedule/blocks", headers=admin, json={"date": d, "doctor_id": second_doctor, "reason": "Leave"})
    assert not any(s["available"] for s in available(client, d, second_doctor).values())
    assert all(s["available"] for s in available(client, d, lead_doctor).values())


def test_removing_a_block_reopens_the_slot(client, admin):
    d = day()
    block = client.post("/api/schedule/blocks", headers=admin, json={"date": d, "slot": MORNING}).json()
    assert client.delete(f"/api/schedule/blocks/{block['id']}", headers=admin).status_code == 200
    assert available(client, d)[MORNING]["available"]


def test_duplicate_and_unknown_blocks_are_rejected(client, admin):
    d = day()
    assert client.post("/api/schedule/blocks", headers=admin, json={"date": d, "slot": MORNING}).status_code == 201
    assert client.post("/api/schedule/blocks", headers=admin, json={"date": d, "slot": MORNING}).status_code == 400
    assert client.post("/api/schedule/blocks", headers=admin, json={"date": d, "slot": "13:00"}).status_code == 422


def test_closing_a_request_frees_its_slot(client, admin, enquire):
    d = day()
    e = enquire(d, MORNING).json()
    client.put(f"/api/enquiries/{e['id']}", headers=admin, json={"status": "closed"})
    assert available(client, d)[MORNING]["available"]


def test_a_cancelled_appointment_frees_its_slot(client, admin, patient_id):
    d = day()
    appt = client.post("/api/appointments", headers=admin, json={"patient_id": patient_id, "scheduled_at": at(d, 11)}).json()
    assert not available(client, d)[MORNING]["available"]
    client.delete(f"/api/appointments/{appt['id']}", headers=admin)
    assert available(client, d)[MORNING]["available"]


def test_staff_appointments_hold_slots_for_the_website(client, admin, patient_id, enquire):
    d = day()
    client.post("/api/appointments", headers=admin, json={"patient_id": patient_id, "scheduled_at": at(d, 11)})
    assert enquire(d, MORNING).status_code == 409


def test_invalid_requests_are_rejected(client, enquire, admin, second_doctor):
    assert enquire(day(), "11:30 AM").status_code == 422
    assert enquire("not-a-date", MORNING).status_code == 422
    assert enquire(day(), MORNING, doctor_id=99999).status_code == 422
    client.put(f"/api/doctors/{second_doctor}", headers=admin, json={"is_active": False})
    assert enquire(day(), MORNING, doctor_id=second_doctor).status_code == 422


def test_requests_record_the_chosen_doctor(client, enquire, lead_doctor):
    e = enquire(day(), MORNING).json()
    assert e["doctor_id"] == lead_doctor
    assert e["specialist"].startswith("Dr Tharun")
