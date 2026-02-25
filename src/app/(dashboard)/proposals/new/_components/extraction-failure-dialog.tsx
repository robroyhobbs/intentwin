"use client";

/**
 * ExtractionFailureDialog — Shown when document extraction fails.
 *
 * Offers three choices:
 * 1. Retry — re-trigger extraction
 * 2. Manual Entry — skip extraction, fill form manually (goes to step 3)
 * 3. Review Partial — if partial data was extracted, proceed to step 2 review
 */

import { AlertTriangle, RotateCcw, Edit3, FileSearch } from "lucide-react";

interface ExtractionFailureDialogProps {
  error: string;
  hasPartialData: boolean;
  onRetry: () => void;
  onManualEntry: () => void;
  onReviewPartial: () => void;
}

export function ExtractionFailureDialog({
  error,
  hasPartialData,
  onRetry,
  onManualEntry,
  onReviewPartial,
}: ExtractionFailureDialogProps) {
  return (
    <div className="max-w-lg mx-auto">
      <div className="rounded-2xl border border-[var(--danger-muted)] bg-[var(--danger-subtle)] p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger)]/10">
            <AlertTriangle className="h-7 w-7 text-[var(--danger)]" />
          </div>
        </div>

        {/* Message */}
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Extraction Failed
        </h3>
        <p className="text-sm text-[var(--foreground-muted)] mb-6 max-w-sm mx-auto">
          {error || "We couldn't extract data from your content. You can try again, enter data manually, or review what we found."}
        </p>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-subtle)] transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>

          {hasPartialData && (
            <button
              onClick={onReviewPartial}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--accent-muted)] bg-[var(--accent-subtle)] px-4 py-3 text-sm font-medium text-[var(--accent)] hover:brightness-110 transition-all"
            >
              <FileSearch className="h-4 w-4" />
              Review Partial Data
            </button>
          )}

          <button
            onClick={onManualEntry}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:brightness-110 transition-all"
          >
            <Edit3 className="h-4 w-4" />
            Enter Manually
          </button>
        </div>
      </div>
    </div>
  );
}
