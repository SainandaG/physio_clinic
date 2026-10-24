from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import (
    verify_password, create_access_token, hash_password,
    get_current_account, require_admin, STAFF_ROLES,
)
from app.models.user import User
from app.models.patient import Patient
from app.schemas import UserCreate, UserOut, TokenResponse, SignupCreate, ProfileUpdate

router = APIRouter(prefix="/api/auth", tags=["Auth"])


def _find_by_email(db: Session, email: str):
    return db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()


def _token_response(user: User):
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """One login for everyone — the returned role decides where the app goes (admin panel or patient account)."""
    user = _find_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")
    return _token_response(user)


@router.post("/signup", response_model=TokenResponse, status_code=201)
def signup(data: SignupCreate, db: Session = Depends(get_db)):
    """Public patient sign-up. Always creates a fresh patient record — accounts are never matched to
    existing records by phone, so nobody can see another person's history by typing their number."""
    if _find_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please sign in.")
    patient = Patient(name=data.name.strip(), phone=data.phone.strip(), email=data.email.strip().lower(), source="website")
    db.add(patient)
    db.flush()
    user = User(
        name=data.name.strip(), email=data.email.strip().lower(), phone=data.phone.strip(),
        password_hash=hash_password(data.password), role="patient", patient_id=patient.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_response(user)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_account)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(data: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_account)):
    if data.new_password:
        if not data.current_password or not verify_password(data.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        current_user.password_hash = hash_password(data.new_password)
    if data.name:
        current_user.name = data.name.strip()
    if data.phone:
        current_user.phone = data.phone.strip()
    if current_user.patient:  # keep the clinic's patient record in step
        if data.name:
            current_user.patient.name = current_user.name
        if data.phone:
            current_user.patient.phone = current_user.phone
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/users", response_model=UserOut)
def create_user(data: UserCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if data.role not in STAFF_ROLES:
        raise HTTPException(status_code=400, detail="Role must be admin or receptionist")
    if _find_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=data.name,
        email=data.email.strip().lower(),
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Staff accounts only — patient accounts are managed through Patients."""
    return db.query(User).filter(User.role.in_(STAFF_ROLES)).order_by(User.id).all()


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = db.query(User).filter(User.id == user_id, User.role.in_(STAFF_ROLES)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
