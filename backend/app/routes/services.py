from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user
from app.content import slugify
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


def _tidy(db: Session, values: dict, service_id: int = 0, name: str = "") -> dict:
    """Unique URL slug (from the name when blank) and no empty list lines."""
    if "slug" in values or not service_id:
        base = slug = slugify(values.get("slug") or values.get("name") or name)
        n = 2
        while db.query(Service).filter(Service.slug == slug, Service.id != service_id).first():
            slug, n = f"{base}-{n}", n + 1
        values["slug"] = slug
    for field in ("helps_with", "expect"):
        if values.get(field) is not None:
            values[field] = [x.strip() for x in values[field] if x and x.strip()]
    return values


@router.post("", response_model=ServiceOut, status_code=201)
def create_service(data: ServiceCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    service = Service(**_tidy(db, data.model_dump()))
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/{service_id}", response_model=ServiceOut)
def update_service(service_id: int, data: ServiceUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    for field, value in _tidy(db, data.model_dump(exclude_none=True), service.id, service.name).items():
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
