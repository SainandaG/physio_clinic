from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user, get_optional_account
from app.models.service import Enquiry, Appointment, Service
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.schemas import EnquiryCreate, EnquiryUpdate, EnquiryOut, EnquiryBook
from app.routes.appointments import triage_priority
from app.slots import (
    SLOT_HOURS, PUBLIC_REASONS, HOLDING_ENQUIRY_STATUSES,
    parse_slot, lock_day, day_schedule, slot_conflict, slot_datetime, raise_unavailable, resolve_doctor_id,
)

router = APIRouter(prefix="/api/enquiries", tags=["Enquiries"])


@router.post("", response_model=EnquiryOut, status_code=201)
def submit_enquiry(data: EnquiryCreate, db: Session = Depends(get_db), account=Depends(get_optional_account)):
    """Public — no auth needed. Called from the website booking form; a signed-in patient's request is
    linked to their record so it shows in their account and books against it.
    Rejects with 409 (and suggested alternatives) if the requested slot is no longer free."""
    doctor_id = resolve_doctor_id(db, data.doctor_id)
    if data.preferred_date and data.preferred_slot:
        d, hour = parse_slot(data.preferred_date, data.preferred_slot)
        lock_day(db, d)
        conflict = slot_conflict(db, d, hour, doctor_id=doctor_id, check_past=True)
        if conflict:
            db.rollback()
            raise_unavailable(db, d, doctor_id, conflict[0], PUBLIC_REASONS[conflict[0]])
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    enquiry = Enquiry(
        **data.model_dump(exclude={"doctor_id"}),
        doctor_id=doctor_id,
        specialist=" ".join(filter(None, [doctor.name, f"({doctor.qualification})" if doctor.qualification else None])),
        converted_patient_id=account.patient_id if account and account.role == "patient" else None,
    )
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    return enquiry


@router.get("", response_model=List[EnquiryOut])
def list_enquiries(status: str = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(Enquiry)
    if status:
        q = q.filter(Enquiry.status == status)
    enquiries = q.order_by(Enquiry.created_at.desc()).all()

    # Flag open requests whose slot has since been taken, blocked or passed
    schedules = {}
    out = []
    for e in enquiries:
        item = EnquiryOut.model_validate(e)
        if e.status in HOLDING_ENQUIRY_STATUSES and e.preferred_date and e.preferred_slot in SLOT_HOURS:
            try:
                d, hour = parse_slot(e.preferred_date, e.preferred_slot)
            except HTTPException:
                d = None
            if d:
                key = (d, e.doctor_id)
                if key not in schedules:
                    schedules[key] = day_schedule(db, d, e.doctor_id)
                conflict = slot_conflict(db, d, hour, for_enquiry_id=e.id, check_past=True, schedule=schedules[key])
                item.slot_conflict = conflict[1] if conflict else None
        out.append(item)
    return out


@router.put("/{enquiry_id}", response_model=EnquiryOut)
def update_enquiry(enquiry_id: int, data: EnquiryUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(enquiry, field, value)
    db.commit()
    db.refresh(enquiry)
    return enquiry


def _get_or_create_patient(db: Session, enquiry: Enquiry) -> Patient:
    if enquiry.converted_patient_id:
        patient = db.query(Patient).filter(Patient.id == enquiry.converted_patient_id).first()
        if patient:
            return patient
    patient = Patient(
        name=enquiry.name,
        phone=enquiry.phone,
        email=enquiry.email,
        age=enquiry.age,
        gender=enquiry.gender.lower() if enquiry.gender else None,
        condition=enquiry.service_interest,
        notes=enquiry.message,
        source="website",
    )
    db.add(patient)
    db.flush()
    return patient


@router.post("/{enquiry_id}/convert", response_model=EnquiryOut)
def convert_to_patient(enquiry_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """One-click: Convert a website enquiry into a registered patient."""
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    if enquiry.status == "converted":
        raise HTTPException(status_code=400, detail="Already converted")
    patient = _get_or_create_patient(db, enquiry)
    enquiry.status = "converted"
    enquiry.converted_patient_id = patient.id
    db.commit()
    db.refresh(enquiry)
    return enquiry


@router.post("/{enquiry_id}/book", response_model=EnquiryOut)
def book_enquiry(
    enquiry_id: int,
    data: EnquiryBook,
    force: bool = False,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Register the patient and confirm an appointment — at the requested slot,
    or at an alternative when the requested one is taken. `force` (admin only) overbooks."""
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    if enquiry.status == "closed":
        raise HTTPException(status_code=400, detail="Enquiry is closed")
    if force and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can overbook a slot")

    date_str = data.date or enquiry.preferred_date
    slot = data.slot or enquiry.preferred_slot
    if not date_str or not slot:
        raise HTTPException(status_code=422, detail="Choose a date and slot")
    d, hour = parse_slot(date_str, slot)
    doctor_id = resolve_doctor_id(db, data.doctor_id or enquiry.doctor_id)

    lock_day(db, d)
    if not force:
        conflict = slot_conflict(db, d, hour, doctor_id=doctor_id, for_enquiry_id=enquiry.id)
        if conflict:
            db.rollback()
            raise_unavailable(db, d, doctor_id, *conflict)

    patient = _get_or_create_patient(db, enquiry)
    service = db.query(Service).filter(Service.name == enquiry.service_interest).first()
    moved = (date_str, slot) != (enquiry.preferred_date, enquiry.preferred_slot)
    notes = [n for n in [
        f"Requested {enquiry.preferred_date} {enquiry.preferred_slot}; moved to {date_str} {slot}" if moved else None,
        data.notes,
    ] if n]
    db.add(Appointment(
        patient_id=patient.id,
        service_id=service.id if service else None,
        doctor_id=doctor_id,
        scheduled_at=slot_datetime(d, hour),
        status="confirmed",
        notes="\n".join(notes) or None,
        source="website",
        pain_level=enquiry.pain_level,
        priority=triage_priority(enquiry.pain_level),
        created_by=current_user.id,
    ))
    enquiry.status = "converted"
    enquiry.converted_patient_id = patient.id
    db.commit()
    db.refresh(enquiry)
    return enquiry
