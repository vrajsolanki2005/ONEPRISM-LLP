import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  FileSpreadsheet,
  ScanLine,
  ShieldCheck,
  Timer,
  XCircle,
} from "lucide-react";
import type { ImportJob } from "@/api/imports";
import { useCountUp } from "@/hooks/useCountUp";
import { fmtElapsed, fmtNumber } from "@/utils/format";
import { cn } from "@/utils/cn";

type LivePhase = "uploading" | "processing" | "completed" | "failed";

interface ImportStatusProps {
  phase: LivePhase;
  job: ImportJob | null;
  error?: string | null;
}

function LiveNumber({ value, tone = "text-ink-900" }: { value: number; tone?: string }) {
  const display = useCountUp(value, 500);
  return (
    <span className={cn("font-mono text-sm font-semibold tabular-nums", tone)}>
      {fmtNumber(display)}
    </span>
  );
}

export function ImportStatus({ phase, job, error }: ImportStatusProps) {
  const failed = phase === "failed";
  const finished = phase === "completed" || failed;
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const startRef = useRef(Date.now());
  const jobId = job?.job_id ?? null;

  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
  }, [jobId]);

  useEffect(() => {
    if (finished) return;
    const interval = setInterval(() => {
      setElapsed((Date.now() - startRef.current) / 1000);
    }, 250);
    return () => clearInterval(interval);
  }, [finished]);

  const copyJobId = async () => {
    if (!jobId) return;
    try {
      await navigator.clipboard.writeText(jobId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1_600);
    } catch {
      /* clipboard unavailable */
    }
  };

  const statusKey = job?.status ?? "PENDING";
  const currentIndex = finished
    ? 4
    : phase === "uploading"
      ? 0
      : statusKey === "PROCESSING"
        ? 2
        : 1;

  const steps = [
    {
      label: "File received",
      desc: job?.filename ?? "Contacting server…",
      Icon: FileSpreadsheet,
    },
    {
      label: "Parsing rows",
      desc:
        (job?.total_records ?? 0) > 0
          ? `${fmtNumber(job!.total_records)} rows detected`
          : "Reading CSV stream",
      Icon: ScanLine,
    },
    {
      label: "Validate & dedup",
      desc: "Email, phone & duplicate checks",
      Icon: ShieldCheck,
    },
    {
      label: failed ? "Import failed" : "Import complete",
      desc: failed ? "See the error below" : "Results are ready",
      Icon: failed ? XCircle : CheckCircle2,
    },
  ];

  const progress = finished ? (failed ? 100 : 100) : [12, 45, 78][currentIndex - 1] ?? 8;

  return (
    <div className="flex flex-col gap-6" aria-live="polite">
      {/* Steps */}
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const isDone = index < currentIndex || (finished && index < 3);
          const isActive = !finished && index === currentIndex;
          const isLast = index === 3;
          const failedLast = failed && isLast;

          return (
            <li
              key={step.label}
              className={cn(
                "flex items-start gap-3 rounded-xl px-3.5 py-3 ring-1 ring-inset transition-colors",
                isActive && "bg-brand-50/70 ring-brand-100",
                failedLast && "bg-rose-50/70 ring-rose-100",
                isDone && "bg-emerald-50/40 ring-emerald-100/60",
                !isDone && !isActive && !failedLast && "bg-ink-50/60 ring-ink-100/70",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors",
                  isDone && "bg-emerald-100 text-emerald-600 ring-emerald-200",
                  isActive && "bg-white text-brand-600 ring-brand-200 animate-pulse-ring",
                  failedLast && "bg-rose-100 text-rose-600 ring-rose-200",
                  !isDone && !isActive && !failedLast && "bg-white text-ink-300 ring-ink-100",
                )}
              >
                {isDone ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <step.Icon className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-ink-900">
                  {step.label}
                </span>
                <span className="mt-0.5 block truncate text-xs text-ink-500" title={step.desc}>
                  {step.desc}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            failed ? "bg-rose-500" : "bg-gradient-to-r from-brand-500 via-fuchsia-500 to-cyan-400",
          )}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Live counters + meta */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-500">
        <span className="flex items-center gap-1.5">
          Rows <LiveNumber value={job?.total_records ?? 0} />
        </span>
        <span className="flex items-center gap-1.5">
          Valid <LiveNumber value={job?.valid_records ?? 0} tone="text-emerald-600" />
        </span>
        <span className="flex items-center gap-1.5">
          Invalid <LiveNumber value={job?.invalid_records ?? 0} tone="text-rose-600" />
        </span>
        <span className="flex items-center gap-1.5">
          Duplicates <LiveNumber value={job?.duplicate_records ?? 0} tone="text-amber-600" />
        </span>

        <span className="ml-auto flex items-center gap-2">
          <span className="chip bg-ink-100 text-ink-600">
            <Timer className="h-3 w-3" aria-hidden="true" />
            <span className="font-mono tabular-nums">{fmtElapsed(elapsed)}</span>
          </span>
          {jobId && (
            <button
              type="button"
              onClick={copyJobId}
              title="Copy job id"
              className="chip bg-ink-100 text-ink-600 transition hover:bg-ink-200"
            >
              <span className="font-mono">{jobId.slice(0, 8)}…</span>
              {copied ? (
                <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
              ) : (
                <Copy className="h-3 w-3" aria-hidden="true" />
              )}
            </button>
          )}
        </span>
      </div>

      {/* Failure details */}
      {(failed || (error && phase !== "completed")) && (error || job?.error_message) && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200 animate-fade-up"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="break-words">{error ?? job?.error_message}</span>
        </div>
      )}
    </div>
  );
}
