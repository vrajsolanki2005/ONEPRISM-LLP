import { useEffect, useState } from "react";

import {
  createImportJob,
  getImportJob,
  getImportRecords,
  pingApi,
} from "@/api/imports.js";

export function useImport() {
  const [job, setJob] = useState(null);
  const [records, setRecords] = useState([]);
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState(null);

  // Upload CSV and create import job
  async function start(file) {
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

  // Refresh job status manually
  async function refreshJob(jobId) {
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

  // Automatically poll while processing
  useEffect(() => {
    if (!job?.job_id || phase !== "processing") {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const updated = await getImportJob(job.job_id);

        if (cancelled) return;

        setJob(updated);

        const status = updated.status?.toUpperCase();

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

        console.error("Polling failed:", err);

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

  // Fetch records
  async function fetchRecords(jobId, params) {
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

  // Backend health check
  async function checkServer() {
    return await pingApi();
  }

  // Reset state
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
    start,
    reset,
    refreshJob,
    fetchRecords,
    checkServer,
  };
}