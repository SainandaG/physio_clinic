from sqlalchemy import create_engine, URL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Use SQLAlchemy URL.create() to safely handle special characters in password
engine = create_engine(
    URL.create(
        drivername="postgresql+psycopg2",
        username=settings.DB_USER,
        password=settings.DB_PASSWORD,   # SQLAlchemy handles escaping automatically
        host=settings.DB_HOST,
        port=int(settings.DB_PORT),
        database=settings.DB_NAME,
    )
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
