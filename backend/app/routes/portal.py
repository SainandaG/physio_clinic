"""Signed-in patient's own data: appointments, pending booking requests, cancellations."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.auth import require_patient
from app.models.service import Appointment, Enquiry
from app.schemas import PortalOverview
from app.slots import CLINIC_TZ

router = APIRouter(prefix="/api/me", tags=["Patient portal"])

CANCELLABLE = ("pending", "confirmed")


@router.get("/overview", response_model=PortalOverview)
def overview(request: Request, db: Session = Depends(get_db), account=Depends(require_patient)):
    appointments = db.query(Appointment).options(
        joinedload(Appointment.service), joinedload(Appointment.doctor),
    ).filter(Appointment.patient_id == account.patient_id).order_by(Appointment.scheduled_at.desc().nullslast()).all()
    requests = db.query(Enquiry).filter(
        Enquiry.converted_patient_id == account.patient_id, Enquiry.status.in_(("new", "contacted")),
    ).order_by(Enquiry.created_at.desc()).all()
    from app.models.summary import TreatmentSummary
    from app.routes.summaries import document_url
    from app.routes.website import load_content
    from app.seo import api_url
    base, title = api_url(request), load_content(db)["letterhead"]["document_title"]
    summaries = db.query(TreatmentSummary).filter(
        TreatmentSummary.patient_id == account.patient_id, TreatmentSummary.send_status.in_(("sent", "shared")),
    ).order_by(TreatmentSummary.created_at.desc()).all()
    documents = [{"id": s.id, "title": s.title or title, "created_at": s.created_at, "url": document_url(base, s)} for s in summaries]
    return {"appointments": appointments, "requests": requests, "documents": documents}


@router.post("/appointments/{appt_id}/cancel")
def cancel_appointment(appt_id: int, db: Session = Depends(get_db), account=Depends(require_patient)):
    appt = db.query(Appointment).filter(Appointment.id == appt_id, Appointment.patient_id == account.patient_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt.status not in CANCELLABLE or (appt.scheduled_at and appt.scheduled_at <= datetime.now(CLINIC_TZ)):
        raise HTTPException(status_code=400, detail="This appointment can no longer be cancelled online — please message us on WhatsApp.")
    appt.status = "cancelled"
    db.commit()
    return {"message": "Appointment cancelled"}


@router.post("/requests/{enquiry_id}/cancel")
def cancel_request(enquiry_id: int, db: Session = Depends(get_db), account=Depends(require_patient)):
    enquiry = db.query(Enquiry).filter(
        Enquiry.id == enquiry_id, Enquiry.converted_patient_id == account.patient_id, Enquiry.status.in_(("new", "contacted")),
    ).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Request not found")
    enquiry.status = "closed"
    db.commit()
    return {"message": "Request withdrawn"}
