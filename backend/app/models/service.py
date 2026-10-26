from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Service(Base):
    """Clinic services offered"""
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(10), nullable=True)      # emoji icon
    image_url = Column(String(500), nullable=True)
    whatsapp_message = Column(Text, nullable=True)  # Pre-filled WA message
    # Treatment page (/treatments/<slug>); description doubles as the card summary
    slug = Column(String(160), nullable=True, index=True)
    about = Column(Text, nullable=True)
    helps_with = Column(JSON, nullable=True)        # list of strings
    expect = Column(JSON, nullable=True)            # list of strings
    note = Column(Text, nullable=True)              # "Is it right for me?" caution
    seo_title = Column(String(200), nullable=True)
    seo_description = Column(String(300), nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    appointments = relationship("Appointment", back_populates="service")


class Appointment(Base):
    """Appointments for patients"""
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True, index=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="pending")  # pending|confirmed|checked_in|in_therapy|completed|cancelled
    notes = Column(Text, nullable=True)              # Therapy progress & clinical notes
    source = Column(String(20), default="walk_in")   # walk_in | website | whatsapp | referral
    token_number = Column(String(10), nullable=True)  # Daily queue token, e.g. "TK-101" — issued at check-in
    pain_level = Column(Integer, nullable=True)       # 1-10
    priority = Column(String(20), default="routine")  # routine | moderate | urgent
    exercises = Column(JSON, nullable=True)           # Prescribed home exercises (list of strings)
    follow_up_date = Column(Date, nullable=True)
    checked_in_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    service = relationship("Service", back_populates="appointments")
    doctor = relationship("Doctor")
    created_by_user = relationship("User", back_populates="appointments_created")


class Enquiry(Base):
    """Website enquiries before they are converted to patients"""
    __tablename__ = "enquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(200), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(10), nullable=True)
    service_interest = Column(String(200), nullable=True)
    pain_level = Column(Integer, nullable=True)          # 1-10 slider
    message = Column(Text, nullable=True)                # Symptoms / diagnosis
    preferred_date = Column(String(30), nullable=True)
    preferred_slot = Column(String(50), nullable=True)   # e.g. "11:00 AM (Morning)"
    specialist = Column(String(200), nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True, index=True)
    status = Column(String(20), default="new")  # new|contacted|converted|closed
    converted_patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
