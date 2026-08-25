import { useEffect, useState } from "react";
import { ArrowRight, FileSpreadsheet, FileUp, History, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import {
  clearImportHistory,
  listImportHistory,
  onHistoryChanged,
  removeImportHistory,
  type ImportHistoryEntry,
} from "@/services/historyService";
import { fmtNumber, timeAgo } from "@/utils/format";
import type { Route } from "@/types";

export function ImportHistory({ onNavigate }: { onNavigate: (route: Route) => void }) {
  const [entries, setEntries] = useState<ImportHistoryEntry[]>(() => listImportHistory());

  useEffect(() => onHistoryChanged(() => setEntries(listImportHistory())), []);

  const handleClearAll = () => {
    if (entries.length === 0) return;
    if (window.confirm(`Remove all ${entries.length} entries from the local history?`)) {
      clearImportHistory();
    }
  };

  const handleRemove = (jobId: string) => {
    removeImportHistory(jobId);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">
            Activity
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink-950 sm:text-3xl">
            Import history
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-ink-500">
            Every job this browser has run against the OnePrism API. Entries are stored locally —
            clearing your browser storage also clears this list.
          </p>
        </div>
        {entries.length > 0 && (
          <button type="button" onClick={handleClearAll} className="btn-ghost text-rose-600 hover:text-rose-700">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear history
          </button>
        )}
      </header>

      <section className="card overflow-hidden animate-fade-up" style={{ animationDelay: "80ms" }}>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
              <History className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-lg font-bold text-ink-950">No imports yet</p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-500">
                Once you upload your first CSV, every run will be tracked here with its
                validation outcome.
              </p>
            </div>
            <button type="button" onClick={() => onNavigate({ name: "dashboard" })} className="btn-brand">
              <FileUp className="h-4 w-4" aria-hidden="true" />
              Run your first import
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse" aria-label="Import history">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/70">
                  <th scope="col" className="th-cell">File</th>
                  <th scope="col" className="th-cell">Status</th>
                  <th scope="col" className="th-cell text-right">Total</th>
                  <th scope="col" className="th-cell text-right">Valid</th>
                  <th scope="col" className="th-cell text-right">Invalid</th>
                  <th scope="col" className="th-cell text-right">Duplicates</th>
                  <th scope="col" className="th-cell">Finished</th>
                  <th scope="col" className="th-cell w-24">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.jobId}
                    className="group cursor-pointer border-b border-ink-100/70 transition-colors last:border-0 hover:bg-brand-50/30"
                    onClick={() => onNavigate({ name: "results", jobId: entry.jobId })}
                  >
                    <td className="td-cell">
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500 transition-colors group-hover:bg-brand-100 group-hover:text-brand-600">
                          <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-[220px] truncate text-sm font-semibold text-ink-900" title={entry.filename}>
                            {entry.filename}
                          </span>
                          <span className="block font-mono text-[10px] text-ink-400">
                            {entry.jobId.slice(0, 8)}…
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="td-cell">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="td-cell text-right font-mono text-[13px] tabular-nums text-ink-700">
                      {fmtNumber(entry.total)}
                    </td>
                    <td className="td-cell text-right font-mono text-[13px] tabular-nums text-emerald-600">
                      {fmtNumber(entry.valid)}
                    </td>
                    <td className="td-cell text-right font-mono text-[13px] tabular-nums text-rose-600">
                      {fmtNumber(entry.invalid)}
                    </td>
                    <td className="td-cell text-right font-mono text-[13px] tabular-nums text-amber-600">
                      {fmtNumber(entry.duplicates)}
                    </td>
                    <td className="td-cell whitespace-nowrap text-xs text-ink-500">
                      {timeAgo(entry.updatedAt)}
                    </td>
                    <td className="td-cell">
                      <span className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onNavigate({ name: "results", jobId: entry.jobId });
                          }}
                          className="btn-icon"
                          aria-label={`View results of ${entry.filename}`}
                          title="View results"
                        >
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemove(entry.jobId);
                          }}
                          className="btn-icon hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Remove ${entry.filename} from history`}
                          title="Remove from history"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
