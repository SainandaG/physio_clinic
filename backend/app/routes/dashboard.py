from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
from app.database import get_db
from app.auth import get_current_user
from app.models.patient import Patient
from app.models.service import Appointment, Enquiry, Service
from app.schemas import DashboardStats
from app.slots import CLINIC_TZ, slot_datetime

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), _=Depends(get_current_user)):
    today_start = slot_datetime(datetime.now(CLINIC_TZ).date(), 0)
    today_end = today_start + timedelta(days=1)

    total_patients = db.query(Patient).filter(Patient.is_active == True).count()
    walkin_patients = db.query(Patient).filter(Patient.source == "walk_in", Patient.is_active == True).count()
    website_patients = db.query(Patient).filter(Patient.source == "website", Patient.is_active == True).count()
    total_appointments = db.query(Appointment).count()
    pending_appointments = db.query(Appointment).filter(Appointment.status == "pending").count()
    completed_appointments = db.query(Appointment).filter(Appointment.status == "completed").count()
    new_enquiries = db.query(Enquiry).filter(Enquiry.status == "new").count()
    today_appointments = db.query(Appointment).filter(
        Appointment.scheduled_at >= today_start,
        Appointment.scheduled_at < today_end,
    ).count()

    waiting_now = db.query(Appointment).filter(
        Appointment.status == "checked_in", Appointment.checked_in_at >= today_start,
    ).count()
    in_therapy_now = db.query(Appointment).filter(
        Appointment.status == "in_therapy", Appointment.checked_in_at >= today_start,
    ).count()

    return DashboardStats(
        total_patients=total_patients,
        walkin_patients=walkin_patients,
        website_patients=website_patients,
        total_appointments=total_appointments,
        pending_appointments=pending_appointments,
        completed_appointments=completed_appointments,
        new_enquiries=new_enquiries,
        today_appointments=today_appointments,
        waiting_now=waiting_now,
        in_therapy_now=in_therapy_now,
    )


@router.get("/chart/patients-by-month")
def patients_by_month(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Return patient count grouped by month for the past 6 months."""
    results = db.query(
        func.to_char(Patient.created_at, "Mon YYYY").label("month"),
        Patient.source,
        func.count(Patient.id).label("count"),
    ).filter(
        Patient.created_at >= datetime.now() - timedelta(days=180)
    ).group_by("month", Patient.source).all()

    return [{"month": r.month, "source": r.source, "count": r.count} for r in results]


@router.get("/chart/appointments-by-status")
def appointments_by_status(db: Session = Depends(get_db), _=Depends(get_current_user)):
    results = db.query(
        Appointment.status,
        func.count(Appointment.id).label("count"),
    ).group_by(Appointment.status).all()
    return [{"status": r.status, "count": r.count} for r in results]


@router.get("/overview")
def overview(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Everything the dashboard draws besides the headline counts: 14-day trend, today's list,
    service mix, week-on-week and month-on-month comparisons, slot utilisation."""
    from app.models.doctor import Doctor
    from app.models.user import User
    from app.slots import SLOTS, ACTIVE_APPT_STATUSES, to_clinic_time

    today = datetime.now(CLINIC_TZ).date()
    start = today - timedelta(days=13)
    start_dt = slot_datetime(start, 0)
    end_dt = slot_datetime(today, 0) + timedelta(days=1)

    # 14-day trend, bucketed by clinic-local day
    days = {start + timedelta(days=i): {"appointments": 0, "completed": 0, "enquiries": 0} for i in range(14)}
    for scheduled_at, status_ in db.query(Appointment.scheduled_at, Appointment.status).filter(
        Appointment.scheduled_at >= start_dt, Appointment.scheduled_at < end_dt, Appointment.status != "cancelled",
    ):
        bucket = days.get(to_clinic_time(scheduled_at).date())
        if bucket:
            bucket["appointments"] += 1
            bucket["completed"] += status_ == "completed"
    for (created_at,) in db.query(Enquiry.created_at).filter(Enquiry.created_at >= start_dt):
        bucket = days.get(to_clinic_time(created_at).date())
        if bucket:
            bucket["enquiries"] += 1
    trend = [{"date": d.isoformat(), **v} for d, v in days.items()]

    # Today's schedule
    today_start = slot_datetime(today, 0)
    todays = db.query(Appointment).filter(
        Appointment.scheduled_at >= today_start, Appointment.scheduled_at < today_start + timedelta(days=1),
    ).order_by(Appointment.scheduled_at).all()
    today_list = [{
        "id": a.id, "time": to_clinic_time(a.scheduled_at).strftime("%I:%M %p"),
        "patient": a.patient.name if a.patient else "—", "service": a.service.name if a.service else None,
        "doctor": a.doctor.name if a.doctor else None, "status": a.status, "token": a.token_number,
    } for a in todays]

    # Slot utilisation today (active bookings / bookable slots across active doctors)
    doctors = db.query(Doctor).filter(Doctor.is_active == True).count() or 1
    booked_today = sum(1 for a in todays if a.status in ACTIVE_APPT_STATUSES)
    capacity = len(SLOTS) * doctors

    # Service mix, last 90 days
    mix = db.query(func.coalesce(Service.name, "Unspecified"), func.count(Appointment.id)).outerjoin(
        Service, Appointment.service_id == Service.id,
    ).filter(Appointment.created_at >= datetime.now(CLINIC_TZ) - timedelta(days=90)).group_by(Service.name).all()
    services = sorted(({"name": n, "count": c} for n, c in mix), key=lambda r: -r["count"])

    # Comparisons
    week_start = slot_datetime(today - timedelta(days=today.weekday()), 0)
    def appts_between(a, b):
        return db.query(Appointment).filter(Appointment.scheduled_at >= a, Appointment.scheduled_at < b, Appointment.status != "cancelled").count()
    this_week = appts_between(week_start, week_start + timedelta(days=7))
    last_week = appts_between(week_start - timedelta(days=7), week_start)

    month_start = slot_datetime(today.replace(day=1), 0)
    prev_month_start = slot_datetime((today.replace(day=1) - timedelta(days=1)).replace(day=1), 0)
    new_patients = db.query(Patient).filter(Patient.created_at >= month_start).count()
    new_patients_prev = db.query(Patient).filter(Patient.created_at >= prev_month_start, Patient.created_at < month_start).count()

    since = datetime.now(CLINIC_TZ) - timedelta(days=30)
    past = db.query(Appointment.status).filter(Appointment.scheduled_at >= since, Appointment.scheduled_at < datetime.now(CLINIC_TZ)).all()
    finished = sum(1 for (s,) in past if s == "completed")
    cancelled = sum(1 for (s,) in past if s == "cancelled")

    recent_enquiries = db.query(Enquiry).filter(Enquiry.status == "new").order_by(Enquiry.created_at.desc()).limit(5).all()

    return {
        "trend": trend,
        "today": today_list,
        "utilisation": {"booked": booked_today, "capacity": capacity},
        "services": services,
        "week": {"current": this_week, "previous": last_week},
        "new_patients": {"current": new_patients, "previous": new_patients_prev},
        "completion": {"completed": finished, "cancelled": cancelled, "total": len(past)},
        "patient_accounts": db.query(User).filter(User.role == "patient").count(),
        "recent_enquiries": [{
            "id": e.id, "name": e.name, "service": e.service_interest, "pain_level": e.pain_level,
            "preferred": " · ".join(filter(None, [e.preferred_date, e.preferred_slot])), "created_at": e.created_at.isoformat(),
        } for e in recent_enquiries],
    }
