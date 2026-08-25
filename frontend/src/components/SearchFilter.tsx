import { RefreshCw, Search, X } from "lucide-react";
import type { ValidityFilter } from "@/api/imports";
import { cn } from "@/utils/cn";

const FILTER_OPTIONS: { value: ValidityFilter; label: string }[] = [
  { value: "all", label: "All rows" },
  { value: "valid", label: "Valid" },
  { value: "invalid", label: "Invalid" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: ValidityFilter;
  onFilterChange: (value: ValidityFilter) => void;
  pageSize: number;
  onPageSizeChange: (value: number) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

export function SearchFilter({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  pageSize,
  onPageSizeChange,
  refreshing,
  onRefresh,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      {/* Search */}
      <div className="relative flex-1 md:max-w-sm">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search name, email, company, city…"
          aria-label="Search records"
          className="input pl-9 pr-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 md:ml-auto">
        {/* Validity segmented control */}
        <div
          role="group"
          aria-label="Filter by validity"
          className="flex shrink-0 items-center gap-0.5 rounded-xl bg-ink-100 p-1"
        >
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => onFilterChange(option.value)}
              className={cn(
                "h-8 rounded-lg px-3 text-[13px] font-semibold transition-all duration-150",
                filter === option.value
                  ? "bg-white text-ink-950 shadow-sm ring-1 ring-ink-900/[0.06]"
                  : "text-ink-500 hover:text-ink-800",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Page size */}
        <label className="flex items-center gap-2 text-xs font-medium text-ink-500">
          <span className="hidden sm:inline">Rows</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            aria-label="Rows per page"
            className="h-9 rounded-lg bg-white px-2 text-[13px] font-semibold text-ink-800 ring-1 ring-ink-900/10 transition focus:outline-none focus:ring-2 focus:ring-brand-500/60"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        {/* Refresh */}
        <button
          type="button"
          onClick={onRefresh}
          className="btn-icon ring-ink-900/10 bg-white"
          aria-label="Refresh records"
          title="Refresh records"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
