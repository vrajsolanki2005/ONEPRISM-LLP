from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# TODO: move to .env → core/config.py before production
DATABASE_URL = "sqlite:///./oneprism.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
