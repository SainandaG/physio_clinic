"""Front-desk appointment handling: scheduling, overbooking rules, triage, check-in tokens, enquiry booking."""
import pytest

from tests.conftest import MORNING, NOON, at, day


def create(client, headers, patient_id, when, **extra):
    return client.post("/api/appointments", headers=headers, json={"patient_id": patient_id, "scheduled_at": when, **extra})


class TestScheduling:
    def test_creates_an_appointment_with_the_lead_doctor(self, client, admin, patient_id, lead_doctor):
        r = create(client, admin, patient_id, at(day(), 11))
        assert r.status_code == 201
        body = r.json()
        assert body["status"] == "pending"
        assert body["doctor"]["id"] == lead_doctor

    def test_a_slot_cannot_be_double_booked(self, client, admin, patient_id):
        create(client, admin, patient_id, at(day(), 11))
        r = create(client, admin, patient_id, at(day(), 11))
        assert r.status_code == 409
        assert r.json()["detail"]["reason"] == "booked"

    def test_only_admins_can_overbook(self, client, admin, receptionist, patient_id):
        create(client, admin, patient_id, at(day(), 11))
        assert client.post("/api/appointments?force=true", headers=receptionist, json={"patient_id": patient_id, "scheduled_at": at(day(), 11)}).status_code == 403
        assert client.post("/api/appointments?force=true", headers=admin, json={"patient_id": patient_id, "scheduled_at": at(day(), 11)}).status_code == 201

    def test_unknown_patient_is_rejected(self, client, admin):
        assert create(client, admin, 99999, at(day(), 11)).status_code == 404

    def test_rescheduling_checks_the_new_slot(self, client, admin, patient_id):
        d = day()
        create(client, admin, patient_id, at(d, 11))
        moving = create(client, admin, patient_id, at(d, 12)).json()
        assert client.put(f"/api/appointments/{moving['id']}", headers=admin, json={"scheduled_at": at(d, 11)}).status_code == 409
        assert client.put(f"/api/appointments/{moving['id']}", headers=admin, json={"scheduled_at": at(d, 15)}).status_code == 200

    def test_saving_without_moving_does_not_conflict_with_itself(self, client, admin, patient_id):
        appt = create(client, admin, patient_id, at(day(), 11)).json()
        assert client.put(f"/api/appointments/{appt['id']}", headers=admin, json={"notes": "Bring reports", "scheduled_at": at(day(), 11)}).status_code == 200

    def test_reinstating_a_cancelled_appointment_rechecks_its_slot(self, client, admin, patient_id):
        d = day()
        first = create(client, admin, patient_id, at(d, 11)).json()
        client.delete(f"/api/appointments/{first['id']}", headers=admin)
        create(client, admin, patient_id, at(d, 11))   # someone else takes the freed slot
        assert client.put(f"/api/appointments/{first['id']}", headers=admin, json={"status": "confirmed"}).status_code == 409

    def test_cannot_move_to_a_doctor_on_leave(self, client, admin, patient_id, second_doctor):
        d = day()
        client.post("/api/schedule/blocks", headers=admin, json={"date": d, "doctor_id": second_doctor})
        appt = create(client, admin, patient_id, at(d, 11)).json()
        r = client.put(f"/api/appointments/{appt['id']}", headers=admin, json={"doctor_id": second_doctor})
        assert r.status_code == 409 and r.json()["detail"]["reason"] == "closed"


class TestValidationAndTriage:
    @pytest.mark.parametrize("pain,priority", [(9, "urgent"), (8, "urgent"), (5, "moderate"), (4, "routine"), (None, "routine")])
    def test_priority_follows_pain_level(self, client, admin, patient_id, pain, priority):
        r = create(client, admin, patient_id, at(day(), 11), pain_level=pain)
        assert r.json()["priority"] == priority

    def test_staff_can_override_triage(self, client, admin, patient_id):
        assert create(client, admin, patient_id, at(day(), 11), pain_level=9, priority="routine").json()["priority"] == "routine"

    @pytest.mark.parametrize("body", [{"status": "done"}, {"priority": "high"}, {"pain_level": 11}, {"pain_level": 0}])
    def test_invalid_values_are_rejected(self, client, admin, patient_id, body):
        appt = create(client, admin, patient_id, at(day(), 11)).json()
        assert client.put(f"/api/appointments/{appt['id']}", headers=admin, json=body).status_code == 422


class TestCheckInAndTokens:
    def test_check_in_issues_daily_tokens_in_order(self, client, admin, patient_id):
        a = create(client, admin, patient_id, at(day(), 11)).json()
        b = create(client, admin, patient_id, at(day(), 12)).json()
        ta = client.put(f"/api/appointments/{a['id']}", headers=admin, json={"status": "checked_in"}).json()
        tb = client.put(f"/api/appointments/{b['id']}", headers=admin, json={"status": "checked_in"}).json()
        assert (ta["token_number"], tb["token_number"]) == ("TK-101", "TK-102")
        assert ta["checked_in_at"]

    def test_checking_in_twice_keeps_the_token(self, client, admin, patient_id):
        a = create(client, admin, patient_id, at(day(), 11)).json()
        client.put(f"/api/appointments/{a['id']}", headers=admin, json={"status": "checked_in"})
        again = client.put(f"/api/appointments/{a['id']}", headers=admin, json={"status": "checked_in"}).json()
        assert again["token_number"] == "TK-101"

    def test_full_visit_flow(self, client, admin, patient_id):
        a = create(client, admin, patient_id, at(day(), 11)).json()
        for status in ("confirmed", "checked_in", "in_therapy", "completed"):
            r = client.put(f"/api/appointments/{a['id']}", headers=admin, json={"status": status})
            assert r.status_code == 200 and r.json()["status"] == status
        done = client.put(f"/api/appointments/{a['id']}", headers=admin, json={"exercises": ["Bridges 3x10"], "follow_up_date": day(14)}).json()
        assert done["completed_at"] and done["exercises"] == ["Bridges 3x10"]

    def test_walk_in_registers_checks_in_and_queues(self, client, admin):
        r = client.post("/api/appointments/walk-in", headers=admin, json={"name": "Asha", "phone": "9222222222", "pain_level": 8})
        assert r.status_code == 201
        appt = r.json()
        assert (appt["status"], appt["token_number"], appt["priority"]) == ("checked_in", "TK-101", "urgent")
        queue = client.get("/api/appointments/queue", headers=admin)
        assert queue.status_code == 200 and "TK-101" in queue.text

    def test_walk_in_reuses_the_patient_with_that_phone(self, client, admin):
        first = client.post("/api/appointments/walk-in", headers=admin, json={"name": "Asha", "phone": "9222222222"}).json()
        second = client.post("/api/appointments/walk-in", headers=admin, json={"name": "Asha", "phone": "9222222222"}).json()
        assert first["patient_id"] == second["patient_id"]
        assert second["token_number"] == "TK-102"


class TestBookingEnquiries:
    def test_booking_a_request_creates_patient_and_confirmed_appointment(self, client, admin, enquire):
        d = day()
        e = enquire(d, MORNING, pain_level=9, service_interest="Dry Needling").json()
        r = client.post(f"/api/enquiries/{e['id']}/book", headers=admin, json={})
        assert r.status_code == 200
        assert r.json()["status"] == "converted"
        appts = client.get("/api/appointments", headers=admin).json()
        assert len(appts) == 1
        a = appts[0]
        assert (a["status"], a["priority"], a["service"]["name"]) == ("confirmed", "urgent", "Dry Needling")
        assert a["scheduled_at"].startswith(d)

    def test_earlier_requests_have_priority_for_a_slot(self, client, admin, enquire):
        d = day()
        first = enquire(d, MORNING).json()
        second = enquire(d, NOON).json()
        r = client.post(f"/api/enquiries/{second['id']}/book", headers=admin, json={"slot": MORNING})
        assert r.status_code == 409   # the earlier request still holds 11:00
        assert client.post(f"/api/enquiries/{first['id']}/book", headers=admin, json={}).status_code == 200

    def test_booking_at_another_time_notes_the_move(self, client, admin, enquire):
        d = day()
        e = enquire(d, MORNING).json()
        client.post(f"/api/enquiries/{e['id']}/book", headers=admin, json={"slot": "03:00 PM (Afternoon)"})
        appt = client.get("/api/appointments", headers=admin).json()[0]
        assert appt["scheduled_at"].startswith(f"{d}T15:00")
        assert "moved to" in appt["notes"]

    def test_closed_requests_cannot_be_booked(self, client, admin, enquire):
        e = enquire(day(), MORNING).json()
        client.put(f"/api/enquiries/{e['id']}", headers=admin, json={"status": "closed"})
        assert client.post(f"/api/enquiries/{e['id']}/book", headers=admin, json={}).status_code == 400

    def test_only_admins_can_overbook_a_request(self, client, admin, receptionist, enquire, patient_id):
        d = day()
        e = enquire(d, NOON).json()
        create(client, admin, patient_id, at(d, 11))
        assert client.post(f"/api/enquiries/{e['id']}/book?force=true", headers=receptionist, json={"slot": MORNING}).status_code == 403
        assert client.post(f"/api/enquiries/{e['id']}/book?force=true", headers=admin, json={"slot": MORNING}).status_code == 200

    def test_staff_list_flags_requests_whose_slot_was_taken(self, client, admin, enquire, patient_id):
        d = day()
        e = enquire(d, MORNING).json()
        client.post("/api/appointments?force=true", headers=admin, json={"patient_id": patient_id, "scheduled_at": at(d, 11)})
        listed = next(x for x in client.get("/api/enquiries", headers=admin).json() if x["id"] == e["id"])
        assert listed["slot_conflict"]
