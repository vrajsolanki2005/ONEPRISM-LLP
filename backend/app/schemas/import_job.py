from pydantic import BaseModel
from enum import Enum

class ImportStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ImportJobResponse(BaseModel):
    job_id: str
    filename: str
    status: ImportStatus
    total_records: int
    valid_records: int
    invalid_records: int
    duplicate_records: int
