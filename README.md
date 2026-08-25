# OnePrism CSV Import & Validation System

A full-stack, enterprise-grade CSV import, validation, and analytics platform built with **FastAPI**, **SQLAlchemy**, **React 19**, **TypeScript**, and **Tailwind CSS**.

---

## 🌟 Features

- **Asynchronous Background Processing**: Upload large CSV files with instantaneous job creation and non-blocking background parsing.
- **Robust Field Validation**:
  - **Email**: Format validation (`user@domain.ext`), presence check, and file-wide duplicate email detection.
  - **Phone**: Normalizes input digits and enforces 10-digit standard.
  - **Name & Company**: Required non-empty string checks.
  - **City**: Required non-empty string validation.
  - **Detailed Issue Tracking**: Collects and aggregates all validation errors per row without dropping rows silently.
- **Server-Side Records Querying**:
  - **Full-Text Search**: Case-insensitive substring matching across `name`, `email`, `phone`, `company`, and `city`.
  - **Filtering**: Filter by validation status (`is_valid=true` / `is_valid=false`), `city`, or `company`.
  - **Pagination & Sorting**: Efficient offset-based pagination with customizable page size (`limit`) and deterministic row-number ordering.
- **Processed CSV Export**: Real-time streaming generation and download of processed CSV data with validation reasons.
- **Modern Responsive UI**:
  - Drag-and-drop file upload with format and size checking.
  - Live job status polling with animated progress steps.
  - Metric summary cards with percentage breakdowns and count-up animations.
  - Records explorer table with color-coded status badges and detailed error chips.
  - Client-side import history manager.

---

## 🏗️ Tech Stack

### Backend
- **Framework**: FastAPI
- **Database / ORM**: SQLite + SQLAlchemy 2.0
- **Validation & Schemas**: Pydantic v2
- **Server**: Uvicorn

### Frontend
- **Framework**: React 19 + TypeScript
- **Bundler / Tooling**: Vite 7
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **HTTP Client**: Axios

---

## 📁 Project Structure

```
ONEPRISM LLP/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── downloads.py       # CSV streaming download endpoint
│   │   │       └── imports.py         # Upload, status, & paginated records endpoints
│   │   ├── core/
│   │   │   ├── config.py              # Configuration & settings
│   │   │   └── exceptions.py          # Custom exception handlers
│   │   ├── database/
│   │   │   ├── base.py                # SQLAlchemy declarative base
│   │   │   ├── connection.py          # Engine & SessionLocal setup
│   │   │   └── models/
│   │   │       ├── import_job.py      # ImportJob DB model
│   │   │       └── import_record.py   # ImportRecord DB model
│   │   ├── schemas/
│   │   │   ├── import_job.py          # Pydantic models for jobs
│   │   │   └── import_record.py       # Pydantic models for records & pagination
│   │   ├── services/
│   │   │   ├── csv_service.py         # CSV reading & header validation
│   │   │   ├── import_service.py      # Job lifecycle & background processing
│   │   │   ├── record_services.py     # Query helpers
│   │   │   └── validation_service.py  # Field validators & row validations
│   │   ├── utils/
│   │   │   └── csv_utils.py           # Utility helpers
│   │   └── main.py                    # FastAPI application entry point
│   ├── uploads/                       # Storage directory for uploaded CSVs
│   └── oneprism.db                    # SQLite database
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts              # Axios instance & error handling
│   │   │   └── imports.ts             # API methods & payload normalizers
│   │   ├── components/
│   │   │   ├── AppShell.tsx           # Layout, header, & navigation sidebar
│   │   │   ├── FileUploader.tsx       # Drag-and-drop file uploader
│   │   │   ├── ImportStatus.tsx       # Live status indicators
│   │   │   ├── Pagination.tsx         # Page navigation controls
│   │   │   ├── RecordsTable.tsx       # Records table with error chips
│   │   │   ├── SearchFilter.tsx       # Search bar & segmented filters
│   │   │   ├── StatusBadge.tsx        # Status chip component
│   │   │   └── SummaryCards.tsx       # Stat cards with progress bars
│   │   ├── hooks/
│   │   │   ├── useCountUp.ts          # Animated number counter
│   │   │   ├── useDebouncedValue.ts   # Debounce hook for search input
│   │   │   ├── useImport.ts           # Upload & flow state management
│   │   │   ├── useJobStatus.ts        # Polling hook for import status
│   │   │   └── useRecords.ts          # Server-side records query hook
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # Main upload & statistics dashboard
│   │   │   ├── ImportHistory.tsx      # Past imports history viewer
│   │   │   └── ImportResults.tsx      # Detailed results & records explorer
│   │   ├── services/
│   │   │   ├── historyService.ts      # LocalStorage history persistence
│   │   │   └── importService.ts       # Polling & download helpers
│   │   ├── types.ts                   # UI navigation types
│   │   ├── App.tsx                    # Root application component
│   │   └── main.tsx                   # React DOM render entry
│   ├── package.json
│   └── vite.config.ts
│
├── customer.csv                       # Sample valid CSV dataset
├── customer_3.csv                     # Sample CSV dataset with invalid/duplicate rows
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** (Tested on Python 3.14)
- **Node.js 18+** and **npm**

---

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. (Optional) Activate your virtual environment:
   ```powershell
   # Windows PowerShell
   .\venv\Scripts\Activate.ps1
   ```

3. Install backend dependencies (if not already installed):
   ```bash
   pip install fastapi uvicorn sqlalchemy pydantic python-multipart
   ```

4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. The backend API is now running at:
   - **Base URL**: `http://localhost:8000`
   - **Interactive API Docs (Swagger UI)**: `http://localhost:8000/docs`
   - **ReDoc**: `http://localhost:8000/redoc`

---

### 2. Frontend Setup

1. Open another terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

---

## 📡 API Reference

### 1. Upload CSV File
- **`POST /api/imports/`**
- **Content-Type**: `multipart/form-data`
- **Body**: `file` (CSV file)
- **Response**:
  ```json
  {
    "job_id": "8f3b2072-f542-4fbc-b5c7-e3135c3cb16b",
    "filename": "customer.csv",
    "status": "pending",
    "total_records": 0,
    "valid_records": 0,
    "invalid_records": 0,
    "duplicate_records": 0
  }
  ```

### 2. Get Import Job Status
- **`GET /api/imports/{job_id}`**
- **Response**:
  ```json
  {
    "job_id": "8f3b2072-f542-4fbc-b5c7-e3135c3cb16b",
    "filename": "customer.csv",
    "status": "completed",
    "total_records": 10,
    "valid_records": 7,
    "invalid_records": 3,
    "duplicate_records": 2
  }
  ```

### 3. Get Processed Records (Search, Filter, Pagination)
- **`GET /api/imports/{job_id}/records`**
- **Query Parameters**:
  - `search` *(optional, string)*: Search substring across name, email, phone, company, or city.
  - `is_valid` *(optional, boolean)*: Filter by validity (`true` or `false`).
  - `city` *(optional, string)*: Filter by exact/case-insensitive city name.
  - `company` *(optional, string)*: Filter by company name.
  - `page` *(optional, integer, default: 1)*: 1-indexed page number.
  - `limit` *(optional, integer, default: 20, max: 100)*: Records per page.
- **Example**: `GET /api/imports/8f3b2072/records?search=gmail&is_valid=false&page=1&limit=20`
- **Response**:
  ```json
  {
    "job_id": "8f3b2072-f542-4fbc-b5c7-e3135c3cb16b",
    "records": [
      {
        "id": 6,
        "row_number": 7,
        "name": "Invalid Email",
        "email": "invalid-email",
        "phone": "9876543220",
        "company": "TestCorp",
        "city": "Vadodara",
        "is_valid": false,
        "validation_reasons": ["Invalid email"]
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1
  }
  ```

### 4. Download Processed CSV
- **`GET /api/imports/{job_id}/download`**
- **Response**: Streams a CSV file attachment containing all rows with validation status and reasons.

### 5. Health Checks
- **`GET /api/imports/ping`**: Returns `{"status": "ok", "message": "Import API is running"}`.
- **`GET /`**: Returns `{"message": "OnePrism API is running"}`.

---

## 📊 CSV Schema Specification

Expected headers (case-insensitive, order-independent):

| Column | Type | Validation Rules |
|---|---|---|
| `name` | String | Required, non-empty |
| `email` | String | Required, valid email format (`user@domain.tld`), uniqueness checked |
| `phone` | String | Required, 10 valid digits after cleaning formatting characters |
| `company` | String | Required, non-empty |
| `city` | String | Required, non-empty |

### Example CSV Format
```csv
name,email,phone,company,city
Aarav Sharma,aarav.sharma@tcs.com,9876543210,Tata Consultancy Services,Mumbai
Priya Patel,priya.patel@infosys.com,9823456789,Infosys,Bengaluru
Rohan Mehta,rohan.mehta@reliance.com,9712345678,Reliance Industries,Ahmedabad
```

---

## 🧪 Testing & Verification

### Running Automated Integration Tests
From the `backend` folder:
```powershell
$env:PYTHONPATH="."
python -c "import app.main; print('FastAPI loaded successfully!')"
```

### Building the Frontend for Production
From the `frontend` folder:
```bash
npm run build
```
The optimized bundle will be created in `frontend/dist/`.

---

## 📄 License
This project is developed for OnePrism LLP.
