from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date


# ─── User / Auth ────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "receptionist"


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    patient_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SignupCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=10, max_length=20)
    password: str = Field(min_length=8, max_length=128)


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─── Patient ────────────────────────────────────────────────────────────────

class PatientCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    condition: Optional[str] = None
    notes: Optional[str] = None
    source: str = "walk_in"  # walk_in | website


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    condition: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class PatientOut(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str]
    age: Optional[int]
    gender: Optional[str]
    condition: Optional[str]
    notes: Optional[str]
    source: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Service ─────────────────────────────────────────────────────────────────

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    whatsapp_message: Optional[str] = None
    is_active: bool = True
    display_order: int = 0


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    whatsapp_message: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class ServiceOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    icon: Optional[str]
    image_url: Optional[str]
    whatsapp_message: Optional[str]
    is_active: bool
    display_order: int

    class Config:
        from_attributes = True


# ─── Doctor ──────────────────────────────────────────────────────────────────

class DoctorCreate(BaseModel):
    name: str
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    available_days: Optional[str] = None
    timings: Optional[str] = None
    is_active: bool = True
    display_order: Optional[int] = None     # defaults to after existing doctors


class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    available_days: Optional[str] = None
    timings: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class DoctorOut(BaseModel):
    id: int
    name: str
    qualification: Optional[str]
    specialization: Optional[str]
    bio: Optional[str]
    available_days: Optional[str]
    timings: Optional[str]
    is_active: bool
    display_order: int

    class Config:
        from_attributes = True


class DoctorBrief(BaseModel):
    id: int
    name: str
    qualification: Optional[str]

    class Config:
        from_attributes = True


# ─── Appointment ─────────────────────────────────────────────────────────────

class AppointmentCreate(BaseModel):
    patient_id: int
    service_id: Optional[int] = None
    doctor_id: Optional[int] = None         # defaults to the lead doctor
    scheduled_at: Optional[datetime] = None
    notes: Optional[str] = None
    source: str = "walk_in"
    pain_level: Optional[int] = None
    priority: Optional[str] = None          # derived from pain_level when omitted


class AppointmentUpdate(BaseModel):
    service_id: Optional[int] = None
    doctor_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    pain_level: Optional[int] = None
    priority: Optional[str] = None
    exercises: Optional[List[str]] = None
    follow_up_date: Optional[date] = None


class WalkInCreate(BaseModel):
    """Front-desk registration of a patient who is at the clinic now — checked in immediately."""
    name: str
    phone: str
    age: Optional[int] = None
    gender: Optional[str] = None
    condition: Optional[str] = None
    service_id: Optional[int] = None
    doctor_id: Optional[int] = None
    pain_level: Optional[int] = None
    priority: Optional[str] = None
    source: str = "walk_in"                 # walk_in | whatsapp | referral


class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    service_id: Optional[int]
    doctor_id: Optional[int] = None
    scheduled_at: Optional[datetime]
    status: str
    notes: Optional[str]
    source: str
    token_number: Optional[str] = None
    pain_level: Optional[int] = None
    priority: Optional[str] = None
    exercises: Optional[List[str]] = None
    follow_up_date: Optional[date] = None
    checked_in_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    patient: Optional[PatientOut] = None
    service: Optional[ServiceOut] = None
    doctor: Optional[DoctorBrief] = None

    class Config:
        from_attributes = True


# ─── Enquiry ──────────────────────────────────────────────────────────────────

class EnquiryCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    service_interest: Optional[str] = None
    pain_level: Optional[int] = None        # 1–10
    message: Optional[str] = None           # Symptoms / prior diagnosis
    preferred_date: Optional[str] = None
    preferred_slot: Optional[str] = None    # e.g. "11:00 AM (Morning)"
    doctor_id: Optional[int] = None         # defaults to the lead doctor


class EnquiryUpdate(BaseModel):
    status: Optional[str] = None
    converted_patient_id: Optional[int] = None


class EnquiryOut(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str]
    age: Optional[int]
    gender: Optional[str]
    service_interest: Optional[str]
    pain_level: Optional[int]
    message: Optional[str]
    preferred_date: Optional[str]
    preferred_slot: Optional[str]
    specialist: Optional[str]
    doctor_id: Optional[int] = None
    status: str
    converted_patient_id: Optional[int]
    created_at: datetime
    slot_conflict: Optional[str] = None     # why the preferred slot can't be honoured, if it can't

    class Config:
        from_attributes = True


# ─── Patient portal ──────────────────────────────────────────────────────────
# What a signed-in patient may see: no internal clinical notes or triage fields.

class PortalAppointment(BaseModel):
    id: int
    scheduled_at: Optional[datetime]
    status: str
    token_number: Optional[str] = None
    exercises: Optional[List[str]] = None
    follow_up_date: Optional[date] = None
    service: Optional[ServiceOut] = None
    doctor: Optional[DoctorBrief] = None

    class Config:
        from_attributes = True


class PortalRequest(BaseModel):
    id: int
    service_interest: Optional[str]
    preferred_date: Optional[str]
    preferred_slot: Optional[str]
    specialist: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class PortalOverview(BaseModel):
    appointments: List[PortalAppointment]
    requests: List[PortalRequest]


class EnquiryBook(BaseModel):
    """Book an enquiry into an appointment — at the requested slot or an alternative."""
    date: Optional[str] = None      # defaults to the enquiry's preferred date
    slot: Optional[str] = None      # defaults to the enquiry's preferred slot
    doctor_id: Optional[int] = None # defaults to the doctor the patient chose
    notes: Optional[str] = None


# ─── Schedule ────────────────────────────────────────────────────────────────

class BlockedSlotCreate(BaseModel):
    date: date
    slot: Optional[str] = None      # None blocks the whole day
    reason: Optional[str] = None
    doctor_id: Optional[int] = None # None = whole clinic (holiday); set for one doctor's leave


class BlockedSlotOut(BaseModel):
    id: int
    date: date
    slot: Optional[str]
    reason: Optional[str]
    doctor_id: Optional[int] = None


# ─── Dashboard ───────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_patients: int
    walkin_patients: int
    website_patients: int
    total_appointments: int
    pending_appointments: int
    completed_appointments: int
    new_enquiries: int
    today_appointments: int
    waiting_now: int = 0          # checked in, not yet in therapy
    in_therapy_now: int = 0
