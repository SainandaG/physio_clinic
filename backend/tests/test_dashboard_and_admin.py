"""Dashboard numbers, health check, and clinic management (doctors, services, patients)."""
from tests.conftest import MORNING, at, day


def test_health_check(client):
    r = client.get("/api/health")
    assert r.status_code == 200 and r.json() == {"status": "ok"}


class TestDashboard:
    def test_empty_clinic(self, client, admin):
        stats = client.get("/api/dashboard/stats", headers=admin).json()
        assert stats["total_patients"] == 0 and stats["today_appointments"] == 0
        ov = client.get("/api/dashboard/overview", headers=admin).json()
        assert len(ov["trend"]) == 14
        assert ov["utilisation"] == {"booked": 0, "capacity": 9}
        assert ov["today"] == [] and ov["recent_enquiries"] == []

    def test_counts_follow_clinic_activity(self, client, admin, signup, enquire):
        client.post("/api/appointments/walk-in", headers=admin, json={"name": "Asha", "phone": "9222222222", "service_id": 1})
        enquire(day(), MORNING, pain_level=7)
        signup()
        stats = client.get("/api/dashboard/stats", headers=admin).json()
        assert stats["waiting_now"] == 1
        assert stats["today_appointments"] == 1
        assert stats["new_enquiries"] == 1
        assert stats["total_patients"] == 2   # the walk-in and the new account's record

        ov = client.get("/api/dashboard/overview", headers=admin).json()
        assert [a["patient"] for a in ov["today"]] == ["Asha"]
        assert ov["utilisation"]["booked"] == 1
        assert ov["trend"][-1]["appointments"] == 1
        assert ov["trend"][-1]["enquiries"] == 1
        assert ov["patient_accounts"] == 1
        assert ov["services"][0] == {"name": "Electrotherapy", "count": 1}
        assert ov["recent_enquiries"][0]["pain_level"] == 7

    def test_capacity_grows_with_doctors(self, client, admin, second_doctor):
        assert client.get("/api/dashboard/overview", headers=admin).json()["utilisation"]["capacity"] == 18

    def test_week_comparison_ignores_cancellations(self, client, admin, patient_id):
        a = client.post("/api/appointments", headers=admin, json={"patient_id": patient_id, "scheduled_at": at(day(0), 18)}).json()
        before = client.get("/api/dashboard/overview", headers=admin).json()["week"]["current"]
        client.delete(f"/api/appointments/{a['id']}", headers=admin)
        after = client.get("/api/dashboard/overview", headers=admin).json()["week"]["current"]
        assert before - after == 1


class TestDoctors:
    def test_seeded_lead_doctor_is_public(self, client):
        doctors = client.get("/api/doctors").json()
        assert [d["name"] for d in doctors] == ["Dr Tharun"]

    def test_inactive_doctors_are_hidden_from_the_website(self, client, admin, second_doctor):
        client.put(f"/api/doctors/{second_doctor}", headers=admin, json={"is_active": False})
        assert second_doctor not in [d["id"] for d in client.get("/api/doctors").json()]
        assert second_doctor in [d["id"] for d in client.get("/api/doctors/all", headers=admin).json()]

    def test_the_last_active_doctor_cannot_be_removed(self, client, admin, lead_doctor):
        assert client.put(f"/api/doctors/{lead_doctor}", headers=admin, json={"is_active": False}).status_code == 400
        assert client.delete(f"/api/doctors/{lead_doctor}", headers=admin).status_code == 400

    def test_a_doctor_with_history_is_deactivated_not_deleted(self, client, admin, second_doctor, enquire):
        enquire(day(), MORNING, doctor_id=second_doctor)
        r = client.delete(f"/api/doctors/{second_doctor}", headers=admin)
        assert r.status_code == 200 and "deactivated" in r.json()["message"]
        assert second_doctor in [d["id"] for d in client.get("/api/doctors/all", headers=admin).json()]

    def test_a_doctor_without_history_is_deleted(self, client, admin, second_doctor):
        client.delete(f"/api/doctors/{second_doctor}", headers=admin)
        assert second_doctor not in [d["id"] for d in client.get("/api/doctors/all", headers=admin).json()]


class TestServices:
    def test_standard_treatments_are_seeded(self, client):
        names = [s["name"] for s in client.get("/api/services").json()]
        assert len(names) == 7 and "Chiropractic Care" in names

    def test_inactive_services_are_hidden_from_the_website(self, client, admin):
        sid = client.get("/api/services").json()[0]["id"]
        client.put(f"/api/services/{sid}", headers=admin, json={"is_active": False})
        assert sid not in [s["id"] for s in client.get("/api/services").json()]
        assert sid in [s["id"] for s in client.get("/api/services/all", headers=admin).json()]

    def test_create_and_delete(self, client, admin):
        s = client.post("/api/services", headers=admin, json={"name": "Shockwave Therapy", "display_order": 7}).json()
        assert "Shockwave Therapy" in [x["name"] for x in client.get("/api/services").json()]
        assert client.delete(f"/api/services/{s['id']}", headers=admin).status_code == 200
        assert client.delete(f"/api/services/{s['id']}", headers=admin).status_code == 404


class TestPatients:
    def test_search_by_name_or_phone(self, client, admin):
        client.post("/api/patients", headers=admin, json={"name": "Meera Rao", "phone": "9333333333"})
        client.post("/api/patients", headers=admin, json={"name": "Arjun", "phone": "9444444444"})
        assert [p["name"] for p in client.get("/api/patients", headers=admin, params={"search": "meera"}).json()] == ["Meera Rao"]
        assert [p["name"] for p in client.get("/api/patients", headers=admin, params={"search": "94444"}).json()] == ["Arjun"]

    def test_deleting_deactivates_and_hides_the_patient(self, client, admin, patient_id):
        client.delete(f"/api/patients/{patient_id}", headers=admin)
        assert client.get("/api/patients", headers=admin).json() == []
        assert client.get(f"/api/patients/{patient_id}", headers=admin).status_code == 200   # history kept

    def test_missing_patient(self, client, admin):
        assert client.get("/api/patients/99999", headers=admin).status_code == 404
