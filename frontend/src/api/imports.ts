import { ApiError, client } from "./client";


export type ImportJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | (string & {});

export interface ImportJob {
  job_id: string;
  filename: string;
  status: ImportJobStatus;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  duplicate_records: number;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ImportRecord {
  row_number: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  city: string;
  is_valid: boolean;
  is_duplicate: boolean;
  validation_reasons: string[];
}

export interface RecordsPage {
  records: ImportRecord[];
  total: number;
  page: number;
  page_size: number;
}

export type ValidityFilter = "all" | "valid" | "invalid";


const STATUS_ALIASES: Record<string, ImportJobStatus> = {
  SUCCESS: "COMPLETED",
  DONE: "COMPLETED",
  COMPLETE: "COMPLETED",
  FINISHED: "COMPLETED",
  ERROR: "FAILED",
  FAILURE: "FAILED",
  RUNNING: "PROCESSING",
  IN_PROGRESS: "PROCESSING",
  VALIDATING: "PROCESSING",
  QUEUED: "PENDING",
  CREATED: "PENDING",
  UPLOADED: "PENDING",
};

export function normalizeStatus(raw: unknown): ImportJobStatus {
  const upper = String(raw ?? "PENDING")
    .trim()
    .toUpperCase();
  return STATUS_ALIASES[upper] ?? upper;
}

export function isTerminalStatus(status: string | undefined | null): boolean {
  return status === "COMPLETED" || status === "FAILED";
}


function pickNumber(...values: unknown[]): number | undefined {
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  }
  return undefined;
}

function pickString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return undefined;
}

function pickBool(...values: unknown[]): boolean | undefined {
  for (const v of values) {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "true" || s === "valid") return true;
      if (s === "false" || s === "invalid") return false;
    }
  }
  return undefined;
}

function asReasonList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string"
          ? item
          : (item as Record<string, unknown>)?.reason ??
            (item as Record<string, unknown>)?.message ??
            JSON.stringify(item),
      )
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[;|]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizeJob(raw: Record<string, any>): ImportJob {
  const summary = raw?.summary ?? raw?.stats ?? {};
  const total = pickNumber(raw?.total_records, raw?.total, summary.total_records, summary.total) ?? 0;
  const valid = pickNumber(raw?.valid_records, raw?.valid, summary.valid_records, summary.valid) ?? 0;
  const invalid =
    pickNumber(raw?.invalid_records, raw?.invalid, summary.invalid_records, summary.invalid) ??
    Math.max(0, total - valid);
  const duplicates =
    pickNumber(raw?.duplicate_records, raw?.duplicates, summary.duplicate_records, summary.duplicates) ?? 0;

  const status = normalizeStatus(raw?.status);
  const errorMessage =
    status === "FAILED"
      ? pickString(raw?.error_message, raw?.error, raw?.message, raw?.detail) ?? null
      : pickString(raw?.error_message, raw?.error) ?? null;

  return {
    job_id: pickString(raw?.job_id, raw?.id, raw?.jobId, raw?.import_id) ?? "",
    filename: pickString(raw?.filename, raw?.file_name, raw?.file, raw?.name) ?? "import.csv",
    status,
    total_records: total,
    valid_records: valid,
    invalid_records: invalid,
    duplicate_records: duplicates,
    error_message: errorMessage,
    created_at: pickString(raw?.created_at, raw?.createdAt, raw?.created) ?? null,
    updated_at: pickString(raw?.updated_at, raw?.updatedAt, raw?.completed_at, raw?.finished_at) ?? null,
  };
}

export function normalizeRecord(raw: Record<string, any>, fallbackIndex: number): ImportRecord {
  const reasons = asReasonList(
    raw?.validation_reasons ?? raw?.reasons ?? raw?.errors ?? raw?.validation_errors,
  );

  const statusField = typeof raw?.status === "string" ? raw.status.trim().toUpperCase() : undefined;
  const isValid =
    pickBool(raw?.is_valid, raw?.valid) ??
    (statusField ? statusField === "VALID" : undefined) ??
    reasons.length === 0;

  const isDuplicate =
    pickBool(raw?.is_duplicate, raw?.duplicate) ??
    reasons.some((r) => /duplicat/i.test(r));

  return {
    row_number:
      pickNumber(raw?.row_number, raw?.rowNumber, raw?.row, raw?.line_number, raw?.line) ??
      fallbackIndex,
    name: typeof raw?.name === "string" ? raw.name : String(raw?.name ?? ""),
    email: typeof raw?.email === "string" ? raw.email : String(raw?.email ?? ""),
    phone: typeof raw?.phone === "string" ? raw.phone : String(raw?.phone ?? ""),
    company: typeof raw?.company === "string" ? raw.company : String(raw?.company ?? ""),
    city: typeof raw?.city === "string" ? raw.city : String(raw?.city ?? ""),
    is_valid: isValid,
    is_duplicate: isDuplicate,
    validation_reasons: reasons,
  };
}

function normalizeRecordsPage(
  raw: unknown,
  requested: { page: number; page_size: number },
): RecordsPage {
  let list: unknown[] | undefined;
  let total: number | undefined;

  const dig = (container: Record<string, any>) => {
    for (const key of ["records", "items", "results", "rows", "data"]) {
      if (Array.isArray(container?.[key])) {
        return container[key] as unknown[];
      }
    }
    return undefined;
  };

  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    const container = raw as Record<string, any>;
    list = dig(container) ?? (container.data && typeof container.data === "object" ? dig(container.data) : undefined);
    total = pickNumber(
      container.total,
      container.total_records,
      container.count,
      container.total_count,
      container.totalCount,
      container.meta?.total,
      container.pagination?.total,
    );
  }

  const records = (list ?? []).map((item, index) =>
    normalizeRecord((item ?? {}) as Record<string, any>, (requested.page - 1) * requested.page_size + index + 1),
  );

  return {
    records,
    total: total ?? records.length,
    page: requested.page,
    page_size: requested.page_size,
  };
}

/* ------------------------------------------------------------------ */
/* Endpoints                                                           */
/* ------------------------------------------------------------------ */

/** POST /api/imports/ — upload a CSV file and receive a job descriptor. */
export async function createImportJob(file: File): Promise<ImportJob> {
  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await client.post("/api/imports/", formData);
  const job = normalizeJob(response.data);

  if (!job.job_id) {
    throw new ApiError("The server accepted the upload but did not return a job id.");
  }
  return job;
}

/** GET /api/imports/{job_id} — current state of an import job. */
export async function getImportJob(jobId: string): Promise<ImportJob> {
  const response = await client.get(`/api/imports/${encodeURIComponent(jobId)}`);
  return normalizeJob(response.data);
}

export interface FetchRecordsParams {
  page: number;
  page_size: number;
  search?: string;
  filter?: ValidityFilter;
}

/** GET /api/imports/{job_id}/records — server-side search, filter & pagination. */
export async function getImportRecords(
  jobId: string,
  params: FetchRecordsParams,
): Promise<RecordsPage> {
  const query: Record<string, string | number | boolean> = {
    page: params.page,
    limit: params.page_size,
    page_size: params.page_size,
  };
  if (params.search && params.search.trim()) query.search = params.search.trim();
  if (params.filter === "valid") {
    query.is_valid = true;
    query.valid = true;
  }
  if (params.filter === "invalid") {
    query.is_valid = false;
    query.valid = false;
  }

  const response = await client.get(
    `/api/imports/${encodeURIComponent(jobId)}/records`,
    { params: query },
  );
  return normalizeRecordsPage(response.data, { page: params.page, page_size: params.page_size });
}

/** Lightweight reachability probe used for the sidebar status indicator. */
export async function pingApi(): Promise<boolean> {
  try {
    const response = await client.get("/api/imports/ping", {
      timeout: 5_000,
    });
    return response.status === 200;
  } catch {
    return false;
  }
}
