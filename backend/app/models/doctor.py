from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class Doctor(Base):
    """Consulting physiotherapists — each has their own appointment slots"""
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)             # e.g. "Dr Tharun"
    qualification = Column(String(200), nullable=True)     # e.g. "MPT (Sports & Manual Therapy)"
    specialization = Column(String(250), nullable=True)
    bio = Column(Text, nullable=True)
    available_days = Column(String(120), nullable=True)    # e.g. "Monday – Saturday"
    timings = Column(String(120), nullable=True)           # e.g. "9:00 AM – 7:00 PM"
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
