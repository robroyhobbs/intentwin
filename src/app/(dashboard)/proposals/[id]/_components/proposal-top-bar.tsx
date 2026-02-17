"use client";

import type { ComponentType } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  Loader2,
  Download,
  MessageSquare,
  FileDown,
  Sparkles,
  ChevronRight,
  History,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionStatusBadge } from "@/components/ui/section-status-badge";
import type { ProposalReview, ReviewSummary } from "@/types/review";
import type { Proposal, Section } from "./types";

interface ProposalTopBarProps {
  proposal: Proposal;
  sections: Section[];
  id: string;
  isReviewMode: boolean;
  showReviewPanel: boolean;
  setShowReviewPanel: (v: boolean) => void;
  showVersionHistory: boolean;
  setShowVersionHistory: (v: boolean) => void;
  generating: boolean;
  handleGenerate: () => void;
  reviewSummary: ReviewSummary;
  completedCount: number;
  handleExportFeedback: () => void;
  reviews: ProposalReview[];
  fetchProposal: () => Promise<void>;
  router: AppRouterInstance;
  ReviewSummaryBar: ComponentType<{ summary: ReviewSummary }>;
  DealOutcomeSetter: ComponentType<{
    proposalId: string;
    currentOutcome?: string;
    currentValue?: number;
    onUpdate: () => void;
  }>;
}

export function ProposalTopBar({
  proposal,
  sections,
  id,
  isReviewMode,
  showReviewPanel,
  setShowReviewPanel,
  showVersionHistory,
  setShowVersionHistory,
  generating,
  handleGenerate,
  reviewSummary,
  completedCount,
  handleExportFeedback,
  reviews,
  fetchProposal,
  router,
  ReviewSummaryBar,
  DealOutcomeSetter,
}: ProposalTopBarProps) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--card-bg)] px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/proposals" },
              { label: proposal.title },
            ]}
          />
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xs text-[var(--foreground-muted)]">
              {(proposal.intake_data as Record<string, string>)
                ?.client_name || "Client"}
            </span>
            <ChevronRight className="h-3 w-3 text-[var(--foreground-subtle)]" />
            <SectionStatusBadge
              generationStatus={
                proposal.status as
                  | "pending"
                  | "generating"
                  | "completed"
                  | "failed"
              }
            />
          </div>
        </div>

        <div className="flex gap-2">
          {/* Deal Outcome Setter - shown for review/exported proposals */}
          {isReviewMode && (
            <DealOutcomeSetter
              proposalId={id}
              currentOutcome={proposal.deal_outcome}
              currentValue={proposal.deal_value}
              onUpdate={() => fetchProposal()}
            />
          )}

          {/* Version History Toggle */}
          <button
            onClick={() => setShowVersionHistory(!showVersionHistory)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              showVersionHistory
                ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]"
            }`}
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Versions</span>
          </button>

          {(proposal.status === "intake" || proposal.status === "draft") && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate Proposal
            </button>
          )}
          {isReviewMode && (
            <>
              <button
                onClick={() => setShowReviewPanel(!showReviewPanel)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  showReviewPanel
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-md"
                    : "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Review
                {reviewSummary.open > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      showReviewPanel
                        ? "bg-white/20 text-white"
                        : "bg-[var(--warning-subtle)] text-[var(--warning)]"
                    }`}
                  >
                    {reviewSummary.open}
                  </span>
                )}
              </button>
              {reviews.length > 0 && (
                <button
                  onClick={handleExportFeedback}
                  className="btn-secondary"
                >
                  <FileDown className="h-4 w-4" />
                  Feedback
                </button>
              )}
              <button
                onClick={() => router.push(`/proposals/${id}/export`)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--success)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-all"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </>
          )}
        </div>
      </div>

      {/* Review summary */}
      {isReviewMode && reviewSummary.total > 0 && (
        <div className="mt-4">
          <ReviewSummaryBar summary={reviewSummary} />
        </div>
      )}

      {/* Generation Progress */}
      {proposal.status === "generating" && (
        <div className="mt-4 rounded-lg border border-[var(--accent-muted)] bg-[var(--accent-subtle)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-subtle)]">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Generating proposal sections...
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {completedCount} of {sections.length || "..."} sections
                complete
              </p>
            </div>
            <span className="text-lg font-bold text-[var(--accent)]">
              {sections.length
                ? `${Math.round((completedCount / sections.length) * 100)}%`
                : "..."}
            </span>
          </div>
          <div className="mt-3 progress-bar h-2">
            <div
              className="progress-bar-fill"
              style={{
                width: sections.length
                  ? `${(completedCount / sections.length) * 100}%`
                  : "0%",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
