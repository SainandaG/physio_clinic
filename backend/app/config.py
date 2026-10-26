from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # Separate DB fields so special chars in password are handled safely
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_NAME: str = "srini_physio"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "password"
    # Hosted Postgres (e.g. Render) provides one connection string; it takes precedence over the DB_* fields
    DATABASE_URL: Optional[str] = None
    # Built frontend served by the API in production (single-service deploy); unset in local dev
    FRONTEND_DIST: Optional[str] = None

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ADMIN_EMAIL: str = "admin@sriniphysio.com"
    ADMIN_PASSWORD: str = "Admin@123"
    ADMIN_NAME: str = "Admin"
    WHATSAPP_NUMBER: str = "917702225124"
    SLOT_CAPACITY: int = 1   # patients per time slot (one consulting specialist)
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    model_config = {
        "env_file": ".env",
        "extra": "ignore",
    }


settings = Settings()
