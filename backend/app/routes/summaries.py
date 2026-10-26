"""Treatment summaries: the doctor's notes on the letterhead, sent to the patient on WhatsApp."""
import secrets
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import SessionLocal, get_db
from app.documents import render_summary_pdf, summary_filename
from app.models.service import Appointment
from app.models.summary import TreatmentSummary
from app.routes.website import load_content
from app.schemas import SummaryIn, SummaryOut
from app.seo import site_url
from app.slots import CLINIC_TZ
from app import whatsapp

router = APIRouter(prefix="/api/summaries", tags=["Treatment summaries"])
public_router = APIRouter(tags=["Treatment summaries"])


def document_url(base: str, s: TreatmentSummary) -> str:
    return f"{base}/api/documents/{s.token}.pdf"


def _out(s: TreatmentSummary, base: str) -> SummaryOut:
    out = SummaryOut.model_validate(s)
    out.url = document_url(base, s)
    return out


def _load(db: Session, summary_id: int) -> TreatmentSummary:
    s = db.query(TreatmentSummary).options(
        joinedload(TreatmentSummary.patient), joinedload(TreatmentSummary.doctor),
        joinedload(TreatmentSummary.appointment).joinedload(Appointment.service),
    ).filter(TreatmentSummary.id == summary_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Summary not found")
    return s


def summary_for_appointment(db: Session, appt: Appointment, user_id: Optional[int] = None, auto: bool = False) -> TreatmentSummary:
    """The appointment's summary, created (pre-filled from the chart) if it doesn't exist yet."""
    s = db.query(TreatmentSummary).filter(TreatmentSummary.appointment_id == appt.id).first()
    if s:
        return s
    s = TreatmentSummary(
        token=secrets.token_urlsafe(24), patient_id=appt.patient_id, appointment_id=appt.id, doctor_id=appt.doctor_id,
        exercises=list(appt.exercises or []), follow_up_date=appt.follow_up_date,
        auto_created=auto, created_by=user_id,
    )
    db.add(s)
    db.flush()
    return s


def whatsapp_text(s: TreatmentSummary, content: dict, base: str) -> str:
    doctor = s.doctor.name if s.doctor else content["letterhead"]["doctor_name"]
    return (content["letterhead"]["whatsapp_message"]
            .replace("{patient}", s.patient.name).replace("{doctor}", doctor).replace("{link}", document_url(base, s)))


def deliver(db: Session, s: TreatmentSummary, base: str) -> Optional[str]:
    """Send through the Cloud API; record the outcome. Returns the error, if any."""
    ok, error = whatsapp.send_document(s.patient.phone, document_url(base, s), summary_filename(s), s.patient.name)
    s.send_channel = "api"
    s.send_status = "sent" if ok else "failed"
    s.send_error = error
    if ok:
        s.sent_at = datetime.now(CLINIC_TZ)
    db.commit()
    return error


def auto_send_in_background(summary_id: int, base: str):
    """Runs after the response: a new session, since the request's one is closed by then."""
    db = SessionLocal()
    try:
        s = _load(db, summary_id)
        if s.send_status != "sent":
            deliver(db, s, base)
    finally:
        db.close()


def after_completion(db: Session, appt: Appointment, user_id: int, request: Request, background: BackgroundTasks):
    """Called when an appointment is marked completed: prepare the summary and, if the clinic
    has WhatsApp automation on and the Business API set up, send it."""
    s = summary_for_appointment(db, appt, user_id, auto=True)
    db.commit()
    if load_content(db)["letterhead"]["auto_send"] == "yes" and whatsapp.api_configured():
        background.add_task(auto_send_in_background, s.id, site_url(request))


# ── Staff ────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[SummaryOut])
def list_summaries(request: Request, appointment_id: Optional[int] = None, patient_id: Optional[int] = None,
                   db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(TreatmentSummary)
    if appointment_id:
        q = q.filter(TreatmentSummary.appointment_id == appointment_id)
    if patient_id:
        q = q.filter(TreatmentSummary.patient_id == patient_id)
    base = site_url(request)
    return [_out(s, base) for s in q.order_by(TreatmentSummary.created_at.desc()).limit(200).all()]


@router.get("/status")
def sending_status(_=Depends(get_current_user)):
    """Whether summaries can go out automatically (WhatsApp Business API configured)."""
    return {"api_configured": whatsapp.api_configured()}


@router.post("/for-appointment/{appt_id}", response_model=SummaryOut)
def open_for_appointment(appt_id: int, request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    s = summary_for_appointment(db, appt, current_user.id)
    db.commit()
    return _out(_load(db, s.id), site_url(request))


@router.put("/{summary_id}", response_model=SummaryOut)
def update_summary(summary_id: int, data: SummaryIn, request: Request, db: Session = Depends(get_db), _=Depends(get_current_user)):
    s = _load(db, summary_id)
    values = data.model_dump(exclude_unset=True)
    if "exercises" in values:
        values["exercises"] = [e.strip() for e in values["exercises"] or [] if e and e.strip()]
    for field, value in values.items():
        setattr(s, field, value.strip() if isinstance(value, str) else value)
    db.commit()
    return _out(_load(db, summary_id), site_url(request))


@router.post("/{summary_id}/send")
def send_summary(summary_id: int, request: Request, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Automatic send through the Business API when configured; otherwise a WhatsApp link to open."""
    s = _load(db, summary_id)
    base = site_url(request)
    if whatsapp.api_configured():
        error = deliver(db, s, base)
        if error:
            raise HTTPException(status_code=502, detail=f"WhatsApp didn't accept the message: {error}")
        return {"channel": "api", "summary": _out(_load(db, summary_id), base)}
    link = whatsapp.wa_link(s.patient.phone, whatsapp_text(s, load_content(db), base))
    if not link:
        raise HTTPException(status_code=422, detail="This patient has no valid mobile number")
    s.send_channel, s.send_status, s.send_error, s.sent_at = "link", "shared", None, datetime.now(CLINIC_TZ)
    db.commit()
    return {"channel": "link", "wa_url": link, "summary": _out(_load(db, summary_id), base)}


@router.delete("/{summary_id}")
def delete_summary(summary_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Deleting also switches off the patient's link."""
    s = _load(db, summary_id)
    db.delete(s)
    db.commit()
    return {"message": "Summary deleted"}


# ── The patient's link ───────────────────────────────────────────────────────

@public_router.get("/api/documents/{token}.pdf", include_in_schema=False)
def summary_pdf(token: str, download: bool = False, db: Session = Depends(get_db)):
    s = db.query(TreatmentSummary).filter(TreatmentSummary.token == token).first()
    if not s or len(token) < 20:
        raise HTTPException(status_code=404, detail="Document not found")
    s = _load(db, s.id)
    pdf = render_summary_pdf(s, load_content(db))
    disposition = "attachment" if download else "inline"
    return Response(pdf, media_type="application/pdf", headers={
        "Content-Disposition": f'{disposition}; filename="{summary_filename(s)}"',
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
    })
