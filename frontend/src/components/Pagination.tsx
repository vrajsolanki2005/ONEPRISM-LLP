import { ChevronLeft, ChevronRight } from "lucide-react";
import { fmtNumber } from "@/utils/format";
import { cn } from "@/utils/cn";

type PageItem = number | "ellipsis-left" | "ellipsis-right";

function buildPageItems(current: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const pages = new Set<number>([1, 2, current - 1, current, current + 1, totalPages - 1, totalPages]);
  const filtered = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);

  const items: PageItem[] = [];
  let previous = 0;
  for (const page of filtered) {
    if (page - previous > 1) {
      items.push(page - previous === 2 ? previous + 1 : previous < 3 ? "ellipsis-left" : "ellipsis-right");
    }
    items.push(page);
    previous = page;
  }
  return items.filter((item, index, array) => array.indexOf(item) === index || typeof item === "number");
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange, disabled }: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const items = buildPageItems(page, totalPages);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-ink-500" aria-live="polite">
        {total === 0 ? (
          "No records"
        ) : (
          <>
            Showing <span className="font-mono font-semibold text-ink-800 tabular-nums">{fmtNumber(from)}</span>
            {" – "}
            <span className="font-mono font-semibold text-ink-800 tabular-nums">{fmtNumber(to)}</span>
            {" of "}
            <span className="font-mono font-semibold text-ink-800 tabular-nums">{fmtNumber(total)}</span> records
          </>
        )}
      </p>

      <nav aria-label="Records pagination" className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          aria-label="Previous page"
          className="btn-icon bg-white ring-ink-900/10"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {items.map((item, index) =>
            typeof item === "number" ? (
              <button
                key={`${item}-${index}`}
                type="button"
                onClick={() => onPageChange(item)}
                disabled={disabled}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  "h-9 min-w-9 rounded-lg px-2 font-mono text-[13px] font-semibold tabular-nums transition-all duration-150",
                  item === page
                    ? "bg-ink-950 text-white shadow-sm"
                    : "bg-white text-ink-600 ring-1 ring-ink-900/10 hover:bg-ink-50 hover:text-ink-950",
                )}
              >
                {item}
              </button>
            ) : (
              <span key={`${item}-${index}`} className="px-1 text-ink-400" aria-hidden="true">
                …
              </span>
            ),
          )}
        </div>

        <span className="px-2 font-mono text-xs text-ink-500 tabular-nums sm:hidden">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          aria-label="Next page"
          className="btn-icon bg-white ring-ink-900/10"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
