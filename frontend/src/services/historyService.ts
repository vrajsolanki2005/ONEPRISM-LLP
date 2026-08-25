import type { ImportJob } from "@/api/imports";


export interface ImportHistoryEntry {
  jobId: string;
  filename: string;
  status: string;
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "oneprism.import-history.v1";
const MAX_ENTRIES = 60;
const CHANGE_EVENT = "oneprism:history-changed";

function readAll(): ImportHistoryEntry[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is ImportHistoryEntry =>
        entry && typeof entry === "object" && typeof entry.jobId === "string",
    );
  } catch {
    return [];
  }
}

function writeAll(entries: ImportHistoryEntry[]): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    /* storage unavailable (private mode / quota) — history simply won't persist */
  }
}

export function listImportHistory(): ImportHistoryEntry[] {
  return readAll().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function upsertImportHistory(
  entry: Omit<ImportHistoryEntry, "updatedAt"> & { updatedAt?: string },
): void {
  const entries = readAll();
  const now = new Date().toISOString();
  const index = entries.findIndex((item) => item.jobId === entry.jobId);
  const next: ImportHistoryEntry = {
    ...entry,
    createdAt: entry.createdAt || now,
    updatedAt: entry.updatedAt || now,
  };
  if (index >= 0) {
    entries[index] = { ...entries[index], ...next, createdAt: entries[index].createdAt };
  } else {
    entries.unshift(next);
  }
  writeAll(entries);
}

export function upsertJobInHistory(job: ImportJob): void {
  upsertImportHistory({
    jobId: job.job_id,
    filename: job.filename,
    status: job.status,
    total: job.total_records,
    valid: job.valid_records,
    invalid: job.invalid_records,
    duplicates: job.duplicate_records,
    createdAt: job.created_at ?? new Date().toISOString(),
    updatedAt: job.updated_at ?? new Date().toISOString(),
  });
}

export function removeImportHistory(jobId: string): void {
  writeAll(readAll().filter((entry) => entry.jobId !== jobId));
}

export function clearImportHistory(): void {
  writeAll([]);
}

export function onHistoryChanged(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
