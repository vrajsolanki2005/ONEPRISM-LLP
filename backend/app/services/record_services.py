from math import ceil
from typing import List, Optional, Tuple

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database.models import ImportRecord


def get_import_records(
    db: Session,
    job_id: str,
    page: int,
    page_size: int,
    search: Optional[str],
    valid: Optional[bool]
) -> Tuple[List[ImportRecord], int, int]:
    """Retrieve paginated import records for a job.

    Returns (records, total, total_pages).
    """

    query = (
        db.query(ImportRecord)
        .filter(ImportRecord.job_id == job_id)
    )

    if search:
        search_term = f"%{search}%"

        query = query.filter(
            or_(
                ImportRecord.name.ilike(search_term),
                ImportRecord.email.ilike(search_term),
                ImportRecord.company.ilike(search_term),
                ImportRecord.city.ilike(search_term)
            )
        )

    if valid is not None:
        query = query.filter(
            ImportRecord.is_valid == valid
        )

    total = query.count()

    offset = (page - 1) * page_size

    records = (
        query
        .order_by(ImportRecord.row_number)
        .offset(offset)
        .limit(page_size)
        .all()
    )

    total_pages = ceil(total / page_size) if page_size else 0

    return records, total, total_pages
