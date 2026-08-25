import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "@/api/client";
import { getImportJob, isTerminalStatus, type ImportJob } from "@/api/imports";
import { pollImportJob, type PollHandle } from "@/services/importService";
import { upsertJobInHistory } from "@/services/historyService";

export interface UseJobStatusReturn {
  job: ImportJob | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}


export function useJobStatus(jobId: string | null): UseJobStatusReturn {
  const [job, setJob] = useState<ImportJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const pollRef = useRef<PollHandle | null>(null);

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      setError("No import job selected.");
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const initial = await getImportJob(jobId);
        if (!alive) return;

        setJob(initial);
        upsertJobInHistory(initial);
        setLoading(false);

        if (!isTerminalStatus(initial.status)) {
          const handle = pollImportJob(jobId, {
            onUpdate: (next) => {
              setJob(next);
              upsertJobInHistory(next);
            },
          });
          pollRef.current = handle;
          try {
            await handle.promise;
          } catch (pollError) {
            if (alive) setError(errorMessage(pollError));
          }
        }
      } catch (err) {
        if (!alive) return;
        setLoading(false);
        setError(errorMessage(err, "Could not load this import."));
      }
    })();

    return () => {
      alive = false;
      pollRef.current?.cancel();
      pollRef.current = null;
    };
  }, [jobId, refreshKey]);

  const refresh = useCallback(() => {
    pollRef.current?.cancel();
    setRefreshKey((key) => key + 1);
  }, []);

  return { job, loading, error, refresh };
}
