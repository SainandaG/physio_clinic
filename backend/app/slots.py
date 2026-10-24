"""Clinic time slots and availability checks shared by the public form and the admin desk."""
from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
from typing import Optional
from fastapi import HTTPException
from sqlalchemy import text, or_
from sqlalchemy.orm import Session, joinedload
from app.config import settings
from app.models.service import Appointment, Enquiry
from app.models.schedule import BlockedSlot
from app.models.doctor import Doctor

CLINIC_TZ = timezone(timedelta(hours=5, minutes=30))  # IST has no DST, so a fixed offset is exact

# Start hour (24h) -> label used on the website. Labels must match frontend/src/utils/slots.js
SLOTS = {
    9: "09:00 AM (Morning)",
    10: "10:00 AM (Morning)",
    11: "11:00 AM (Morning)",
    12: "12:00 PM (Noon)",
    14: "02:00 PM (Afternoon)",
    15: "03:00 PM (Afternoon)",
    16: "04:00 PM (Afternoon)",
    17: "05:00 PM (Evening)",
    18: "06:00 PM (Evening)",
}
SLOT_HOURS = {label: hour for hour, label in SLOTS.items()}

ACTIVE_APPT_STATUSES = ("pending", "confirmed", "checked_in", "in_therapy", "completed")
HOLDING_ENQUIRY_STATUSES = ("new", "contacted")   # website requests that still reserve their slot

PUBLIC_REASONS = {
    "past": "This time has already passed. Please choose a later slot.",
    "closed": "The clinic is closed on this date. Please choose another day.",
    "blocked": "This slot is unavailable. Please choose another time.",
    "booked": "Sorry, this slot has just been booked. Please choose another time.",
}


def to_clinic_time(dt: datetime) -> datetime:
    """Naive datetimes are treated as clinic-local time."""
    return dt.replace(tzinfo=CLINIC_TZ) if dt.tzinfo is None else dt.astimezone(CLINIC_TZ)


def slot_datetime(d: date, hour: int) -> datetime:
    return datetime.combine(d, time(hour), tzinfo=CLINIC_TZ)


def parse_slot(date_str: str, slot_label: str) -> tuple[date, int]:
    try:
        d = date.fromisoformat(date_str)
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="Invalid preferred date")
    if slot_label not in SLOT_HOURS:
        raise HTTPException(status_code=422, detail="Unknown time slot")
    return d, SLOT_HOURS[slot_label]


def resolve_doctor_id(db: Session, doctor_id: Optional[int]) -> int:
    """The requested active doctor, or the clinic's lead doctor when none is given."""
    q = db.query(Doctor).filter(Doctor.is_active == True)
    doctor = q.filter(Doctor.id == doctor_id).first() if doctor_id else q.order_by(Doctor.display_order, Doctor.id).first()
    if not doctor:
        raise HTTPException(status_code=422, detail="Doctor not found or not currently accepting bookings")
    return doctor.id


def lock_day(db: Session, d: date):
    """Serialise bookings for one day so two requests can't both take the last place.
    Released automatically when the transaction commits or rolls back."""
    db.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": d.toordinal()})


def day_schedule(db: Session, d: date, doctor_id: int):
    """Everything occupying one doctor's day: (whole-day block, {hour: {appointments, enquiries, blocked}}).
    Clinic-wide blocks (doctor_id NULL) apply to every doctor."""
    start = slot_datetime(d, 0)
    hours = defaultdict(lambda: {"appointments": [], "enquiries": [], "blocked": None})

    appts = db.query(Appointment).options(joinedload(Appointment.patient)).filter(
        Appointment.scheduled_at >= start,
        Appointment.scheduled_at < start + timedelta(days=1),
        Appointment.status.in_(ACTIVE_APPT_STATUSES),
        Appointment.doctor_id == doctor_id,
    ).all()
    for a in appts:
        hours[to_clinic_time(a.scheduled_at).hour]["appointments"].append(a)

    enquiries = db.query(Enquiry).filter(
        Enquiry.preferred_date == d.isoformat(),
        Enquiry.status.in_(HOLDING_ENQUIRY_STATUSES),
        Enquiry.doctor_id == doctor_id,
    ).order_by(Enquiry.id).all()
    for e in enquiries:
        if e.preferred_slot in SLOT_HOURS:
            hours[SLOT_HOURS[e.preferred_slot]]["enquiries"].append(e)

    day_block = None
    blocks = db.query(BlockedSlot).filter(
        BlockedSlot.date == d, or_(BlockedSlot.doctor_id.is_(None), BlockedSlot.doctor_id == doctor_id),
    ).order_by(BlockedSlot.doctor_id.nullsfirst()).all()   # clinic-wide blocks win
    for b in blocks:
        if b.slot_hour is None:
            day_block = day_block or b
        else:
            hours[b.slot_hour]["blocked"] = hours[b.slot_hour]["blocked"] or b
    return day_block, hours


def slot_conflict(
    db: Session, d: date, hour: int, *,
    doctor_id: Optional[int] = None,
    exclude_appt_id: Optional[int] = None,
    for_enquiry_id: Optional[int] = None,
    check_past: bool = False,
    schedule=None,
) -> Optional[tuple[str, str]]:
    """Return (reason, staff-facing message) if the slot can't take another booking, else None.

    When acting on an enquiry, only enquiries submitted before it take precedence (first come, first served).
    """
    day_block, hours = schedule or day_schedule(db, d, doctor_id)
    if check_past and slot_datetime(d, hour) <= datetime.now(CLINIC_TZ):
        return "past", "This time has already passed"
    if day_block:
        who = "Doctor unavailable" if day_block.doctor_id else "Clinic closed"
        return "closed", f"{who} on {d:%d %b %Y}" + (f" — {day_block.reason}" if day_block.reason else "")
    h = hours[hour]
    if h["blocked"]:
        return "blocked", "Slot blocked" + (f" — {h['blocked'].reason}" if h["blocked"].reason else "")

    appts = [a for a in h["appointments"] if a.id != exclude_appt_id]
    enquiries = [e for e in h["enquiries"] if for_enquiry_id is None or e.id < for_enquiry_id]
    if len(appts) + len(enquiries) >= settings.SLOT_CAPACITY:
        taken_by = [f"{a.patient.name if a.patient else 'patient'} (appointment #{a.id})" for a in appts]
        taken_by += [f"{e.name} (website request #{e.id})" for e in enquiries]
        return "booked", "Already booked: " + ", ".join(taken_by)
    return None


def next_available(db: Session, from_date: date, doctor_id: int, count: int = 4, days: int = 14) -> list[dict]:
    """The doctor's next few free slots starting from `from_date`."""
    found = []
    for offset in range(days):
        d = from_date + timedelta(days=offset)
        schedule = day_schedule(db, d, doctor_id)
        for hour, label in SLOTS.items():
            if not slot_conflict(db, d, hour, check_past=True, schedule=schedule):
                found.append({"date": d.isoformat(), "slot": label})
                if len(found) == count:
                    return found
    return found


def raise_unavailable(db: Session, d: date, doctor_id: int, reason: str, message: str):
    raise HTTPException(status_code=409, detail={
        "code": "slot_unavailable",
        "reason": reason,
        "message": message,
        "alternatives": next_available(db, max(d, datetime.now(CLINIC_TZ).date()), doctor_id),
    })
