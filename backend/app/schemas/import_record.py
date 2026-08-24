from pydantic import BaseModel


class ImportRecordResponse(BaseModel):
    id: int
    row_number: int

    name: str | None
    email: str | None
    phone: str | None
    company: str | None
    city: str | None

    is_valid: bool
    validation_reasons: list[str] | None

    model_config = {
        "from_attributes": True
    }

class ImportRecordsResponse(BaseModel):
    job_id: str
    records: list[ImportRecordResponse]