from datetime import datetime
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.database.models import ImportJob, ImportRecord
from app.services.csv_service import process_csv


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)


def create_import_job(file: UploadFile, db: Session) -> ImportJob:
    file_contents = file.file.read() if hasattr(file, "file") else file.read()

    job = ImportJob(
        filename=file.filename or "unknown.csv",
        status="pending",
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    file_path = UPLOAD_DIR / f"{job.id}.csv"
    file_path.write_bytes(file_contents)

    return job


def process_import(job_id: str):

    db = SessionLocal()

    try:
        job = (
            db.query(ImportJob)
            .filter(ImportJob.id == job_id)
            .first()
        )

        if not job:
            return

        job.status = "processing"
        db.commit()

        file_path = UPLOAD_DIR / f"{job_id}.csv"

        results = process_csv(file_path)

        for result in results:

            row = result["data"]

            record = ImportRecord(
                job_id=job.id,
                row_number=result["row_number"],
                name=row.get("name"),
                email=row.get("email"),
                phone=row.get("phone"),
                company=row.get("company"),
                city=row.get("city"),
                is_valid=result["is_valid"],
                validation_reasons=result["validation_reasons"]
            )

            db.add(record)

        total = len(results)

        valid = sum(
            1
            for result in results
            if result["is_valid"]
        )

        invalid = total - valid

        duplicates = sum(
            1
            for result in results
            if "Duplicate email"
            in result["validation_reasons"]
        )

        job.total_records = total
        job.valid_records = valid
        job.invalid_records = invalid
        job.duplicate_records = duplicates

        job.status = "completed"
        job.completed_at = datetime.utcnow()

        db.commit()

    except Exception:

        db.rollback()

        job = (
            db.query(ImportJob)
            .filter(ImportJob.id == job_id)
            .first()
        )

        if job:
            job.status = "failed"
            db.commit()

    finally:
        db.close()