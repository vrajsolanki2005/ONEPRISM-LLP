import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CopyCheck,
  FileSpreadsheet,
  ShieldCheck,
} from "lucide-react";
import { FileUploader } from "@/components/FileUploader";
import { ImportStatus } from "@/components/ImportStatus";
import { StatusBadge } from "@/components/StatusBadge";
import { useImport } from "@/hooks/useImport";
import {
  listImportHistory,
  onHistoryChanged,
  type ImportHistoryEntry,
} from "@/services/historyService";
import { fmtNumber, percent, timeAgo } from "@/utils/format";
import type { Route } from "@/types";

const PIPELINE_STEPS = [
  {
    Icon: FileSpreadsheet,
    title: "Parse & stream",
    desc: "Rows are read as a stream, so even large files stay fast.",
  },
  {
    Icon: ShieldCheck,
    title: "Field validation",
    desc: "Email format, phone pattern and required fields checked per row.",
  },
  {
    Icon: CopyCheck,
    title: "Duplicate scan",
    desc: "Repeated contacts are flagged and counted separately.",
  },
  {
    Icon: BadgeCheck,
    title: "Clean export",
    desc: "Download a CSV containing only the valid, import-ready rows.",
  },
];

const EXPECTED_COLUMNS = ["name", "email", "phone", "company", "city"];

function useHistory(): ImportHistoryEntry[] {
  const [entries, setEntries] = useState<ImportHistoryEntry[]>(() =>
    listImportHistory(),
  );
  useEffect(() => onHistoryChanged(() => setEntries(listImportHistory())), []);
  return entries;
}

function WorkspaceStats({ entries }: { entries: ImportHistoryEntry[] }) {
  const stats = useMemo(() => {
    const finished = entries.filter(
      (entry) => entry.status === "COMPLETED" || entry.status === "FAILED",
    );
    const rows = finished.reduce((sum, entry) => sum + entry.total, 0);
    const valid = finished.reduce((sum, entry) => sum + entry.valid, 0);
    return {
      imports: finished.length,
      rows,
      validRate: rows > 0 ? percent(valid, rows) : "—",
    };
  }, [entries]);

  const items = [
    { label: "Imports run", value: fmtNumber(stats.imports) },
    { label: "Rows processed", value: fmtNumber(stats.rows) },
    { label: "Avg. valid rate", value: stats.validRate },
  ];

  return (
    <div className="grid grid-cols-3 divide-x divide-ink-100">
      {items.map((item) => (
        <div key={item.label} className="px-4 py-3.5 first:pl-0">
          <p className="font-mono text-lg font-semibold tabular-nums text-ink-950">
            {item.value}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-ink-400">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}

export function Dashboard({
  onNavigate,
}: {
  onNavigate: (route: Route) => void;
}) {
  const { phase, job, error, start, reset } = useImport();
  const entries = useHistory();
  const recent = entries.slice(0, 5);
  const autoNavigatedRef = useRef(false);

  useEffect(() => {
    if (phase === "idle") autoNavigatedRef.current = false;
    if (phase !== "completed" || !job || autoNavigatedRef.current) return;

    autoNavigatedRef.current = true;
    const timer = setTimeout(
      () => onNavigate({ name: "results", jobId: job.job_id }),
      1_600,
    );
    return () => clearTimeout(timer);
  }, [phase, job, onNavigate]);
  const importing =
    phase === "uploading" ||
    phase === "processing" ||
    phase === "completed" ||
    phase === "failed";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">
            Data intake
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink-950 sm:text-3xl">
            Import CSV data
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-ink-500">
            Upload a contacts file — OnePrism parses, validates and deduplicates
            every row, then hands you a clean export.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate({ name: "history" })}
          className="btn-ghost"
        >
          View history
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Upload / live status */}
        <section
          className="card p-5 sm:p-6 lg:col-span-7 animate-fade-up"
          style={{ animationDelay: "60ms" }}
        >
          {phase === "error" && (
            <div
              role="alert"
              className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200 animate-fade-up"
            >
              <span className="flex items-start gap-2.5">
                <AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <span className="break-words">{error}</span>
              </span>
              <button
                type="button"
                onClick={reset}
                className="shrink-0 text-xs font-semibold underline underline-offset-2 hover:text-rose-800"
              >
                Dismiss
              </button>
            </div>
          )}

          {importing ? (
            <div className="flex flex-col gap-6">
              <ImportStatus
                phase={
                  phase as "uploading" | "processing" | "completed" | "failed"
                }
                job={job}
                error={phase === "failed" ? error : null}
              />

              {phase === "completed" && job && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4 animate-fade-up">
                  <p className="text-sm text-ink-500">
                    <span className="font-semibold text-emerald-600">
                      Import complete.
                    </span>{" "}
                    Opening results…
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={reset} className="btn-ghost">
                      Import another file
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate({ name: "results", jobId: job.job_id })
                      }
                      className="btn-primary"
                    >
                      View results
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {phase === "failed" && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4 animate-fade-up">
                  <p className="text-sm text-ink-500">
                    Nothing was imported. Fix the file and try again.
                  </p>
                  <button type="button" onClick={reset} className="btn-ghost">
                    Start over
                  </button>
                </div>
              )}
            </div>
          ) : (
            <FileUploader uploading={phase === "uploading"} onUpload={start} />
          )}
        </section>

        {/* Side info */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <section
            className="card overflow-hidden animate-fade-up"
            style={{ animationDelay: "120ms" }}
            aria-label="How the pipeline works"
          >
            <div className="border-b border-ink-100 bg-ink-50/50 px-5 py-3.5">
              <h2 className="text-[13px] font-bold text-ink-900">
                What happens to your file
              </h2>
            </div>
            <ol className="flex flex-col">
              {PIPELINE_STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex items-start gap-3.5 px-5 py-3.5 transition-colors hover:bg-ink-50/60 border-b border-ink-100/60 last:border-0"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-ink-900/[0.08]">
                    <step.Icon
                      className="h-4 w-4 text-brand-600"
                      aria-hidden="true"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink-900">
                      <span className="mr-1.5 font-mono text-[11px] text-ink-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section
            className="card p-5 animate-fade-up"
            style={{ animationDelay: "180ms" }}
            aria-label="Expected CSV schema"
          >
            <h2 className="text-[13px] font-bold text-ink-900">
              Expected schema
            </h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {EXPECTED_COLUMNS.map((column) => (
                <span
                  key={column}
                  className="chip bg-brand-50 font-mono text-brand-700 ring-1 ring-inset ring-brand-100"
                >
                  {column}
                </span>
              ))}
            </div>
            <div className="mt-3 overflow-x-auto rounded-lg bg-ink-950 px-3.5 py-3">
              <pre className="font-mono text-[11px] leading-relaxed text-ink-300">
                <span className="text-brand-300">
                  name,email,phone,company,city
                </span>
                {"\n"}Ada Lovelace,ada@engines.io,+14155550132,Analytical
                Engines,London
              </pre>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-500">
              Extra columns are ignored. Missing or malformed values are
              reported as per-row validation issues — never silently dropped.
            </p>
          </section>

          <section
            className="card px-5 py-4 animate-fade-up"
            style={{ animationDelay: "240ms" }}
          >
            <WorkspaceStats entries={entries} />
          </section>
        </div>
      </div>

      {/* Recent imports */}
      <section
        className="card animate-fade-up"
        style={{ animationDelay: "300ms" }}
        aria-label="Recent imports"
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
          <h2 className="text-[13px] font-bold text-ink-900">Recent imports</h2>
          {recent.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate({ name: "history" })}
              className="text-xs font-semibold text-brand-600 transition hover:text-brand-700"
            >
              View all →
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <FileSpreadsheet
              className="h-6 w-6 text-ink-300"
              aria-hidden="true"
            />
            <p className="text-sm text-ink-500">
              No imports yet — drop a CSV above to run your first one.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-100/70">
            {recent.map((entry) => (
              <li key={entry.jobId}>
                <button
                  type="button"
                  onClick={() =>
                    onNavigate({ name: "results", jobId: entry.jobId })
                  }
                  className="group flex w-full items-center gap-3.5 px-5 py-3 text-left transition-colors hover:bg-brand-50/30"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500 transition-colors group-hover:bg-brand-100 group-hover:text-brand-600">
                    <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-900">
                      {entry.filename}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-400">
                      {timeAgo(entry.updatedAt)} · {fmtNumber(entry.total)} rows
                      ·{" "}
                      <span className="text-emerald-600">
                        {fmtNumber(entry.valid)} valid
                      </span>
                    </span>
                  </span>
                  <StatusBadge status={entry.status} />
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-ink-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
