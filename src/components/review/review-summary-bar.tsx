"use client";

import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
} from "lucide-react";
import type { ReviewSummary } from "@/types/review";

interface ReviewSummaryBarProps {
  summary: ReviewSummary;
}

export function ReviewSummaryBar({ summary }: ReviewSummaryBarProps) {
  if (summary.total === 0) return null;

  return (
    <div className="flex items-center gap-5 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] px-5 py-3 shadow-sm">
      <span className="tiny-label">
        Review
      </span>

      <div className="divider-vertical h-4" />

      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--warning)]">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>{summary.open} open</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--success)]">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>{summary.resolved} resolved</span>
      </div>

      {summary.approvals > 0 && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent)]">
          <ThumbsUp className="h-3.5 w-3.5" />
          <span>{summary.approvals} approvals</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]">
        <MessageSquare className="h-3.5 w-3.5" />
        <span>{summary.total} total</span>
      </div>
    </div>
  );
}
