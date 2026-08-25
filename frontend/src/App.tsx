import { useCallback, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Dashboard } from "@/pages/Dashboard";
import { ImportHistory } from "@/pages/ImportHistory";
import { ImportResults } from "@/pages/ImportResults";
import type { Route } from "@/types";

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "dashboard" });

  const navigate = useCallback((next: Route) => {
    setRoute(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const shellView = route.name === "history" ? "history" : "import";

  return (
    <AppShell
      active={shellView}
      onNavigate={(view) => navigate({ name: view === "history" ? "history" : "dashboard" })}
    >
      {route.name === "dashboard" && <Dashboard onNavigate={navigate} />}
      {route.name === "results" && (
        <ImportResults key={route.jobId} jobId={route.jobId} onNavigate={navigate} />
      )}
      {route.name === "history" && <ImportHistory onNavigate={navigate} />}
    </AppShell>
  );
}
