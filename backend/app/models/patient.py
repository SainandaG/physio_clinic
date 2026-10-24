from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Patient(Base):
    """Patient records — both walk-in and website enquiries"""
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(200), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(10), nullable=True)  # male | female | other
    condition = Column(Text, nullable=True)      # Chief complaint
    notes = Column(Text, nullable=True)          # Internal notes
    source = Column(String(20), default="walk_in")  # walk_in | website
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    appointments = relationship("Appointment", back_populates="patient")
