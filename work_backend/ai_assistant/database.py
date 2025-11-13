# database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# THAY ĐỔI: XÓA dấu chấm
from config import settings  # ← ĐÚNG

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()