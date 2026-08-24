from fastapi import Depends, APIRouter, UploadFile, File, HTTPException, BackgroundTasks

from app.database.models import ImportJob, ImportRecord
from app.database.connection import get_db
from app.schemas.import_job import ImportJobResponse, ImportStatus
from app.schemas.import_record import ImportRecordsResponse
from app.services.import_service import create_import_job, process_import
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/api/imports",
    tags=["imports"]
)

@router.post("/", response_model=ImportJobResponse)
async def create_import(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only CSV files are allowed")

    # Optional: check file size manually
    contents = await file.read()
    size = len(contents)
    await file.seek(0)  # reset pointer so downstream can read again
    print("Filename:", file.filename)
    print("Content-type:", file.content_type)
    print("File size:", size)

    try:
        job = create_import_job(file=file, db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create import job: {e}")

    background_tasks.add_task(process_import, job.id)

    return ImportJobResponse(
        job_id=job.id,
        filename=job.filename,
        status=ImportStatus(job.status),
        total_records=job.total_records,
        valid_records=job.valid_records,
        invalid_records=job.invalid_records,
        duplicate_records=job.duplicate_records
    )


@router.get("/{job_id}", response_model=ImportJobResponse)
def get_import_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ImportJob).filter(ImportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")

    return ImportJobResponse(
        job_id=job.id,
        filename=job.filename,
        status=ImportStatus(job.status),
        total_records=job.total_records,
        valid_records=job.valid_records,
        invalid_records=job.invalid_records,
        duplicate_records=job.duplicate_records
    )


@router.get(
    "/{job_id}/records",
    response_model=ImportRecordsResponse
)
def get_import_records(
    job_id: str,
    db: Session = Depends(get_db)
):
    job = (
        db.query(ImportJob)
        .filter(ImportJob.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Import job not found"
        )

    records = (
        db.query(ImportRecord)
        .filter(ImportRecord.job_id == job_id)
        .all()
    )

    return ImportRecordsResponse(
        job_id=job_id,
        records=records
    )