"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { RemediationEntry, SectionReview } from "./types";
import { formatSectionType } from "./helpers";

interface RemediationLogProps {
  remediation: RemediationEntry[];
  sections: SectionReview[];
}

export function RemediationLog({ remediation, sections }: RemediationLogProps) {
  if (remediation.length === 0) return null;

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
        Auto-Improvements
      </h4>
      {remediation.map((entry, i) => {
        const improved = entry.new_score > entry.original_score;
        return (
          <div
            key={i}
            className="flex items-center justify-between px-3 py-2 border border-[var(--border)] rounded-lg text-xs"
          >
            <div className="flex items-center gap-2">
              {improved ? (
                <CheckCircle2 className="h-3 w-3 text-[var(--success)]" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-[var(--warning, #f59e0b)]" />
              )}
              <span className="text-[var(--foreground)]">
                {formatSectionType(
                  sections.find(
                    (s) => s.section_id === entry.section_id,
                  )?.section_type || entry.section_id,
                )}
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono">
              <span className="text-[var(--danger)]">
                {entry.original_score}
              </span>
              <span className="text-[var(--foreground-muted)]">&rarr;</span>
              <span
                style={{
                  color: improved
                    ? "var(--success)"
                    : "var(--warning, #f59e0b)",
                }}
              >
                {entry.new_score}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
