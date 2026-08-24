from sqlalchemy import ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ImportRecord(Base):
    __tablename__ = "import_records"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    job_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("import_jobs.id"),
        nullable=False
    )

    row_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    phone: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    company: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    city: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    is_valid: Mapped[bool] = mapped_column(
        default=True
    )

    validation_reasons: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True
    )

    job: Mapped["ImportJob"] = relationship(
        back_populates="records"
    )