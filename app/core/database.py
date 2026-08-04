from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import settings

# Configure SQLite connect args if sqlite is used
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy ORM models."""
    pass


def get_db() -> Generator:
    """
    FastAPI dependency yielding a scoped database session per HTTP request.
    Ensures session closure and rollback upon unhandled errors.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
