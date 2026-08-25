# OnePrism CSV Import API (Backend)

FastAPI-powered backend service for CSV ingestion, validation, deduplication, search/filter querying, and export.

## Features
- Background processing for non-blocking CSV parsing.
- Row-level validation (Email format/duplicates, Phone 10-digit format, Name, Company, City).
- Offset pagination with search & filtering endpoints.
- In-memory streaming CSV export of processed records.

## Quickstart

### 1. Requirements
- Python 3.10+
- Dependencies: `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`, `python-multipart`

### 2. Run Server
```bash
uvicorn app.main:app --reload --port 8000
```

### 3. API Documentation
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
