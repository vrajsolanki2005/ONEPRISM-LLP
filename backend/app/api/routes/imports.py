from fastapi import (
    Depends,
    Query,
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    BackgroundTasks,
)
import csv
import io

from fastapi.responses import StreamingResponse

from sqlalchemy.orm import Session

from app.database.models import ImportJob, ImportRecord
from app.database.connection import get_db

from app.schemas.import_job import (
    ImportJobResponse,
    ImportStatus,
)

from app.schemas.import_record import (
    ImportRecordResponse,
    ImportRecordsResponse,
)

from app.services.import_service import (
    create_import_job,
    process_import,
)

from app.services.record_services import get_import_records


router = APIRouter(
    prefix="/api/imports",
    tags=["imports"],
)


# IMPORTANT: static route BEFORE /{job_id}
@router.get("/ping")
def ping():
    return {
        "status": "ok",
        "message": "Import API is running",
    }


@router.post("/", response_model=ImportJobResponse)
async def create_import(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file uploaded",
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only CSV files are allowed",
        )

    contents = await file.read()
    size = len(contents)

    await file.seek(0)

    print("Filename:", file.filename)
    print("Content-type:", file.content_type)
    print("File size:", size)

    try:
        job = create_import_job(
            file=file,
            db=db,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create import job: {e}",
        )

    background_tasks.add_task(
        process_import,
        job.id,
    )

    return ImportJobResponse(
        job_id=job.id,
        filename=job.filename,
        status=ImportStatus(job.status),
        total_records=job.total_records,
        valid_records=job.valid_records,
        invalid_records=job.invalid_records,
        duplicate_records=job.duplicate_records,
    )


@router.get(
    "/{job_id}",
    response_model=ImportJobResponse,
)
def get_import_status(
    job_id: str,
    db: Session = Depends(get_db),
):
    job = (
        db.query(ImportJob)
        .filter(ImportJob.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Import job not found",
        )

    return ImportJobResponse(
        job_id=job.id,
        filename=job.filename,
        status=ImportStatus(job.status),
        total_records=job.total_records,
        valid_records=job.valid_records,
        invalid_records=job.invalid_records,
        duplicate_records=job.duplicate_records,
    )


@router.get(
    "/{job_id}/records",
    response_model=ImportRecordsResponse,
)
def get_records(
    job_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    valid: bool | None = None,
    db: Session = Depends(get_db),
):
    job = (
        db.query(ImportJob)
        .filter(ImportJob.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Import job not found",
        )

    records, total, total_pages = get_import_records(
        db=db,
        job_id=job_id,
        page=page,
        page_size=page_size,
        search=search,
        valid=valid,
    )

    return ImportRecordsResponse(
        job_id=job_id,
        records=[
            ImportRecordResponse.model_validate(record)
            for record in records
        ],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )

@router.get("/{job_id}/download")
def download_valid_records(
    job_id: str,
    db: Session = Depends(get_db),
):
    job = (
        db.query(ImportJob)
        .filter(ImportJob.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Import job not found",
        )

    records = (
        db.query(ImportRecord)
        .filter(
            ImportRecord.job_id == job_id,
            ImportRecord.is_valid.is_(True),
        )
        .order_by(ImportRecord.row_number)
        .all()
    )

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "name",
        "email",
        "phone",
        "company",
        "city",
    ])

    for record in records:
        writer.writerow([
            record.name or "",
            record.email or "",
            record.phone or "",
            record.company or "",
            record.city or "",
        ])

    output.seek(0)

    filename = f"valid_records_{job_id}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )