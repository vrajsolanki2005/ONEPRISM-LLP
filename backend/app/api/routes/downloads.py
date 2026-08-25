import csv
import io

from fastapi import APIRouter, Depends, HTTPException
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

    records = (
        db.query(ImportRecord)
        .filter(
            ImportRecord.job_id == job_id
        )
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

    output.seek(0)

    filename = (
        f"{job.filename.rsplit('.', 1)[0]}_processed.csv"
    )

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        }
    )
