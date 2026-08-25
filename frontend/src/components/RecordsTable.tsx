import { AlertCircle, Check, Copy, Inbox, RefreshCw, X } from "lucide-react";
import type { ImportRecord } from "@/api/imports";
import { cn } from "@/utils/cn";

const AVATAR_TONES = [
  "bg-brand-50 text-brand-600 ring-brand-100",
  "bg-emerald-50 text-emerald-600 ring-emerald-100",
  "bg-amber-50 text-amber-600 ring-amber-100",
  "bg-sky-50 text-sky-600 ring-sky-100",
  "bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-100",
];

function InitialAvatar({ name, rowNumber }: { name: string; rowNumber: number }) {
  const letter = (name.trim().charAt(0) || "?").toUpperCase();
  const tone = AVATAR_TONES[(letter.charCodeAt(0) + rowNumber) % AVATAR_TONES.length];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1 ring-inset",
        tone,
      )}
    >
      {letter}
    </span>
  );
}

function Dash() {
  return <span className="text-ink-300">—</span>;
}

function SkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, row) => (
        <tr key={row} className="border-b border-ink-100/70 last:border-0">
          {Array.from({ length: 8 }).map((__, cell) => (
            <td key={cell} className="px-4 py-3.5">
              <div
                className={cn(
                  "h-3.5 rounded-md bg-ink-100 shimmer",
                  cell === 0 ? "w-8" : cell === 1 ? "w-28" : cell === 7 ? "w-40" : "w-20",
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export interface RecordsTableProps {
  records: ImportRecord[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
}

export function RecordsTable({
  records,
  loading,
  refreshing,
  error,
  hasActiveFilters,
  onRetry,
  onClearFilters,
}: RecordsTableProps) {
  const showInitialSkeleton = loading && records.length === 0 && !error;
  const showEmpty = !loading && !error && records.length === 0;

  return (
    <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-ink-900/[0.07]">
      {refreshing && (
        <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden" aria-hidden="true">
          <div className="h-full w-1/3 animate-scan bg-gradient-to-r from-brand-500 via-fuchsia-500 to-cyan-400" />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] border-collapse" aria-label="Imported records">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/70">
              <th scope="col" className="th-cell w-16">Row</th>
              <th scope="col" className="th-cell">Name</th>
              <th scope="col" className="th-cell">Email</th>
              <th scope="col" className="th-cell">Phone</th>
              <th scope="col" className="th-cell">Company</th>
              <th scope="col" className="th-cell">City</th>
              <th scope="col" className="th-cell">Status</th>
              <th scope="col" className="th-cell">Validation issues</th>
            </tr>
          </thead>

          <tbody className={cn("transition-opacity duration-150", refreshing && "opacity-60")}>
            {showInitialSkeleton && <SkeletonRows />}

            {!showInitialSkeleton &&
              records.map((record) => (
                <tr
                  key={`${record.row_number}-${record.email}`}
                  className="group border-b border-ink-100/70 transition-colors last:border-0 hover:bg-brand-50/30"
                >
                  <td className="td-cell font-mono text-xs text-ink-400 tabular-nums">
                    {record.row_number}
                  </td>
                  <td className="td-cell">
                    <span className="flex items-center gap-2.5">
                      <InitialAvatar name={record.name} rowNumber={record.row_number} />
                      <span className="max-w-[180px] truncate font-medium text-ink-900" title={record.name}>
                        {record.name || <Dash />}
                      </span>
                    </span>
                  </td>
                  <td className="td-cell">
                    <span className="block max-w-[220px] truncate text-ink-600" title={record.email}>
                      {record.email || <Dash />}
                    </span>
                  </td>
                  <td className="td-cell whitespace-nowrap text-ink-600">{record.phone || <Dash />}</td>
                  <td className="td-cell">
                    <span className="block max-w-[160px] truncate" title={record.company}>
                      {record.company || <Dash />}
                    </span>
                  </td>
                  <td className="td-cell whitespace-nowrap">{record.city || <Dash />}</td>
                  <td className="td-cell">
                    <span className="flex flex-col items-start gap-1">
                      {record.is_valid ? (
                        <span className="chip bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          <Check className="h-3 w-3" aria-hidden="true" />
                          Valid
                        </span>
                      ) : (
                        <span className="chip bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200">
                          <X className="h-3 w-3" aria-hidden="true" />
                          Invalid
                        </span>
                      )}
                      {record.is_duplicate && (
                        <span className="chip bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                          <Copy className="h-3 w-3" aria-hidden="true" />
                          Duplicate
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="td-cell">
                    {record.validation_reasons.length > 0 ? (
                      <span className="flex max-w-[280px] flex-wrap gap-1">
                        {record.validation_reasons.slice(0, 3).map((reason) => (
                          <span
                            key={reason}
                            className="chip bg-rose-50/70 text-rose-700 ring-1 ring-inset ring-rose-100"
                            title={reason}
                          >
                            {reason}
                          </span>
                        ))}
                        {record.validation_reasons.length > 3 && (
                          <span
                            className="chip bg-ink-100 text-ink-500"
                            title={record.validation_reasons.join("\n")}
                          >
                            +{record.validation_reasons.length - 3} more
                          </span>
                        )}
                      </span>
                    ) : (
                      <Dash />
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Empty state */}
        {showEmpty && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center animate-fade-up">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
              <Inbox className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">No records to show</p>
              <p className="mt-1 max-w-sm text-sm text-ink-500">
                {hasActiveFilters
                  ? "No rows match your current search or filter. Try widening the criteria."
                  : "This import did not produce any records."}
              </p>
            </div>
            {hasActiveFilters && (
              <button type="button" onClick={onClearFilters} className="btn-ghost h-9 px-3.5">
                Clear search & filters
              </button>
            )}
          </div>
        )}

        {/* Error state (no data available) */}
        {error && records.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center animate-fade-up">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-inset ring-rose-100">
              <AlertCircle className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">Records could not be loaded</p>
              <p className="mt-1 max-w-sm text-sm text-ink-500">{error}</p>
            </div>
            <button type="button" onClick={onRetry} className="btn-ghost h-9 px-3.5">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Error banner while stale rows stay visible */}
      {error && records.length > 0 && (
        <div role="alert" className="flex items-center gap-2.5 border-t border-rose-100 bg-rose-50/80 px-4 py-2.5 text-xs text-rose-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="font-semibold underline underline-offset-2 hover:text-rose-800"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
