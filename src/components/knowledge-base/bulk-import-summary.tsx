"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Building2,
  Package,
  Award,
  ArrowRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ImportCounts {
  company_context: number;
  product_contexts: number;
  evidence_library: number;
}

interface BulkImportSummaryProps {
  counts: ImportCounts;
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function BulkImportSummary({
  counts,
  onClose,
}: BulkImportSummaryProps) {
  const total =
    counts.company_context + counts.product_contexts + counts.evidence_library;

  return (
    <div className="space-y-6 text-center">
      <div>
        <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--success)]" />
        <h3 className="mt-3 text-lg font-bold text-[var(--foreground)]">
          Import Complete
        </h3>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          {total} items imported to your Knowledge Base
        </p>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-3">
        {counts.company_context > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
            <Building2 className="mx-auto h-6 w-6 text-[var(--accent)]" />
            <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">
              {counts.company_context}
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">
              Company Facts
            </p>
          </div>
        )}
        {counts.product_contexts > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
            <Package className="mx-auto h-6 w-6 text-[var(--info)]" />
            <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">
              {counts.product_contexts}
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">
              Products
            </p>
          </div>
        )}
        {counts.evidence_library > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
            <Award className="mx-auto h-6 w-6 text-[var(--success)]" />
            <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">
              {counts.evidence_library}
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">
              Evidence
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="space-y-2">
        <Link
          href="/knowledge-base/sources"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-tertiary)] px-4 py-2.5 text-sm font-medium text-[var(--foreground-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
        >
          View L1 Sources
          <ArrowRight className="h-4 w-4" />
        </Link>
        <button onClick={onClose} className="btn-primary w-full">
          Done
        </button>
      </div>
    </div>
  );
}
