from sqlalchemy import create_engine, URL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

def _database_url():
    if settings.DATABASE_URL:
        # Render and others hand out postgres:// or postgresql:// — pin the psycopg2 driver
        url = settings.DATABASE_URL
        for prefix in ("postgres://", "postgresql://"):
            if url.startswith(prefix):
                return "postgresql+psycopg2://" + url[len(prefix):]
        return url
    # URL.create() safely handles special characters in the password
    return URL.create(
        drivername="postgresql+psycopg2",
        username=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=int(settings.DB_PORT),
        database=settings.DB_NAME,
    )


# pre_ping: hosted databases drop idle connections; recycle before their idle timeout
engine = create_engine(_database_url(), pool_pre_ping=True, pool_recycle=300)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
