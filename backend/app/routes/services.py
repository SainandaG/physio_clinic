from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user
from app.models.service import Service
from app.schemas import ServiceCreate, ServiceUpdate, ServiceOut

router = APIRouter(prefix="/api/services", tags=["Services"])


@router.get("", response_model=List[ServiceOut])
def list_services(db: Session = Depends(get_db)):
    """Public endpoint — no auth required"""
    return db.query(Service).filter(Service.is_active == True).order_by(Service.display_order).all()


@router.get("/all", response_model=List[ServiceOut])
def list_all_services(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Admin endpoint — all services including inactive"""
    return db.query(Service).order_by(Service.display_order).all()


@router.post("", response_model=ServiceOut, status_code=201)
def create_service(data: ServiceCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    service = Service(**data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/{service_id}", response_model=ServiceOut)
def update_service(service_id: int, data: ServiceUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service


@router.delete("/{service_id}")
def delete_service(service_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(service)
    db.commit()
    return {"message": "Service deleted"}
