"use client";

import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ShieldCheck,
  X,
  Download,
} from "lucide-react";

interface UnaddressedRequirement {
  id: string;
  requirement_text: string;
  category: "mandatory" | "desirable" | "informational";
  compliance_status: string;
  suggested_section?: string | null;
}

interface ExportGateModalProps {
  proposalId: string;
  requirements: UnaddressedRequirement[];
  format: string;
  onExportAnyway: () => void;
  onCancel: () => void;
}

const CATEGORY_ORDER: Record<string, number> = {
  mandatory: 0,
  desirable: 1,
  informational: 2,
};

const CATEGORY_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  mandatory: {
    bg: "rgba(239, 68, 68, 0.1)",
    text: "#ef4444",
    label: "MANDATORY",
  },
  desirable: {
    bg: "rgba(234, 179, 8, 0.1)",
    text: "#eab308",
    label: "DESIRABLE",
  },
  informational: {
    bg: "rgba(59, 130, 246, 0.1)",
    text: "#3b82f6",
    label: "INFO",
  },
};

export function ExportGateModal({
  proposalId,
  requirements,
  format: _format,
  onExportAnyway,
  onCancel,
}: ExportGateModalProps) {
  const router = useRouter();

  const sorted = [...requirements].sort(
    (a, b) =>
      (CATEGORY_ORDER[a.category] ?? 2) - (CATEGORY_ORDER[b.category] ?? 2),
  );

  const mandatoryCount = requirements.filter(
    (r) => r.category === "mandatory",
  ).length;

  function handleAddressNow() {
    router.push(`/proposals/${proposalId}?tab=compliance`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="relative bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[var(--foreground)]">
              Unaddressed Requirements
            </h2>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
              {requirements.length} requirement
              {requirements.length !== 1 ? "s" : ""} not yet addressed
              {mandatoryCount > 0 && (
                <span className="text-[var(--danger)] font-medium">
                  {" "}
                  ({mandatoryCount} mandatory)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Requirements List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sorted.map((req) => {
            const cat =
              CATEGORY_STYLES[req.category] || CATEGORY_STYLES.desirable;
            const truncated =
              req.requirement_text.length > 120
                ? req.requirement_text.slice(0, 120) + "..."
                : req.requirement_text;

            return (
              <div
                key={req.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-3"
              >
                <div className="flex items-start gap-2">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                    style={{ backgroundColor: cat.bg, color: cat.text }}
                  >
                    {cat.label}
                  </span>
                  <p className="text-xs text-[var(--foreground)] leading-relaxed">
                    {truncated}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-[var(--border)] flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAddressNow}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            <ShieldCheck className="h-4 w-4" />
            Address Now
          </button>
          <button
            onClick={onExportAnyway}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Anyway
          </button>
          <button
            onClick={onCancel}
            className="ml-auto text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
