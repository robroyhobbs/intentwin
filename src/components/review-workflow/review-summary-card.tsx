"use client";

import { User } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface Reviewer {
  id: string;
  reviewer_id: string;
  full_name: string;
  email: string;
  status: string;
}

interface ReviewSummaryCardProps {
  reviewer: Reviewer;
  reviewCount: number;
  totalSections: number;
  avgScore: number | null;
}

// ── Status Helpers ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: "#94a3b8", label: "Pending" },
  in_progress: { color: "#ffaa00", label: "In Progress" },
  completed: { color: "#00ff88", label: "Completed" },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
}

// ── Component ──────────────────────────────────────────────────────────────

export function ReviewSummaryCard({
  reviewer,
  reviewCount,
  totalSections,
  avgScore,
}: ReviewSummaryCardProps) {
  const statusCfg = getStatusConfig(reviewer.status);
  const progress = totalSections > 0 ? (reviewCount / totalSections) * 100 : 0;

  const scoreColor =
    avgScore === null
      ? "var(--foreground-subtle)"
      : avgScore >= 80
        ? "var(--success)"
        : avgScore >= 60
          ? "var(--warning)"
          : "var(--danger)";

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4 space-y-3 hover:border-[var(--border-focus)] hover:border-opacity-30 transition-colors">
      {/* Header: Avatar, Name, Status */}
      <div className="flex items-start gap-3">
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--accent-subtle)" }}
        >
          <User className="h-4 w-4" style={{ color: "var(--accent)" }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[var(--foreground)] truncate">
            {reviewer.full_name}
          </div>
          <div className="text-[11px] text-[var(--foreground-subtle)] truncate">
            {reviewer.email}
          </div>
        </div>

        {/* Status dot + label */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: statusCfg.color }}
          />
          <span
            className="text-[10px] font-medium uppercase tracking-wider"
            style={{ color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--foreground-muted)]">
            Sections Reviewed
          </span>
          <span className="text-[11px] font-medium text-[var(--foreground)]">
            {reviewCount} / {totalSections}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[var(--background-tertiary)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor:
                progress >= 100 ? "var(--success)" : "var(--accent)",
            }}
          />
        </div>
      </div>

      {/* Average score badge */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-[var(--foreground-muted)]">
          Average Score
        </span>
        <span
          className="text-sm font-bold px-2.5 py-0.5 rounded-md"
          style={{
            color: scoreColor,
            backgroundColor:
              avgScore === null
                ? "var(--background-tertiary)"
                : avgScore >= 80
                  ? "var(--success-subtle)"
                  : avgScore >= 60
                    ? "var(--warning-subtle)"
                    : "var(--danger-subtle)",
          }}
        >
          {avgScore !== null ? avgScore.toFixed(1) : "--"}
        </span>
      </div>
    </div>
  );
}
