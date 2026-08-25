import { API_BASE_URL, ApiError, client } from "@/api/client";
import {
  getImportJob,
  isTerminalStatus,
  normalizeJob,
  type ImportJob,
} from "@/api/imports";



export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export interface FileValidationResult {
  ok: boolean;
  message?: string;
}

export function validateCsvFile(file: File): FileValidationResult {
  const name = file.name.toLowerCase();
  const hasCsvExtension = name.endsWith(".csv");
  const isCsvMime =
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel" ||
    file.type === "application/csv" ||
    file.type === "";

  if (!hasCsvExtension && !isCsvMime) {
    return { ok: false, message: `"${file.name}" is not a CSV file. Please choose a .csv export.` };
  }
  if (file.size === 0) {
    return { ok: false, message: `"${file.name}" is empty — there is nothing to import.` };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      message: `"${file.name}" exceeds the 15 MB limit. Split the file and try again.`,
    };
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Status polling                                                      */
/* ------------------------------------------------------------------ */

export interface PollOptions {
  intervalMs?: number;
  timeoutMs?: number;
  onUpdate?: (job: ImportJob) => void;
}

export interface PollHandle {
  promise: Promise<ImportJob>;
  cancel: () => void;
}

/**
 * Poll GET /api/imports/{jobId} every `intervalMs` until the job reaches
 * a terminal state (COMPLETED / FAILED). Transient network errors are
 * tolerated; consecutive hard failures or unknown jobs (404) abort polling.
 */
export function pollImportJob(jobId: string, options: PollOptions = {}): PollHandle {
  const { intervalMs = 1_500, timeoutMs = 10 * 60_000, onUpdate } = options;

  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const promise = new Promise<ImportJob>((resolve, reject) => {
    const startedAt = Date.now();
    let consecutiveErrors = 0;

    const tick = async () => {
      if (cancelled) return;

      if (Date.now() - startedAt > timeoutMs) {
        reject(new ApiError("Timed out while waiting for the import to finish. Check History later."));
        return;
      }

      try {
        const job = await getImportJob(jobId);
        if (cancelled) return;
        consecutiveErrors = 0;
        onUpdate?.(job);

        if (isTerminalStatus(job.status)) {
          resolve(job);
          return;
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          reject(new ApiError("This import job no longer exists on the server.", 404));
          return;
        }
        consecutiveErrors += 1;
        if (consecutiveErrors >= 5) {
          reject(
            err instanceof ApiError
              ? err
              : new ApiError("Lost connection to the server while monitoring the import."),
          );
          return;
        }
      }

      timer = setTimeout(tick, intervalMs);
    };

    timer = setTimeout(tick, 400);
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Download of the valid-rows CSV                                      */
/* ------------------------------------------------------------------ */

function filenameFromDisposition(header: unknown): string | null {
  if (typeof header !== "string") return null;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/"/g, ""));
    } catch {
      /* fall through */
    }
  }
  const asciiMatch = header.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1] ? asciiMatch[1].trim() : null;
}

/** GET /api/imports/{jobId}/download → save the valid-records CSV locally. */
export async function downloadValidCsv(jobId: string, sourceFilename?: string): Promise<void> {
  const response = await client.get(`/api/imports/${encodeURIComponent(jobId)}/download`, {
    responseType: "blob",
    timeout: 60_000,
  });

  const suggested =
    filenameFromDisposition(response.headers?.["content-disposition"]) ??
    (sourceFilename
      ? sourceFilename.replace(/\.csv$/i, "") + "_valid.csv"
      : `oneprism_valid_records_${jobId.slice(0, 8)}.csv`);

  const blob =
    response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: "text/csv" });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = suggested;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

/** Direct URL to the download endpoint (used as a last-resort fallback). */
export function downloadUrl(jobId: string): string {
  return `${API_BASE_URL}/api/imports/${encodeURIComponent(jobId)}/download`;
}

/* Re-export for convenience so services can hand a job to historyService. */
export { normalizeJob };
