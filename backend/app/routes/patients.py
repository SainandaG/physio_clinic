from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.auth import get_current_user
from app.models.patient import Patient
from app.schemas import PatientCreate, PatientUpdate, PatientOut

router = APIRouter(prefix="/api/patients", tags=["Patients"])


@router.get("", response_model=List[PatientOut])
def list_patients(
    source: Optional[str] = Query(None, description="walk_in | website"),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Patient).filter(Patient.is_active == True)
    if source:
        q = q.filter(Patient.source == source)
    if search:
        q = q.filter(
            (Patient.name.ilike(f"%{search}%")) | (Patient.phone.ilike(f"%{search}%"))
        )
    return q.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=PatientOut, status_code=201)
def create_patient(data: PatientCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    patient = Patient(**data.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(patient_id: int, data: PatientUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient.is_active = False
    db.commit()
    return {"message": "Patient deactivated"}
