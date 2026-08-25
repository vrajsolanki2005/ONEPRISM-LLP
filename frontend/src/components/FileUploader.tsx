import { useId, useRef, useState, type DragEvent } from "react";
import { AlertCircle, CloudUpload, FileSpreadsheet, Loader2, X } from "lucide-react";
import { MAX_FILE_SIZE_BYTES, validateCsvFile } from "@/services/importService";
import { fmtBytes } from "@/utils/format";
import { cn } from "@/utils/cn";

interface FileUploaderProps {
  uploading: boolean;
  onUpload: (file: File) => void;
}

export function FileUploader({ uploading, onUpload }: FileUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const acceptFile = (candidate: File | undefined | null) => {
    if (!candidate || uploading) return;
    const result = validateCsvFile(candidate);
    if (!result.ok) {
      setError(result.message ?? "This file cannot be imported.");
      setFile(null);
      return;
    }
    setError(null);
    setFile(candidate);
  };

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current += 1;
    setDragging(true);
  };

  // dragover fires continuously — only preventDefault so the drop is allowed,
  // without touching the depth counter used by enter/leave.
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = 0;
    setDragging(false);
    acceptFile(event.dataTransfer?.files?.[0]);
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        role="region"
        aria-label="CSV upload area"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200",
          dragging
            ? "border-brand-500 bg-brand-50/60 shadow-[0_0_0_4px_rgba(106,92,244,0.12)]"
            : "border-ink-200 bg-ink-50/50 hover:border-ink-300 hover:bg-ink-50",
        )}
      >
        {uploading && (
          <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden" aria-hidden="true">
            <div className="h-full w-1/3 animate-scan bg-gradient-to-r from-brand-500 via-fuchsia-500 to-cyan-400" />
          </div>
        )}

        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept=".csv,text/csv,application/vnd.ms-excel"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => acceptFile(event.target.files?.[0])}
        />

        {!file ? (
          <label
            htmlFor={inputId}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 px-6 py-12 text-center sm:py-16"
          >
            <span
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl bg-white ring-1 ring-ink-900/10 shadow-sm transition-transform duration-200",
                dragging && "scale-110 rotate-3",
              )}
            >
              <CloudUpload
                className={cn("h-6 w-6 transition-colors", dragging ? "text-brand-600" : "text-ink-400")}
                aria-hidden="true"
              />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink-900">
                {dragging ? "Drop to attach your file" : "Drag & drop your CSV here"}
              </span>
              <span className="text-sm text-ink-500">
                or <span className="font-semibold text-brand-600 underline underline-offset-2">browse from your computer</span>
              </span>
            </span>
            <span className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-medium text-ink-400">
              <span>.csv files only</span>
              <span aria-hidden="true">·</span>
              <span>up to {fmtBytes(MAX_FILE_SIZE_BYTES)}</span>
              <span aria-hidden="true">·</span>
              <span>columns: name, email, phone, company, city</span>
            </span>
          </label>
        ) : (
          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 ring-1 ring-brand-100">
                <FileSpreadsheet className="h-6 w-6 text-brand-600" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900" title={file.name}>
                  {file.name}
                </p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                  <span className="chip bg-ink-100 text-ink-600">CSV</span>
                  <span className="font-mono">{fmtBytes(file.size)}</span>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onUpload(file)}
                disabled={uploading}
                className="btn-brand"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Uploading…
                  </>
                ) : (
                  "Start import"
                )}
              </button>
              <button
                type="button"
                onClick={clearFile}
                disabled={uploading}
                className="btn-icon"
                aria-label="Remove selected file"
                title="Remove selected file"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200 animate-fade-up"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
