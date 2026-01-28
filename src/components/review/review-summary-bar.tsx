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
    <div className="flex items-center gap-5 rounded-xl glass border border-gray-200/50 px-5 py-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Review
      </span>

      <div className="h-4 w-px bg-gray-200" />

      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>{summary.open} open</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>{summary.resolved} resolved</span>
      </div>

      {summary.approvals > 0 && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0070AD]">
          <ThumbsUp className="h-3.5 w-3.5" />
          <span>{summary.approvals} approvals</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <MessageSquare className="h-3.5 w-3.5" />
        <span>{summary.total} total</span>
      </div>
    </div>
  );
}
