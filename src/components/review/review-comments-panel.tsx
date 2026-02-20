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
import { ReviewStatus } from "@/lib/constants/statuses";

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

  const openReviews = reviews.filter((r) => r.status === ReviewStatus.OPEN);
  const closedReviews = reviews.filter((r) => r.status !== ReviewStatus.OPEN);

  return (
    <div className="space-y-2">
      {openReviews.length === 0 && closedReviews.length === 0 && (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--background-tertiary)] mb-3">
            <MessageSquare className="h-5 w-5 text-[var(--foreground-subtle)]" />
          </div>
          <p className="text-xs text-[var(--foreground-muted)] font-medium">No comments yet</p>
          <p className="mt-1 text-[10px] text-[var(--foreground-subtle)]">
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
          <summary className="cursor-pointer text-[11px] font-medium text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)] transition-colors">
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
  const isOpen = review.status === ReviewStatus.OPEN;
  const isResolved = review.status === ReviewStatus.RESOLVED;

  return (
    <div
      className={`rounded-xl border bg-[var(--card-bg)] overflow-hidden transition-all duration-200 ${
        isOpen
          ? "border-[var(--warning-subtle)] shadow-sm"
          : isResolved
            ? "border-[var(--success-subtle)] opacity-60"
            : "border-[var(--border)] opacity-40"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-2.5 p-3.5 text-left hover:bg-[var(--background-secondary)] transition-colors"
      >
        <div
          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md ${
            isOpen
              ? "bg-[var(--warning-subtle)] text-[var(--warning)]"
              : isResolved
                ? "bg-[var(--success-subtle)] text-[var(--success)]"
                : "bg-[var(--background-tertiary)] text-[var(--foreground-subtle)]"
          }`}
        >
          <Icon className="h-3 w-3" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed line-clamp-2">
            {review.content}
          </p>
          <p className="mt-1.5 text-[10px] text-[var(--foreground-subtle)]">
            {review.reviewer_email?.split("@")[0] || "Reviewer"} &middot;{" "}
            {new Date(review.created_at).toLocaleDateString()}
          </p>
        </div>
        {isOpen &&
          (expanded ? (
            <ChevronDown className="h-3 w-3 text-[var(--foreground-subtle)] mt-1" />
          ) : (
            <ChevronRight className="h-3 w-3 text-[var(--foreground-subtle)] mt-1" />
          ))}
      </button>

      {expanded && isOpen && (
        <div className="border-t border-[var(--border-subtle)] px-3.5 py-3 bg-[var(--background-secondary)]">
          {review.selected_text && (
            <div className="mb-3 rounded-lg bg-[var(--warning-subtle)] border border-[var(--warning-subtle)] px-3 py-2">
              <p className="text-[10px] text-[var(--warning)] italic line-clamp-2">
                &ldquo;{review.selected_text}&rdquo;
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={onResolve}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--success-subtle)] border border-[var(--success-subtle)] px-3 py-1.5 text-[10px] font-semibold text-[var(--success)] hover:opacity-80 transition-all"
            >
              <CheckCircle2 className="h-3 w-3" />
              Resolve
            </button>
            <button
              onClick={onDismiss}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] px-3 py-1.5 text-[10px] font-semibold text-[var(--foreground-muted)] hover:opacity-80 transition-all"
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
