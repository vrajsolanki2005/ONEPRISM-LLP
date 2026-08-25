import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  FileUp,
  Loader2,
  RefreshCw,
  ServerCrash,
} from "lucide-react";
import { ImportStatus } from "@/components/ImportStatus";
import { Pagination } from "@/components/Pagination";
import { RecordsTable } from "@/components/RecordsTable";
import { SearchFilter } from "@/components/SearchFilter";
import { StatusBadge } from "@/components/StatusBadge";
import { SummaryCards } from "@/components/SummaryCards";
import { useJobStatus } from "@/hooks/useJobStatus";
import { useRecords } from "@/hooks/useRecords";
import { downloadValidCsv } from "@/services/importService";
import type { ValidityFilter } from "@/api/imports";
import type { Route } from "@/types";
import { fmtNumber } from "@/utils/format";

interface ImportResultsProps {
  jobId: string;
  onNavigate: (route: Route) => void;
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-label="Loading import">
      <div className="card h-36 p-6">
        <div className="h-4 w-40 rounded-md bg-ink-100 shimmer" />
        <div className="mt-4 h-8 w-2/3 rounded-md bg-ink-100 shimmer" />
        <div className="mt-4 h-3 w-1/3 rounded-md bg-ink-100 shimmer" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card h-[132px] p-5">
            <div className="h-3 w-24 rounded-md bg-ink-100 shimmer" />
            <div className="mt-4 h-7 w-16 rounded-md bg-ink-100 shimmer" />
          </div>
        ))}
      </div>
      <div className="card h-72 p-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="mb-4 h-4 w-full rounded-md bg-ink-100 shimmer" />
        ))}
      </div>
    </div>
  );
}

export function ImportResults({ jobId, onNavigate }: ImportResultsProps) {
  const { job, loading, error, refresh } = useJobStatus(jobId);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ValidityFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [refreshKey, setRefreshKey] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const isCompleted = job?.status === "COMPLETED";

  const records = useRecords(jobId, isCompleted, {
    search,
    filter,
    page,
    pageSize,
    refreshKey,
  });

  // Reset to first page whenever the query definition changes.
  useEffect(() => {
    setPage(1);
  }, [search, filter, pageSize]);

  // Clamp the current page if the result set shrank (e.g. new filter).
  useEffect(() => {
    if (page > records.totalPages && records.totalPages > 0) {
      setPage(records.totalPages);
    }
  }, [records.totalPages, page]);

  const handleDownload = async () => {
    setDownloadError(null);
    setDownloading(true);
    try {
      await downloadValidCsv(jobId, job?.filename);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "The download failed.");
    } finally {
      setDownloading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
  };

  const hasActiveFilters = search.trim() !== "" || filter !== "all";


  if (loading && !job) {
    return <LoadingSkeleton />;
  }

  if (error && !job) {
    return (
      <div className="flex flex-col gap-6 animate-fade-up">
        <button type="button" onClick={() => onNavigate({ name: "dashboard" })} className="btn-ghost w-fit">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to imports
        </button>
        <div className="card flex flex-col items-center gap-4 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-inset ring-rose-100">
            <ServerCrash className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold text-ink-950">Import not found</h1>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-500">
              {error} The job may have been cleaned up, or the server was restarted — in-memory
              jobs do not survive a restart.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={refresh} className="btn-ghost">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
            <button type="button" onClick={() => onNavigate({ name: "dashboard" })} className="btn-primary">
              <FileUp className="h-4 w-4" aria-hidden="true" />
              New import
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const livePhase =
    job.status === "COMPLETED" ? "completed" : job.status === "FAILED" ? "failed" : "processing";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 animate-fade-up">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={() => onNavigate({ name: "dashboard" })}
            className="btn-icon mt-1 ring-ink-900/10 bg-white"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">
              Import results
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2.5">
              <h1 className="truncate font-display text-2xl font-bold text-ink-950" title={job.filename}>
                {job.filename}
              </h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="mt-1 font-mono text-xs text-ink-400">
              job {job.job_id}
              {job.created_at ? ` · started ${job.created_at}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onNavigate({ name: "dashboard" })} className="btn-ghost">
            <FileUp className="h-4 w-4" aria-hidden="true" />
            New import
          </button>
          {isCompleted && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || job.valid_records === 0}
              className="btn-brand"
              title={
                job.valid_records === 0
                  ? "There are no valid rows to export"
                  : `Download ${fmtNumber(job.valid_records)} valid rows as CSV`
              }
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              {downloading ? "Preparing…" : "Download valid CSV"}
            </button>
          )}
        </div>
      </header>

      {downloadError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200 animate-fade-up"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* In-flight */}
      {!isCompleted && job.status !== "FAILED" && (
        <section className="card p-5 sm:p-6 animate-fade-up" aria-label="Import progress">
          <ImportStatus phase={livePhase} job={job} />
          {error && (
            <p className="mt-4 text-xs text-amber-600">
              Live updates paused: {error}
            </p>
          )}
          <p className="mt-4 border-t border-ink-100 pt-4 text-xs text-ink-400">
            Feel free to leave this page — you can return any time from History.
          </p>
        </section>
      )}

      {/* Failed */}
      {job.status === "FAILED" && (
        <section className="card overflow-hidden animate-fade-up" aria-label="Import failed">
          <div className="border-b border-rose-100 bg-rose-50/70 px-5 py-6 sm:px-6">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 ring-1 ring-inset ring-rose-200">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold text-ink-950">Import failed</h2>
                <p className="mt-1 break-words text-sm text-rose-700">
                  {job.error_message ?? "The server reported a failure while processing this file."}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
            <p className="text-xs text-ink-500">
              {job.total_records > 0
                ? `${fmtNumber(job.total_records)} rows were read before the failure.`
                : "No rows were imported."}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={refresh} className="btn-ghost">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Re-check status
              </button>
              <button type="button" onClick={() => onNavigate({ name: "dashboard" })} className="btn-primary">
                <FileUp className="h-4 w-4" aria-hidden="true" />
                Try a new file
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Completed */}
      {isCompleted && (
        <>
          <SummaryCards job={job} />

          <section className="card flex flex-col gap-4 p-4 sm:p-5 animate-fade-up" aria-label="Records explorer">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-[15px] font-bold text-ink-950">Records</h2>
                <p className="mt-0.5 text-xs text-ink-400">
                  Server-side search & pagination · {fmtNumber(records.total)} matching rows
                </p>
              </div>
            </div>

            <SearchFilter
              search={search}
              onSearchChange={setSearch}
              filter={filter}
              onFilterChange={setFilter}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              refreshing={records.refreshing}
              onRefresh={() => setRefreshKey((key) => key + 1)}
            />

            <RecordsTable
              records={records.records}
              loading={records.loading}
              refreshing={records.refreshing}
              error={records.error}
              hasActiveFilters={hasActiveFilters}
              onRetry={() => setRefreshKey((key) => key + 1)}
              onClearFilters={clearFilters}
            />

            <Pagination
              page={page}
              totalPages={records.totalPages}
              total={records.total}
              pageSize={pageSize}
              onPageChange={setPage}
              disabled={records.loading && records.records.length === 0}
            />
          </section>
        </>
      )}
    </div>
  );
}
