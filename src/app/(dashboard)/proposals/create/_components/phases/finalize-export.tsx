"use client";

import { useCallback, useState } from "react";
import { logger } from "@/lib/utils/logger";

type FetchFn = (url: string, options?: RequestInit) => Promise<Response>;

// ── Export API call ─────────────────────────────────────────────────────────

interface ExportResult {
  downloadUrl: string;
}

async function callExportApi(
  proposalId: string,
  format: "docx" | "pdf",
  fetchFn: FetchFn,
): Promise<ExportResult> {
  const res = await fetchFn(`/api/proposals/${proposalId}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `Export failed (${res.status})`,
    );
  }

  const data = (await res.json()) as Record<string, unknown>;
  const url = (data.downloadUrl as string) ?? (data.download_url as string);
  if (!url) {
    throw new Error("Export succeeded but no download URL was returned");
  }
  return { downloadUrl: url };
}

// ── Small presentational pieces ─────────────────────────────────────────────

function ExportBtn({
  label,
  disabled,
  loading,
  onClick,
}: {
  label: string;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent shrink-0" />
      )}
      {label}
    </button>
  );
}

function DownloadLink({ url }: { url: string }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 p-4 space-y-2">
      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
        Export complete!
      </p>
      <div className="flex items-center gap-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:underline"
        >
          Download file
        </a>
      </div>
    </div>
  );
}

// ── Export hook ──────────────────────────────────────────────────────────────

function useExport(
  proposalId: string | null,
  onExported: (url: string) => void,
  fetchFn: FetchFn,
) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(
    async (format: "docx" | "pdf") => {
      if (!proposalId) return;
      setExporting(format);
      setError(null);

      try {
        const result = await callExportApi(proposalId, format, fetchFn);
        onExported(result.downloadUrl);
        logger.info("Finalize: export complete", { format, proposalId });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Export failed unexpectedly";
        setError(msg);
        logger.error("Finalize: export failed", { format, error: msg });
      } finally {
        setExporting(null);
      }
    },
    [proposalId, onExported, fetchFn],
  );

  return { exporting, error, handleExport };
}

// ── Export buttons panel ─────────────────────────────────────────────────────

export interface ExportButtonsProps {
  proposalId: string | null;
  enabled: boolean;
  exportedUrl: string | null;
  onExported: (url: string) => void;
  fetchFn: FetchFn;
}

export function ExportButtons({
  proposalId,
  enabled,
  exportedUrl,
  onExported,
  fetchFn,
}: ExportButtonsProps) {
  const { exporting, error, handleExport } = useExport(
    proposalId,
    onExported,
    fetchFn,
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Export</h3>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <ExportBtn
          label="Export DOCX"
          disabled={!enabled || !proposalId}
          loading={exporting === "docx"}
          onClick={() => void handleExport("docx")}
        />
        <ExportBtn
          label="Export PDF"
          disabled={!enabled || !proposalId}
          loading={exporting === "pdf"}
          onClick={() => void handleExport("pdf")}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {exportedUrl && <DownloadLink url={exportedUrl} />}
    </div>
  );
}
