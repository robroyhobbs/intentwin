"use client";

import { useCallback, useRef, useState } from "react";
import { filterValidFiles } from "./intake-helpers";

// ── Small helpers ────────────────────────────────────────────────────────────

function UploadIcon() {
  return (
    <svg
      className="h-10 w-10 text-muted-foreground"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775
           5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118
           19.5H6.75z"
      />
    </svg>
  );
}

function submitValidFiles(
  source: FileList | null | undefined,
  onFiles: (f: File[]) => void,
) {
  if (!source) return;
  const valid = filterValidFiles(source);
  if (valid.length > 0) onFiles(valid);
}

// ── Tab switcher ─────────────────────────────────────────────────────────────

export type InputMode = "upload" | "url";

export function InputModeTabs({
  mode,
  onSwitch,
}: {
  mode: InputMode;
  onSwitch: (m: InputMode) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      <button
        type="button"
        onClick={() => onSwitch("upload")}
        className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          mode === "upload"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Upload Files
      </button>
      <button
        type="button"
        onClick={() => onSwitch("url")}
        className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          mode === "url"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Paste URL
      </button>
    </div>
  );
}

// ── Drop zone ────────────────────────────────────────────────────────────────

export function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const openPicker = () => inputRef.current?.click();

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      submitValidFiles(e.dataTransfer.files, onFiles);
    },
    [onFiles],
  );

  const border = dragOver
    ? "border-primary bg-primary/5"
    : "border-border hover:border-primary/50";

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={openPicker}
      role="button"
      aria-label="Upload RFP documents. Supports PDF, DOCX, TXT, and XLSX."
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openPicker(); }}
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 cursor-pointer transition-colors ${border}`}
    >
      <UploadIcon />
      <p className="text-sm font-medium">
        Drag and drop your RFP files here, or click to browse
      </p>
      <p className="text-xs text-muted-foreground">
        Supported: PDF, DOCX, TXT, XLSX
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.xlsx"
        className="hidden"
        onChange={() => submitValidFiles(inputRef.current?.files, onFiles)}
      />
    </div>
  );
}

// ── URL input ────────────────────────────────────────────────────────────────

export function UrlInput({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const isValid = /^https?:\/\/.+/.test(url.trim());

  return (
    <div className="rounded-xl border-2 border-dashed border-border p-8 space-y-4">
      <div className="text-center space-y-2">
        <p className="text-sm font-medium">Paste a solicitation URL</p>
        <p className="text-xs text-muted-foreground">
          Works with SAM.gov, agency portals, and any public solicitation page
        </p>
      </div>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://sam.gov/opp/..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={() => isValid && onSubmit(url.trim())}
          disabled={!isValid}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Fetch & Analyze
        </button>
      </div>
    </div>
  );
}
