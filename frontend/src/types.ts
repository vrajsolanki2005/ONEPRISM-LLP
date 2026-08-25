/** Minimal view router — no external routing library needed. */
export type Route =
  | { name: "dashboard" }
  | { name: "results"; jobId: string }
  | { name: "history" };
