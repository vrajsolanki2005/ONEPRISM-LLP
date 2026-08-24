import csv
from pathlib import Path

from app.services.validation_service import validate_rows


REQUIRED_COLUMNS = {
    "name",
    "email",
    "phone",
    "company",
    "city",
}


def process_csv(file_path: Path):

    with open(
        file_path,
        "r",
        encoding="utf-8-sig",
        newline=""
    ) as file:

        reader = csv.DictReader(file)

        if not reader.fieldnames:
            raise ValueError("CSV file has no header row")

        columns = {
            column.strip().lower()
            for column in reader.fieldnames
            if column
        }

        missing_columns = REQUIRED_COLUMNS - columns

        if missing_columns:
            raise ValueError(
                f"Missing required columns: "
                f"{', '.join(sorted(missing_columns))}"
            )

        rows = []

        for row in reader:
            normalized_row = {
                key.strip().lower(): (
                    value.strip()
                    if isinstance(value, str)
                    else value
                )
                for key, value in row.items()
                if key
            }

            rows.append(normalized_row)

        results = validate_rows(rows)

        return results