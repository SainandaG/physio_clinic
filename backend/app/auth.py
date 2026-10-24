from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


STAFF_ROLES = ("admin", "receptionist")

oauth2_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def _account_from_token(token: Optional[str], db: Session):
    from app.models.user import User
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        return None
    if user_id is None:
        return None
    user = db.query(User).filter(User.id == int(user_id)).first()
    return user if user and user.is_active else None


def get_current_account(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Any signed-in account: staff or patient."""
    user = _account_from_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_optional_account(token: Optional[str] = Depends(oauth2_optional), db: Session = Depends(get_db)):
    """The signed-in account if a valid token was sent, else None (for public endpoints)."""
    return _account_from_token(token, db)


def get_current_user(account=Depends(get_current_account)):
    """Clinic staff only — patient accounts are refused. Guards every admin endpoint."""
    if account.role not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Staff access required")
    return account


def require_patient(account=Depends(get_current_account)):
    if account.role != "patient" or not account.patient_id:
        raise HTTPException(status_code=403, detail="Patient account required")
    return account


def require_admin(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
