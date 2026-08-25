import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import ImportJob, ImportRecord


router = APIRouter(
    prefix="/api/imports",
    tags=["downloads"]
)


@router.get("/{job_id}/download")
def download_import_csv(
    job_id: str,
    valid_only: bool = Query(
        default=False,
        description="When true, exports only valid records"
    ),
    is_valid: bool | None = Query(
        default=None,
        description="Filter records by validity before downloading"
    ),
    db: Session = Depends(get_db)
):
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
    # Fetch records
    # ---------------------------------------------------------

    query = (
        db.query(ImportRecord)
        .filter(
            ImportRecord.job_id == job_id
        )
    )

    if valid_only or is_valid is True:
        query = query.filter(ImportRecord.is_valid.is_(True))
    elif is_valid is False:
        query = query.filter(ImportRecord.is_valid.is_(False))

    records = (
        query
        .order_by(
            ImportRecord.row_number.asc()
        )
        .all()
    )

    # ---------------------------------------------------------
    # Generate CSV in memory
    # ---------------------------------------------------------

    output = io.StringIO(
        newline=""
    )

    writer = csv.writer(output)

    if valid_only or is_valid is True:
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
        filename = f"{job.filename.rsplit('.', 1)[0]}_valid.csv"
    else:
        writer.writerow([
            "row_number",
            "name",
            "email",
            "phone",
            "company",
            "city",
            "is_valid",
            "validation_reasons",
        ])

        for record in records:
            writer.writerow([
                record.row_number,
                record.name or "",
                record.email or "",
                record.phone or "",
                record.company or "",
                record.city or "",
                record.is_valid,
                "; ".join(
                    record.validation_reasons or []
                ),
            ])
        filename = f"{job.filename.rsplit('.', 1)[0]}_processed.csv"

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        }
    )
