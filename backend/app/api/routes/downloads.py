import csv
import io

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api/imports", tags=["downloads"])

JOB_RECORDS = {
    "job-123": [
        {
            "id": 1,
            "row_number": 1,
            "name": "Rahul",
            "email": "rahul@example.com",
            "phone": "9999999999",
            "company": "Acme",
            "city": "Delhi",
            "is_valid": True,
            "validation_reasons": [],
        },
        {
            "id": 2,
            "row_number": 2,
            "name": "Vraj",
            "email": "vrajgmail.com",
            "phone": "8888888888",
            "company": "OnePrism",
            "city": "Mumbai",
            "is_valid": False,
            "validation_reasons": ["email_invalid"],
        },
    ]
}


def _build_csv(records):
    fieldnames = [
        "id",
        "row_number",
        "name",
        "email",
        "phone",
        "company",
        "city",
        "is_valid",
        "validation_reasons",
    ]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for record in records:
        writer.writerow(
            {
                "id": record.get("id", ""),
                "row_number": record.get("row_number", ""),
                "name": record.get("name", ""),
                "email": record.get("email", ""),
                "phone": record.get("phone", ""),
                "company": record.get("company", ""),
                "city": record.get("city", ""),
                "is_valid": record.get("is_valid", False),
                "validation_reasons": "; ".join(record.get("validation_reasons") or []),
            }
        )

    return output.getvalue().encode("utf-8")


@router.get("/{job_id}/download")
def download_import_csv(job_id: str):
    records = JOB_RECORDS.get(job_id)
    if not records:
        raise HTTPException(status_code=404, detail="Import job not found")

    csv_bytes = _build_csv(records)
    filename = f"import_{job_id}.csv"

    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
