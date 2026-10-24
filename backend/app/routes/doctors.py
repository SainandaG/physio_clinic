from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user, require_admin
from app.models.doctor import Doctor
from app.models.service import Appointment, Enquiry
from app.models.schedule import BlockedSlot
from app.schemas import DoctorCreate, DoctorUpdate, DoctorOut

router = APIRouter(prefix="/api/doctors", tags=["Doctors"])


@router.get("", response_model=List[DoctorOut])
def list_active_doctors(db: Session = Depends(get_db)):
    """Public — doctors currently accepting bookings, lead doctor first."""
    return db.query(Doctor).filter(Doctor.is_active == True).order_by(Doctor.display_order, Doctor.id).all()


@router.get("/all", response_model=List[DoctorOut])
def list_all_doctors(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Doctor).order_by(Doctor.display_order, Doctor.id).all()


@router.post("", response_model=DoctorOut, status_code=201)
def create_doctor(data: DoctorCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if data.display_order is None:
        # New doctors go after existing ones, so the lead (default) doctor doesn't change
        data.display_order = (db.query(func.max(Doctor.display_order)).scalar() or 0) + 1
    doctor = Doctor(**data.model_dump())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.put("/{doctor_id}", response_model=DoctorOut)
def update_doctor(doctor_id: int, data: DoctorUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    if data.is_active is False and doctor.is_active:
        others = db.query(Doctor).filter(Doctor.is_active == True, Doctor.id != doctor_id).count()
        if not others:
            raise HTTPException(status_code=400, detail="At least one doctor must stay active to take bookings")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(doctor, field, value)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.delete("/{doctor_id}")
def delete_doctor(doctor_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Removes a doctor with no history; otherwise deactivates them so past records stay intact."""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    if doctor.is_active and not db.query(Doctor).filter(Doctor.is_active == True, Doctor.id != doctor_id).count():
        raise HTTPException(status_code=400, detail="At least one doctor must stay active to take bookings")
    has_history = db.query(Appointment).filter(Appointment.doctor_id == doctor_id).count() \
        or db.query(Enquiry).filter(Enquiry.doctor_id == doctor_id).count()
    if has_history:
        doctor.is_active = False
        db.commit()
        return {"message": "Doctor has booking history, so they were deactivated instead of deleted"}
    db.query(BlockedSlot).filter(BlockedSlot.doctor_id == doctor_id).delete()
    db.delete(doctor)
    db.commit()
    return {"message": "Doctor removed"}
