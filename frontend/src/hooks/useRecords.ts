import { useEffect, useMemo, useState } from "react";
import { errorMessage } from "@/api/client";
import {
  getImportRecords,
  type ImportRecord,
  type ValidityFilter,
} from "@/api/imports";
import { useDebouncedValue } from "./useDebouncedValue";

export interface RecordsQuery {
  search: string;
  filter: ValidityFilter;
  page: number;
  pageSize: number;
  refreshKey?: number;
}

export interface UseRecordsReturn {
  records: ImportRecord[];
  total: number;
  totalPages: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

const EMPTY: ImportRecord[] = [];

/**
 * Server-side records fetching with debounced search.
 * Keeps the previous page of rows visible while the next one loads.
 */
export function useRecords(
  jobId: string | null,
  enabled: boolean,
  query: RecordsQuery,
): UseRecordsReturn {
  const [records, setRecords] = useState<ImportRecord[]>(EMPTY);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(query.search, 350);
  const { filter, page, pageSize, refreshKey = 0 } = query;

  useEffect(() => {
    if (!jobId || !enabled) return;

    let alive = true;
    setLoading(true);
    setError(null);

    getImportRecords(jobId, {
      page,
      page_size: pageSize,
      search: debouncedSearch,
      filter,
    })
      .then((result) => {
        if (!alive) return;
        setRecords(result.records);
        setTotal(result.total);
      })
      .catch((err) => {
        if (!alive) return;
        setError(errorMessage(err, "Could not load records."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [jobId, enabled, debouncedSearch, filter, page, pageSize, refreshKey]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );

  const refreshing = loading && records.length > 0;

  return { records, total, totalPages, loading, refreshing, error };
}
