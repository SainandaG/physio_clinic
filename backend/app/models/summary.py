from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class TreatmentSummary(Base):
    """The doctor's notes for a patient, printed on the clinic letterhead and shared on WhatsApp.
    No prices. The PDF is built on request, so it always shows the latest saved notes."""
    __tablename__ = "treatment_summaries"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, index=True, nullable=False)   # secret part of the patient's link
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    title = Column(String(120), nullable=True)
    findings = Column(Text, nullable=True)        # assessment / diagnosis
    notes = Column(Text, nullable=True)           # doctor's notes and advice
    exercises = Column(JSON, nullable=True)       # home exercise plan
    follow_up_date = Column(Date, nullable=True)
    auto_created = Column(Boolean, default=False)
    send_status = Column(String(20), default="not_sent")   # not_sent | sent | shared | failed
    send_channel = Column(String(20), nullable=True)       # api | link
    send_error = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    patient = relationship("Patient")
    appointment = relationship("Appointment")
    doctor = relationship("Doctor")
