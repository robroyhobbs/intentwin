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
  Database,
  AlertTriangle,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionStatusBadge } from "@/components/ui/section-status-badge";
import type { ProposalReview, ReviewSummary } from "@/types/review";
import type { Proposal, Section, L1Summary } from "./types";

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

      {/* Generation partial failure warning */}
      {proposal.generation_error && proposal.status !== "generating" && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 flex-shrink-0">
              <span className="text-amber-600 text-sm font-bold">!</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                Partial Generation
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-300/80 mt-0.5">
                {proposal.generation_error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* L1 Data Health Indicator */}
      {proposal.l1_summary && proposal.status !== "generating" && (
        <L1HealthBadge l1={proposal.l1_summary} />
      )}
      {!proposal.l1_summary && (proposal.status === "review" || proposal.status === "exported") && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>L1 data unknown — proposal was generated before tracking was enabled</span>
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

// ── L1 Health Badge ────────────────────────────────────────────────────────

function L1HealthBadge({ l1 }: { l1: L1Summary }) {
  const total = l1.companyContextCount + l1.productContextCount + l1.evidenceCount;
  const isEmpty = total === 0;

  if (isEmpty) {
    return (
      <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            No company data was available during generation.
          </span>
          <span className="text-xs text-amber-600/70 dark:text-amber-300/70">
            Add company context, products, and evidence in Settings to improve proposal quality.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
      <Database className="h-3.5 w-3.5 text-[var(--success)]" />
      <span>
        Grounded by {l1.evidenceCount} evidence
        {l1.evidenceCount !== 1 ? " entries" : " entry"},
        {" "}{l1.productContextCount} product{l1.productContextCount !== 1 ? "s" : ""},
        {" "}{l1.companyContextCount} company fact{l1.companyContextCount !== 1 ? "s" : ""}
      </span>
      {l1.staticSourcesIncluded && (
        <span className="text-[var(--foreground-subtle)]">+ static sources</span>
      )}
    </div>
  );
}
