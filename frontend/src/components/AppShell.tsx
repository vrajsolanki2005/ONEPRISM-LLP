import { useEffect, useState, type ReactNode } from "react";
import { ExternalLink, FileUp, History } from "lucide-react";
import { API_BASE_URL } from "@/api/client";
import { pingApi } from "@/api/imports";
import { cn } from "@/utils/cn";

type ShellView = "import" | "history";

interface AppShellProps {
  active: ShellView;
  onNavigate: (view: ShellView) => void;
  children: ReactNode;
}

function PrismLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="oneprism-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6a5cf4" />
          <stop offset="52%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path
        d="M16 4 28.5 26.5H3.5Z"
        fill="none"
        stroke="url(#oneprism-mark)"
        strokeWidth="2.75"
        strokeLinejoin="round"
      />
      <path d="M16 12.5 21.2 22.3H10.8Z" fill="url(#oneprism-mark)" opacity="0.9" />
    </svg>
  );
}

type ApiState = "checking" | "online" | "offline";

function useApiStatus(): ApiState {
  const [state, setState] = useState<ApiState>("checking");

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const ok = await pingApi();
      if (alive) setState(ok ? "online" : "offline");
    };
    check();
    const interval = setInterval(check, 20_000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  return state;
}

function ApiStatusDot({ state }: { state: ApiState }) {
  return (
    <span className="relative flex h-2 w-2" aria-hidden="true">
      {state === "online" && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      )}
      <span
        className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          state === "online" && "bg-emerald-400",
          state === "offline" && "bg-rose-400",
          state === "checking" && "bg-ink-400 animate-pulse",
        )}
      />
    </span>
  );
}

const NAV_ITEMS: { key: ShellView; label: string; Icon: typeof FileUp }[] = [
  { key: "import", label: "New Import", Icon: FileUp },
  { key: "history", label: "History", Icon: History },
];

/** FastAPI ships with auto-generated documentation — surface it in the footer. */
const BACKEND_LINKS: { href: string; label: string }[] = [
  { href: `${API_BASE_URL}/docs`, label: "API Reference" },
  { href: `${API_BASE_URL}/redoc`, label: "ReDoc" },
  { href: `${API_BASE_URL}/openapi.json`, label: "OpenAPI Spec" },
];

export function AppShell({ active, onNavigate, children }: AppShellProps) {
  const apiState = useApiStatus();
  const apiLabel =
    apiState === "online" ? "API connected" : apiState === "offline" ? "API unreachable" : "Checking API…";

  return (
    <div className="min-h-dvh">
      {/* Ambient background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[460px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(106,92,244,0.13),transparent)] blur-2xl" />
        <div className="absolute right-[-200px] top-1/3 h-[420px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(6,182,212,0.08),transparent)] blur-2xl" />
      </div>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-ink-950 text-ink-300 lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-brand-600/25 via-fuchsia-500/10 to-transparent" />

        <div className="relative flex items-center gap-3 px-5 pb-6 pt-6">
          <PrismLogo className="h-8 w-8" />
          <div className="min-w-0">
            <p className="font-display text-[17px] font-bold leading-tight text-white">OnePrism</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              CSV Import Console
            </p>
          </div>
        </div>

        <nav aria-label="Primary" className="relative flex flex-col gap-1 px-3">
          <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Workspace
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-white/[0.08] text-white ring-1 ring-inset ring-white/10"
                    : "text-ink-400 hover:bg-white/[0.04] hover:text-white",
                )}
              >
                <item.Icon
                  className={cn("h-4 w-4 transition-colors", isActive ? "text-brand-300" : "text-ink-500 group-hover:text-ink-300")}
                  aria-hidden="true"
                />
                {item.label}
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />}
              </button>
            );
          })}
        </nav>

        <div className="relative mt-auto flex flex-col gap-3 px-5 py-5">
          <div
            className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07]"
            title={apiLabel}
          >
            <ApiStatusDot state={apiState} />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-white">{apiLabel}</p>
              <p className="truncate font-mono text-[10px] text-ink-400">{API_BASE_URL.replace(/^https?:\/\//, "")}</p>
            </div>
          </div>
          <p className="text-[10px] text-ink-500">OnePrism Import Console · v1.0</p>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-ink-950/95 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <PrismLogo className="h-6 w-6" />
          <span className="font-display text-[15px] font-bold text-white">OnePrism</span>
        </div>
        <nav aria-label="Primary mobile" className="flex items-center gap-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  isActive ? "bg-white/10 text-white" : "text-ink-400 hover:text-white",
                )}
              >
                <item.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
          <span className="ml-1" title={apiLabel}>
            <ApiStatusDot state={apiState} />
          </span>
        </nav>
      </header>

      {/* Content */}
      <main id="main-content" className="flex min-h-dvh flex-col lg:pl-[248px]">
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {children}
        </div>

        {/* Footer */}
        <footer className="mt-4 border-t border-ink-900/[0.07]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <PrismLogo className="h-6 w-6" />
              <div>
                <p className="font-display text-[13px] font-bold leading-tight text-ink-950">
                  OnePrism{" "}
                  <span className="font-sans font-medium text-ink-400">· CSV Import Console</span>
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-ink-400">
                  Parse, validate and deduplicate tabular data with confidence.
                </p>
              </div>
            </div>

            {/* Links */}
            <nav
              aria-label="Footer"
              className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-ink-500"
            >
              <button
                type="button"
                onClick={() => onNavigate("import")}
                className="transition-colors hover:text-ink-900"
              >
                New Import
              </button>
              <button
                type="button"
                onClick={() => onNavigate("history")}
                className="transition-colors hover:text-ink-900"
              >
                History
              </button>
              <span aria-hidden="true" className="hidden h-3 w-px bg-ink-200 sm:block" />
              {BACKEND_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 transition-colors hover:text-ink-900"
                >
                  {link.label}
                  <ExternalLink className="h-3 w-3 text-ink-300" aria-hidden="true" />
                </a>
              ))}
            </nav>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-400">
              <span className="flex items-center gap-1.5" title={apiLabel}>
                <ApiStatusDot state={apiState} />
                <span className="font-mono">
                  {API_BASE_URL.replace(/^https?:\/\//, "")}
                </span>
              </span>
              <span aria-hidden="true" className="hidden h-3 w-px bg-ink-200 sm:block" />
              <span>© {new Date().getFullYear()} OnePrism · v1.0</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
