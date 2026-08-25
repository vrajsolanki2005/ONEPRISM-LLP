import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { cn } from "@/utils/cn";

const STATUS_STYLES: Record<
  string,
  { label: string; className: string; Icon: typeof Clock; spin?: boolean }
> = {
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Icon: CheckCircle2,
  },
  FAILED: {
    label: "Failed",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
    Icon: XCircle,
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-sky-50 text-sky-700 ring-sky-200",
    Icon: Loader2,
    spin: true,
  },
  PENDING: {
    label: "Queued",
    className: "bg-ink-100 text-ink-600 ring-ink-200",
    Icon: Clock,
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_STYLES[status] ?? {
    label: status,
    className: "bg-ink-100 text-ink-600 ring-ink-200",
    Icon: Clock,
  };

  return (
    <span
      className={cn(
        "chip ring-1 ring-inset",
        config.className,
        className,
      )}
      aria-label={`Status: ${config.label}`}
    >
      <config.Icon
        className={cn("h-3 w-3", config.spin && "animate-spin")}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
