from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.database import get_db
from app.auth import get_current_user
from app.config import settings
from app.models.schedule import BlockedSlot
from app.schemas import BlockedSlotCreate, BlockedSlotOut
from app.slots import (
    SLOTS, SLOT_HOURS, CLINIC_TZ, PUBLIC_REASONS,
    day_schedule, slot_conflict, slot_datetime, next_available, resolve_doctor_id,
)

router = APIRouter(prefix="/api/schedule", tags=["Schedule"])


def _block_out(b: BlockedSlot) -> BlockedSlotOut:
    return BlockedSlotOut(id=b.id, date=b.date, slot=SLOTS.get(b.slot_hour), reason=b.reason, doctor_id=b.doctor_id)


@router.get("/availability")
def public_availability(date: date, doctor_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Public — which of a doctor's slots on `date` can still be requested. Reveals no patient details."""
    doctor_id = resolve_doctor_id(db, doctor_id)
    schedule = day_schedule(db, date, doctor_id)
    slots = []
    for hour, label in SLOTS.items():
        conflict = slot_conflict(db, date, hour, check_past=True, schedule=schedule)
        slots.append({
            "slot": label,
            "available": conflict is None,
            "reason": conflict[0] if conflict else None,
        })
    result = {"date": date.isoformat(), "slots": slots}
    if not any(s["available"] for s in slots):
        result["message"] = PUBLIC_REASONS["closed"] if schedule[0] else "All slots on this date are taken."
        result["alternatives"] = next_available(db, date, doctor_id)
    return result


@router.get("/day")
def admin_day(date: date, doctor_id: Optional[int] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Staff — full picture of one doctor's day: who holds each slot and what is blocked."""
    doctor_id = resolve_doctor_id(db, doctor_id)
    day_block, hours = day_schedule(db, date, doctor_id)
    now = datetime.now(CLINIC_TZ)
    slots = []
    for hour, label in SLOTS.items():
        h = hours[hour]
        conflict = slot_conflict(db, date, hour, schedule=(day_block, hours))
        slots.append({
            "slot": label,
            "past": slot_datetime(date, hour) <= now,
            "available": conflict is None,
            "reason": conflict[0] if conflict else None,
            "capacity": settings.SLOT_CAPACITY,
            "block": _block_out(h["blocked"]) if h["blocked"] else None,
            "appointments": [
                {"id": a.id, "patient": a.patient.name if a.patient else None,
                 "phone": a.patient.phone if a.patient else None, "status": a.status}
                for a in h["appointments"]
            ],
            "enquiries": [
                {"id": e.id, "name": e.name, "phone": e.phone, "status": e.status}
                for e in h["enquiries"]
            ],
        })
    # Appointments entered at times that aren't standard slots
    off_slot = [
        {"id": a.id, "hour": hour, "patient": a.patient.name if a.patient else None, "status": a.status}
        for hour, h in hours.items() if hour not in SLOTS for a in h["appointments"]
    ]
    return {
        "date": date.isoformat(),
        "doctor_id": doctor_id,
        "day_block": _block_out(day_block) if day_block else None,
        "slots": slots,
        "off_slot_appointments": off_slot,
    }


@router.get("/blocks", response_model=List[BlockedSlotOut])
def list_blocks(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Upcoming closures and blocked slots."""
    today = datetime.now(CLINIC_TZ).date()
    blocks = db.query(BlockedSlot).filter(BlockedSlot.date >= today).order_by(
        BlockedSlot.date, BlockedSlot.slot_hour.nullsfirst()
    ).all()
    return [_block_out(b) for b in blocks]


@router.post("/blocks", response_model=BlockedSlotOut, status_code=201)
def create_block(data: BlockedSlotCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if data.slot is not None and data.slot not in SLOT_HOURS:
        raise HTTPException(status_code=422, detail="Unknown time slot")
    hour = SLOT_HOURS.get(data.slot)
    doctor_id = resolve_doctor_id(db, data.doctor_id) if data.doctor_id else None
    existing = db.query(BlockedSlot).filter(
        BlockedSlot.date == data.date,
        BlockedSlot.slot_hour.is_(None) if hour is None else BlockedSlot.slot_hour == hour,
        BlockedSlot.doctor_id.is_(None) if doctor_id is None else BlockedSlot.doctor_id == doctor_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already blocked")
    block = BlockedSlot(date=data.date, slot_hour=hour, reason=data.reason, doctor_id=doctor_id, created_by=current_user.id)
    db.add(block)
    db.commit()
    db.refresh(block)
    return _block_out(block)


@router.delete("/blocks/{block_id}")
def delete_block(block_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    block = db.query(BlockedSlot).filter(BlockedSlot.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    db.delete(block)
    db.commit()
    return {"message": "Unblocked"}
