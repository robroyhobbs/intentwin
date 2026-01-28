"use client";

import { useState } from "react";
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { ProposalReview } from "@/types/review";

interface ReviewCommentsPanelProps {
  reviews: ProposalReview[];
  onResolve: (reviewId: string) => void;
  onDismiss: (reviewId: string) => void;
}

const TYPE_ICONS: Record<string, typeof MessageSquare> = {
  comment: MessageSquare,
  suggestion: MessageSquare,
  approval: ThumbsUp,
  rejection: XCircle,
};

export function ReviewCommentsPanel({
  reviews,
  onResolve,
  onDismiss,
}: ReviewCommentsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openReviews = reviews.filter((r) => r.status === "open");
  const closedReviews = reviews.filter((r) => r.status !== "open");

  return (
    <div className="space-y-2">
      {openReviews.length === 0 && closedReviews.length === 0 && (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 mb-3">
            <MessageSquare className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 font-medium">No comments yet</p>
          <p className="mt-1 text-[10px] text-gray-400">
            Select text to add annotations
          </p>
        </div>
      )}

      {openReviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          expanded={expandedId === review.id}
          onToggle={() =>
            setExpandedId(expandedId === review.id ? null : review.id)
          }
          onResolve={() => onResolve(review.id)}
          onDismiss={() => onDismiss(review.id)}
        />
      ))}

      {closedReviews.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors">
            {closedReviews.length} resolved/dismissed
          </summary>
          <div className="mt-2 space-y-2">
            {closedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                expanded={false}
                onToggle={() => {}}
                onResolve={() => {}}
                onDismiss={() => {}}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  expanded,
  onToggle,
  onResolve,
  onDismiss,
}: {
  review: ProposalReview;
  expanded: boolean;
  onToggle: () => void;
  onResolve: () => void;
  onDismiss: () => void;
}) {
  const Icon = TYPE_ICONS[review.annotation_type] || MessageSquare;
  const isOpen = review.status === "open";
  const isResolved = review.status === "resolved";

  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden transition-all duration-200 ${
        isOpen
          ? "border-amber-200/80 shadow-sm"
          : isResolved
            ? "border-emerald-200/60 opacity-60"
            : "border-gray-200/60 opacity-40"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-2.5 p-3.5 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div
          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md ${
            isOpen
              ? "bg-amber-100 text-amber-600"
              : isResolved
                ? "bg-emerald-100 text-emerald-600"
                : "bg-gray-100 text-gray-400"
          }`}
        >
          <Icon className="h-3 w-3" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
            {review.content}
          </p>
          <p className="mt-1.5 text-[10px] text-gray-400">
            {review.reviewer_email?.split("@")[0] || "Reviewer"} &middot;{" "}
            {new Date(review.created_at).toLocaleDateString()}
          </p>
        </div>
        {isOpen &&
          (expanded ? (
            <ChevronDown className="h-3 w-3 text-gray-300 mt-1" />
          ) : (
            <ChevronRight className="h-3 w-3 text-gray-300 mt-1" />
          ))}
      </button>

      {expanded && isOpen && (
        <div className="border-t border-gray-100 px-3.5 py-3 bg-gray-50/30">
          {review.selected_text && (
            <div className="mb-3 rounded-lg bg-amber-50/50 border border-amber-100 px-3 py-2">
              <p className="text-[10px] text-amber-700 italic line-clamp-2">
                &ldquo;{review.selected_text}&rdquo;
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={onResolve}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-all"
            >
              <CheckCircle2 className="h-3 w-3" />
              Resolve
            </button>
            <button
              onClick={onDismiss}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5 text-[10px] font-semibold text-gray-500 hover:bg-gray-100 transition-all"
            >
              <XCircle className="h-3 w-3" />
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
