from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """Staff accounts (admin | receptionist) and patient accounts created through website sign-up"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), default="receptionist")  # admin | receptionist | patient
    phone = Column(String(20), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)  # patient accounts only
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    appointments_created = relationship("Appointment", back_populates="created_by_user")
    patient = relationship("Patient")
