from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from datetime import datetime, date, timedelta
from app.database import get_db
from app.auth import get_current_user
from app.models.service import Appointment
from app.models.patient import Patient
from app.schemas import AppointmentCreate, AppointmentUpdate, AppointmentOut, WalkInCreate
from app.slots import (
    ACTIVE_APPT_STATUSES, CLINIC_TZ, to_clinic_time, slot_datetime,
    lock_day, slot_conflict, raise_unavailable, resolve_doctor_id,
)

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

STATUSES = ("pending", "confirmed", "checked_in", "in_therapy", "completed", "cancelled")
PRIORITIES = ("routine", "moderate", "urgent")


def triage_priority(pain_level: Optional[int]) -> str:
    """Default triage from the 1-10 pain scale; staff can override."""
    if pain_level is None:
        return "routine"
    return "urgent" if pain_level >= 8 else "moderate" if pain_level >= 5 else "routine"


def _validate(status: Optional[str] = None, priority: Optional[str] = None, pain_level: Optional[int] = None):
    if status is not None and status not in STATUSES:
        raise HTTPException(status_code=422, detail=f"Status must be one of: {', '.join(STATUSES)}")
    if priority is not None and priority not in PRIORITIES:
        raise HTTPException(status_code=422, detail=f"Priority must be one of: {', '.join(PRIORITIES)}")
    if pain_level is not None and not 1 <= pain_level <= 10:
        raise HTTPException(status_code=422, detail="Pain level must be between 1 and 10")


def _issue_token(db: Session, appt: Appointment, now: datetime):
    """Give the appointment the next daily queue token (TK-101, TK-102, …)."""
    day_start = slot_datetime(now.date(), 0)
    lock_day(db, now.date())
    issued = db.query(Appointment).filter(
        Appointment.checked_in_at >= day_start,
        Appointment.checked_in_at < day_start + timedelta(days=1),
        Appointment.token_number.isnot(None),
    ).count()
    appt.token_number = f"TK-{101 + issued}"


def _ensure_slot_free(db: Session, scheduled_at: datetime, doctor_id: int, force: bool, current_user, exclude_appt_id=None):
    """409 if the doctor's slot is taken or blocked, unless an admin explicitly overbooks."""
    if force:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can overbook a slot")
        return
    local = to_clinic_time(scheduled_at)
    lock_day(db, local.date())
    conflict = slot_conflict(db, local.date(), local.hour, doctor_id=doctor_id, exclude_appt_id=exclude_appt_id)
    if conflict:
        db.rollback()
        raise_unavailable(db, local.date(), doctor_id, *conflict)


def _load(db: Session, appt_id: int) -> Appointment:
    return db.query(Appointment).options(
        joinedload(Appointment.patient), joinedload(Appointment.service), joinedload(Appointment.doctor)
    ).filter(Appointment.id == appt_id).first()


@router.get("", response_model=List[AppointmentOut])
def list_appointments(
    status: Optional[str] = None,
    source: Optional[str] = None,
    doctor_id: Optional[int] = None,
    search: Optional[str] = Query(None, description="Patient name, phone or token"),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.service),
        joinedload(Appointment.doctor),
    )
    if doctor_id:
        q = q.filter(Appointment.doctor_id == doctor_id)
    if status:
        q = q.filter(Appointment.status == status)
    if source:
        q = q.filter(Appointment.source == source)
    if search:
        like = f"%{search}%"
        q = q.join(Patient).filter(or_(
            Patient.name.ilike(like), Patient.phone.ilike(like), Appointment.token_number.ilike(like),
        ))
    if date_from:
        q = q.filter(Appointment.scheduled_at >= slot_datetime(date_from, 0))
    if date_to:
        q = q.filter(Appointment.scheduled_at < slot_datetime(date_to, 0) + timedelta(days=1))
    return q.order_by(Appointment.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/queue")
def todays_queue(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Today's checked-in patients for the waiting-room token screen. First names only."""
    now = datetime.now(CLINIC_TZ)
    day_start = slot_datetime(now.date(), 0)
    appts = db.query(Appointment).options(joinedload(Appointment.patient), joinedload(Appointment.doctor)).filter(
        Appointment.checked_in_at >= day_start,
        Appointment.checked_in_at < day_start + timedelta(days=1),
        Appointment.status.in_(("checked_in", "in_therapy")),
    ).order_by(Appointment.checked_in_at).all()

    def entry(a):
        return {
            "token": a.token_number,
            "name": a.patient.name.split()[0] if a.patient else "",
            "priority": a.priority,
            "doctor": a.doctor.name if a.doctor else None,
            "checked_in_at": a.checked_in_at,
        }
    # Urgent cases are called first, then in arrival order
    rank = {"urgent": 0, "moderate": 1, "routine": 2}
    waiting = sorted((a for a in appts if a.status == "checked_in"), key=lambda a: (rank.get(a.priority, 2), a.checked_in_at))
    return {
        "in_therapy": [entry(a) for a in appts if a.status == "in_therapy"],
        "waiting": [entry(a) for a in waiting],
    }


@router.post("", response_model=AppointmentOut, status_code=201)
def create_appointment(
    data: AppointmentCreate,
    force: bool = False,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate(priority=data.priority, pain_level=data.pain_level)
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    data.doctor_id = resolve_doctor_id(db, data.doctor_id)
    if data.scheduled_at:
        data.scheduled_at = to_clinic_time(data.scheduled_at)
        _ensure_slot_free(db, data.scheduled_at, data.doctor_id, force, current_user)
    data.priority = data.priority or triage_priority(data.pain_level)
    appt = Appointment(**data.model_dump(), created_by=current_user.id)
    db.add(appt)
    db.commit()
    return _load(db, appt.id)


@router.post("/walk-in", response_model=AppointmentOut, status_code=201)
def register_walk_in(data: WalkInCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Patient is at the front desk: find or register them, check in now and issue a token.
    No slot check — they are already here; the token queue sets the order."""
    _validate(priority=data.priority, pain_level=data.pain_level)
    patient = db.query(Patient).filter(Patient.phone == data.phone.strip(), Patient.is_active == True).first()
    if not patient:
        patient = Patient(
            name=data.name.strip(), phone=data.phone.strip(), age=data.age,
            gender=data.gender.lower() if data.gender else None,
            condition=data.condition, source=data.source,
        )
        db.add(patient)
        db.flush()
    now = datetime.now(CLINIC_TZ)
    appt = Appointment(
        patient_id=patient.id,
        service_id=data.service_id,
        doctor_id=resolve_doctor_id(db, data.doctor_id),
        scheduled_at=now,
        status="checked_in",
        source=data.source,
        pain_level=data.pain_level,
        priority=data.priority or triage_priority(data.pain_level),
        notes=data.condition,
        checked_in_at=now,
        created_by=current_user.id,
    )
    db.add(appt)
    _issue_token(db, appt, now)
    db.commit()
    return _load(db, appt.id)


@router.get("/{appt_id}", response_model=AppointmentOut)
def get_appointment(appt_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    appt = _load(db, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


@router.put("/{appt_id}", response_model=AppointmentOut)
def update_appointment(
    appt_id: int,
    data: AppointmentUpdate,
    force: bool = False,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate(status=data.status, priority=data.priority, pain_level=data.pain_level)
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if data.scheduled_at:
        data.scheduled_at = to_clinic_time(data.scheduled_at)
    if data.doctor_id:
        data.doctor_id = resolve_doctor_id(db, data.doctor_id)
    # Re-check the slot when the time or doctor changes, or a cancelled appointment is reinstated
    new_time = data.scheduled_at or appt.scheduled_at
    new_doctor = data.doctor_id or appt.doctor_id or resolve_doctor_id(db, None)
    moved = (data.scheduled_at is not None and (appt.scheduled_at is None or data.scheduled_at != appt.scheduled_at)) \
        or new_doctor != appt.doctor_id
    reinstated = appt.status == "cancelled" and data.status in ACTIVE_APPT_STATUSES
    if new_time and (data.status or appt.status) != "cancelled" and (moved or reinstated):
        _ensure_slot_free(db, new_time, new_doctor, force, current_user, exclude_appt_id=appt.id)

    now = datetime.now(CLINIC_TZ)
    if data.status == "checked_in" and not appt.checked_in_at:
        appt.checked_in_at = now
        _issue_token(db, appt, now)
    if data.status == "completed" and not appt.completed_at:
        appt.completed_at = now
    if data.pain_level is not None and data.priority is None and appt.pain_level is None:
        data.priority = triage_priority(data.pain_level)

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(appt, field, value)
    db.commit()
    return _load(db, appt_id)


@router.delete("/{appt_id}")
def cancel_appointment(appt_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = "cancelled"
    db.commit()
    return {"message": "Appointment cancelled"}
