from app.routes.auth import router as auth_router
from app.routes.patients import router as patients_router
from app.routes.appointments import router as appointments_router
from app.routes.services import router as services_router
from app.routes.enquiries import router as enquiries_router
from app.routes.dashboard import router as dashboard_router
from app.routes.schedule import router as schedule_router
from app.routes.doctors import router as doctors_router
from app.routes.portal import router as portal_router

__all__ = [
    "auth_router",
    "patients_router",
    "appointments_router",
    "services_router",
    "enquiries_router",
    "dashboard_router",
    "schedule_router",
    "doctors_router",
    "portal_router",
]
