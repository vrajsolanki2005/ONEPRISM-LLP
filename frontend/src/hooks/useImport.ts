import { useEffect, useState } from "react";

import {
  createImportJob,
  getImportJob,
  getImportRecords,
  pingApi,
} from "@/api/imports.js";

type ImportPhase =
  | "idle"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "error";

interface ImportJob {
  job_id: string;
  filename?: string;
  status: string;
  total_records?: number;
  valid_records?: number;
  invalid_records?: number;
  duplicate_records?: number;
  error_message?: string | null;
}

interface ImportRecord {
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

export function useImport() {
  const [job, setJob] = useState<ImportJob | null>(null);
  const [records, setRecords] = useState<ImportRecord[]>([]);
  const [phase, setPhase] = useState<ImportPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  /*
   * Upload CSV and create import job
   */
  async function start(file: File) {
    setPhase("uploading");
    setError(null);
    setJob(null);
    setRecords([]);

    try {
      const newJob = await createImportJob(file);

      setJob(newJob);
      setPhase("processing");

      return newJob;
    } catch (err) {
      console.error("Import upload failed:", err);

      setPhase("error");

      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload CSV file."
      );

      throw err;
    }
  }

  /*
   * Refresh job status
   */
  async function refreshJob(jobId: string) {
    try {
      const updated = await getImportJob(jobId);

      setJob(updated);

      const status = updated.status?.toUpperCase();

      if (status === "COMPLETED") {
        setPhase("completed");
      } else if (status === "FAILED") {
        setPhase("failed");

        setError(
          updated.error_message ||
            "Import processing failed."
        );
      } else {
        setPhase("processing");
      }

      return updated;
    } catch (err) {
      console.error(
        "Failed to refresh import job:",
        err
      );

      setPhase("error");

      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch import status."
      );

      throw err;
    }
  }

  /*
   * Poll job status while processing
   */
  useEffect(() => {
    if (!job?.job_id || phase !== "processing") {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const updated = await getImportJob(
          job.job_id
        );

        if (cancelled) return;

        setJob(updated);

        const status =
          updated.status?.toUpperCase();

        if (status === "COMPLETED") {
          setPhase("completed");
          return;
        }

        if (status === "FAILED") {
          setPhase("failed");

          setError(
            updated.error_message ||
              "Import processing failed."
          );

          return;
        }

        setPhase("processing");
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Polling failed:",
          err
        );

        setPhase("error");

        setError(
          err instanceof Error
            ? err.message
            : "Unable to check import status."
        );
      }
    };

    poll();

    const interval = window.setInterval(
      poll,
      1500
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [job?.job_id, phase]);

  /*
   * Fetch paginated records
   */
  async function fetchRecords(
    jobId: string,
    params: {
      page: number;
      page_size: number;
      search?: string;
      filter?: "all" | "valid" | "invalid";
    }
  ) {
    try {
      const page = await getImportRecords(
        jobId,
        params
      );

      setRecords(page.records || []);

      return page;
    } catch (err) {
      console.error(
        "Failed to fetch records:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch records."
      );

      throw err;
    }
  }

  /*
   * Backend health check
   */
  async function checkServer() {
    return await pingApi();
  }

  /*
   * Reset import state
   */
  function reset() {
    setJob(null);
    setRecords([]);
    setPhase("idle");
    setError(null);
  }

  return {
    job,
    records,
    phase,
    error,

    // IMPORTANT:
    // Dashboard -> FileUploader -> start(file)
    start,

    reset,
    refreshJob,
    fetchRecords,
    checkServer,
  };
}