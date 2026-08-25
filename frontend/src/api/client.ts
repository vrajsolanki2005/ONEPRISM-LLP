import axios from "axios";

/**
 * Centralized API base URL.
 * Override at build/dev time with VITE_API_BASE_URL if the FastAPI
 * server runs somewhere other than http://localhost:8000.
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
});

/** Normalize every axios failure into a human-readable ApiError. */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel?.(error)) {
      return Promise.reject(new ApiError("Request cancelled"));
    }

    if (error.response) {
      const status: number = error.response.status;
      const data = error.response.data;
      let detail: string | undefined;

      if (typeof data === "string" && data.trim()) {
        detail = data;
      } else if (data && typeof data === "object") {
        const raw = data.detail ?? data.message ?? data.error;
        if (typeof raw === "string") detail = raw;
        else if (Array.isArray(raw) && raw.length > 0) {
          detail = raw
            .map((item) =>
              typeof item === "string"
                ? item
                : item?.msg ?? item?.message ?? JSON.stringify(item),
            )
            .join(" · ");
        }
      }

      return Promise.reject(
        new ApiError(detail || `The server responded with HTTP ${status}.`, status),
      );
    }

    if (error.code === "ECONNABORTED") {
      return Promise.reject(
        new ApiError("The request timed out — the server took too long to respond."),
      );
    }

    return Promise.reject(
      new ApiError(
        `Cannot reach the OnePrism API at ${API_BASE_URL}. Make sure the backend is running.`,
      ),
    );
  },
);

/** Extract a readable message from any thrown value. */
export function errorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
