import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending"
    )

    total_records: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    valid_records: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    invalid_records: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    duplicate_records: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    records: Mapped[list["ImportRecord"]] = relationship(
        back_populates="job",
        cascade="all, delete-orphan"
    )