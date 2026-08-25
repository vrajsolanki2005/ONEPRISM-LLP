from pydantic import BaseModel


class ImportRecordResponse(BaseModel):
    id: int
    row_number: int

    name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    city: str | None = None

    is_valid: bool
    validation_reasons: list[str] | None = None

    model_config = {
        "from_attributes": True
    }


class ImportRecordsResponse(BaseModel):
    job_id: str
    records: list[ImportRecordResponse]

    page: int
    limit: int
    total: int
    total_pages: int