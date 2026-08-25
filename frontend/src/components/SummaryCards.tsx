import { AlertTriangle, BadgeCheck, Copy, Database } from "lucide-react";
import type { ImportJob } from "@/api/imports";
import { useCountUp } from "@/hooks/useCountUp";
import { fmtNumber, percent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface SummaryCardsProps {
  job: ImportJob;
}

interface StatCardProps {
  label: string;
  value: number;
  caption: string;
  Icon: typeof Database;
  tileClass: string;
  barPercent?: number;
  barClass?: string;
  delayIndex: number;
}

function StatCard({ label, value, caption, Icon, tileClass, barPercent, barClass, delayIndex }: StatCardProps) {
  const display = useCountUp(value);

  return (
    <div
      className="card group p-5 animate-fade-up"
      style={{ animationDelay: `${delayIndex * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-ink-950">
            {fmtNumber(display)}
          </p>
          <p className="mt-1 truncate text-xs text-ink-400">{caption}</p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-200 group-hover:scale-105",
            tileClass,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      {typeof barPercent === "number" && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
          <div
            className={cn("h-full rounded-full transition-all duration-700 ease-out", barClass)}
            style={{ width: `${Math.min(100, Math.max(0, barPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function SummaryCards({ job }: SummaryCardsProps) {
  const total = job.total_records;
  const validShare = total > 0 ? (job.valid_records / total) * 100 : 0;

  return (
    <section aria-label="Import summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        delayIndex={0}
        label="Total records"
        value={total}
        caption={total > 0 ? `rows parsed from ${job.filename}` : "no rows received"}
        Icon={Database}
        tileClass="bg-ink-100 text-ink-700 ring-ink-200/60"
      />
      <StatCard
        delayIndex={1}
        label="Valid records"
        value={job.valid_records}
        caption={`${percent(job.valid_records, total)} of all rows`}
        Icon={BadgeCheck}
        tileClass="bg-emerald-50 text-emerald-600 ring-emerald-100"
        barPercent={validShare}
        barClass="bg-emerald-500"
      />
      <StatCard
        delayIndex={2}
        label="Invalid records"
        value={job.invalid_records}
        caption={`${percent(job.invalid_records, total)} rejected on validation`}
        Icon={AlertTriangle}
        tileClass="bg-rose-50 text-rose-600 ring-rose-100"
        barPercent={total > 0 ? (job.invalid_records / total) * 100 : 0}
        barClass="bg-rose-500"
      />
      <StatCard
        delayIndex={3}
        label="Duplicates found"
        value={job.duplicate_records}
        caption={`${percent(job.duplicate_records, total)} matched an earlier row`}
        Icon={Copy}
        tileClass="bg-amber-50 text-amber-600 ring-amber-100"
        barPercent={total > 0 ? (job.duplicate_records / total) * 100 : 0}
        barClass="bg-amber-400"
      />
    </section>
  );
}
