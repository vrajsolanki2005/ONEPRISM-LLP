from math import ceil

from fastapi import (
    Depends,
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    BackgroundTasks,
    Query,
)
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database.models import ImportJob, ImportRecord
from app.database.connection import get_db
from app.schemas.import_job import ImportJobResponse, ImportStatus
from app.schemas.import_record import ImportRecordsResponse
from app.services.import_service import create_import_job, process_import


router = APIRouter(
    prefix="/api/imports",
    tags=["imports"]
)


@router.get("/ping")
def ping():
    return {
        "status": "ok",
        "message": "Import API is running"
    }


MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB


@router.post("/", response_model=ImportJobResponse)
async def create_import(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file uploaded"
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only CSV files are allowed"
        )

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty"
        )

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 15 MB limit"
        )

    await file.seek(0)

    try:
        job = create_import_job(
            file=file,
            db=db
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to create import job"
        )

    background_tasks.add_task(
        process_import,
        job.id
    )

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
    "/{job_id}",
    response_model=ImportJobResponse
)
def get_import_status(
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

    # Search
    search: str | None = Query(
        default=None,
        description="Search name, email, phone, company, or city"
    ),

    # Filters
    is_valid: bool | None = Query(
        default=None,
        description="Filter by validation status"
    ),
    valid: bool | None = Query(
        default=None,
        description="Filter by validation status (alias)"
    ),

    city: str | None = Query(
        default=None,
        description="Filter by city"
    ),

    company: str | None = Query(
        default=None,
        description="Filter by company"
    ),

    # Pagination
    page: int = Query(
        default=1,
        ge=1,
        description="Page number"
    ),

    limit: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Number of records per page"
    ),
    page_size: int | None = Query(
        default=None,
        ge=1,
        le=100,
        description="Number of records per page (alias)"
    ),

    db: Session = Depends(get_db)
):
    # Handle alias parameters if passed
    if is_valid is None and valid is not None:
        is_valid = valid
    if page_size is not None:
        limit = page_size

    # ---------------------------------------------------------
    # Check job
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # Base query
    # ---------------------------------------------------------

    query = (
        db.query(ImportRecord)
        .filter(
            ImportRecord.job_id == job_id
        )
    )

    # ---------------------------------------------------------
    # Search
    # ---------------------------------------------------------

    if search:
        search_value = f"%{search.strip()}%"

        query = query.filter(
            or_(
                ImportRecord.name.ilike(search_value),
                ImportRecord.email.ilike(search_value),
                ImportRecord.phone.ilike(search_value),
                ImportRecord.company.ilike(search_value),
                ImportRecord.city.ilike(search_value),
            )
        )

    # ---------------------------------------------------------
    # Validation filter
    # ---------------------------------------------------------

    if is_valid is not None:
        query = query.filter(
            ImportRecord.is_valid == is_valid
        )

    # ---------------------------------------------------------
    # City filter
    # ---------------------------------------------------------

    if city:
        query = query.filter(
            ImportRecord.city.ilike(city.strip())
        )

    # ---------------------------------------------------------
    # Company filter
    # ---------------------------------------------------------

    if company:
        query = query.filter(
            ImportRecord.company.ilike(company.strip())
        )

    # ---------------------------------------------------------
    # Total count BEFORE pagination
    # ---------------------------------------------------------

    total = query.count()

    # ---------------------------------------------------------
    # Pagination
    # ---------------------------------------------------------

    offset = (page - 1) * limit

    records = (
        query
        .order_by(ImportRecord.row_number.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    # ---------------------------------------------------------
    # Total pages
    # ---------------------------------------------------------

    total_pages = ceil(total / limit) if total else 0

    return ImportRecordsResponse(
        job_id=job_id,
        records=records,
        page=page,
        limit=limit,
        total=total,
        total_pages=total_pages
    )