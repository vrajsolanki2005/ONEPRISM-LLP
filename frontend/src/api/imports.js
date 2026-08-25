// src/api/imports.js
import {client, ApiError} from "./client.js";

export async function pingApi() {
  try {
    const response = await client.get("/api/imports/ping", {
      timeout: 5000,
    });

    return response.status === 200;
  } catch (err) {
    console.error("Ping failed:", err);
    return false;
  }
}


export async function getImportJob(jobId) {
  try {
    const response = await client.get(`/api/imports/${jobId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch import job:", error);
    throw error;
  }
}

export async function createImportJob(file) {
  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await client.post("/api/imports/", formData);
  const job = response.data;

  if (!job?.job_id) {
    throw new ApiError("The server accepted the upload but did not return a job id.");
  }
  return job;
}

export async function getImportRecords(jobId, params) {
  const query = {
    page: params.page,
    page_size: params.page_size,
  };
  if (params.search && params.search.trim()) query.search = params.search.trim();
  if (params.filter === "valid") query.valid = true;
  if (params.filter === "invalid") query.valid = false;

  const response = await client.get(
    `/api/imports/${encodeURIComponent(jobId)}/records`,
    { params: query }
  );
  return response.data;
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await client.post("/api/imports/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

const TERMINAL_STATUSES = ["COMPLETED", "FAILED"];

export function isTerminalStatus(status) {
  return TERMINAL_STATUSES.includes(status);
}

export function normalizeJob(raw) {
  return {
    job_id: raw?.job_id ?? raw?.id ?? "",
    filename: raw?.filename ?? raw?.file_name ?? "import.csv",
    status: raw?.status ?? "PENDING",
    total_records: raw?.total_records ?? 0,
    valid_records: raw?.valid_records ?? 0,
    invalid_records: raw?.invalid_records ?? 0,
    duplicate_records: raw?.duplicate_records ?? 0,
    error_message: raw?.error_message ?? null,
    created_at: raw?.created_at ?? null,
    updated_at: raw?.updated_at ?? null,
  };
}