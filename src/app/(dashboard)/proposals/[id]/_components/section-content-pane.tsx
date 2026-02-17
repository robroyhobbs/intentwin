"use client";

import {
  Loader2,
  Clock,
  RefreshCw,
  Edit3,
  Eye,
  Wand2,
  ArrowRight,
} from "lucide-react";
import dynamic from "next/dynamic";
import { SectionStatusBadge } from "@/components/ui/section-status-badge";
import { SkeletonSection } from "@/components/ui/skeleton";
import { AgentationWrapper } from "@/components/review/agentation-wrapper";
import type { ProposalReview } from "@/types/review";
import type { Proposal, Section } from "./types";

const ProposalContentRenderer = dynamic(
  () =>
    import("@/components/proposal-content-renderer").then(
      (mod) => mod.ProposalContentRenderer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 text-xs text-[var(--foreground-subtle)] py-4">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
        Loading content...
      </div>
    ),
  },
);

const RichTextEditor = dynamic(
  () => import("@/components/ui/rich-text-editor").then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <SkeletonSection /> },
);

interface SectionContentPaneProps {
  currentSection: Section | undefined;
  editingSection: string | null;
  setEditingSection: (v: string | null) => void;
  editContent: string;
  setEditContent: (v: string) => void;
  savingSection: boolean;
  handleSaveEdit: (sectionId: string) => void;
  handleRegenerate: (sectionId: string) => void;
  regeneratingSection: string | null;
  handleApplyAIFixes: (sectionId: string) => void;
  applyingFixes: boolean;
  isReviewMode: boolean;
  openSectionReviews: ProposalReview[];
  proposal: Proposal;
  id: string;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  fetchProposal: () => Promise<void>;
  fetchReviews: () => Promise<void>;
}

export function SectionContentPane({
  currentSection,
  editingSection,
  setEditingSection,
  editContent,
  setEditContent,
  savingSection,
  handleSaveEdit,
  handleRegenerate,
  regeneratingSection,
  handleApplyAIFixes,
  applyingFixes,
  isReviewMode,
  openSectionReviews,
  proposal,
  id,
  authFetch,
  fetchProposal: _fetchProposal,
  fetchReviews,
}: SectionContentPaneProps) {
  if (!currentSection) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--foreground-muted)]">
        <ArrowRight className="h-6 w-6 mb-2" />
        <p className="text-sm">Select a section from the sidebar</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Section header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            {currentSection.title}
          </h2>
          <SectionStatusBadge
            generationStatus={
              currentSection.generation_status as
                | "pending"
                | "generating"
                | "completed"
                | "failed"
            }
          />
          {currentSection.is_edited && (
            <span className="badge badge-warning">Edited</span>
          )}
        </div>
        <div className="flex gap-2">
          {/* AI Auto-Fix button */}
          {isReviewMode &&
            openSectionReviews.length > 0 &&
            editingSection !== currentSection.id && (
              <button
                onClick={() => handleApplyAIFixes(currentSection.id)}
                disabled={applyingFixes}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--info)] bg-[var(--info-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--info)] hover:opacity-80 transition-all disabled:opacity-50"
              >
                {applyingFixes ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                Apply AI Fixes
                <span className="badge badge-info text-[10px]">
                  {openSectionReviews.length}
                </span>
              </button>
            )}

          {currentSection.generated_content &&
            editingSection !== currentSection.id && (
              <button
                onClick={() => {
                  setEditingSection(currentSection.id);
                  setEditContent(
                    currentSection.edited_content ||
                      currentSection.generated_content ||
                      "",
                  );
                }}
                className="btn-secondary text-xs py-1.5"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          {editingSection === currentSection.id && (
            <button
              onClick={() => setEditingSection(null)}
              className="btn-secondary text-xs py-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
          )}
          <button
            onClick={() => handleRegenerate(currentSection.id)}
            disabled={regeneratingSection === currentSection.id}
            className="btn-secondary text-xs py-1.5"
          >
            {regeneratingSection === currentSection.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {regeneratingSection === currentSection.id
              ? "Regenerating..."
              : proposal?.quality_review?.status === "completed" &&
                  proposal.quality_review.sections?.some(
                    (s) => s.section_id === currentSection.id,
                  )
                ? "Regenerate with Feedback"
                : "Regenerate"}
          </button>
        </div>
      </div>

      {/* Error */}
      {currentSection.generation_status === "failed" && (
        <div className="mb-6 rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-subtle)] p-4 text-sm text-[var(--danger)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Generation Failed</p>
              <p className="mt-1 text-xs opacity-80">
                {currentSection.generation_error}
              </p>
            </div>
            <button
              onClick={() => handleRegenerate(currentSection.id)}
              disabled={regeneratingSection === currentSection.id}
              className="btn-secondary text-xs py-1.5 shrink-0"
            >
              {regeneratingSection === currentSection.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {currentSection.generated_content ? (
        editingSection === currentSection.id ? (
          <div className="animate-fade-in">
            <RichTextEditor
              content={editContent}
              onChange={setEditContent}
              placeholder="Edit section content..."
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleSaveEdit(currentSection.id)}
                disabled={savingSection}
                className="btn-primary"
              >
                {savingSection ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
              <button
                onClick={() => setEditingSection(null)}
                disabled={savingSection}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : isReviewMode ? (
          <AgentationWrapper
            proposalId={id}
            sectionId={currentSection.id}
            authFetch={authFetch}
            onAnnotationAdded={() => fetchReviews()}
          >
            <div className="card p-6">
              <ProposalContentRenderer
                content={
                  currentSection.edited_content ||
                  currentSection.generated_content ||
                  ""
                }
                className="text-sm leading-relaxed text-[var(--foreground)]"
              />
            </div>
          </AgentationWrapper>
        ) : (
          <div className="card p-6">
            <ProposalContentRenderer
              content={
                currentSection.edited_content ||
                currentSection.generated_content ||
                ""
              }
              className="text-sm leading-relaxed text-[var(--foreground)]"
            />
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--foreground-muted)]">
          {currentSection.generation_status === "generating" ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-subtle)] mb-4">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
              </div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                Generating this section...
              </p>
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                AI is crafting your content
              </p>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--background-tertiary)] mb-4">
                <Clock className="h-6 w-6 text-[var(--foreground-muted)]" />
              </div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                Not yet generated
              </p>
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                Click Generate to create this section
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
