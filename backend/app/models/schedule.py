from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class BlockedSlot(Base):
    """Times the clinic is not taking bookings — holidays, leave, training"""
    __tablename__ = "blocked_slots"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    slot_hour = Column(Integer, nullable=True)   # 24h start hour; NULL = whole day closed
    reason = Column(String(200), nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)   # NULL = whole clinic
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
