"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Clock,
  RefreshCw,
  Download,
  Edit3,
  Eye,
  MessageSquare,
  FileDown,
  Sparkles,
  Wand2,
  ArrowRight,
  ChevronRight,
  History,
} from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { ProposalContentRenderer } from "@/components/proposal-content-renderer";
import { SectionNavSidebar } from "@/components/ui/section-nav-sidebar";
import { SectionStatusBadge } from "@/components/ui/section-status-badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { SkeletonSection } from "@/components/ui/skeleton";
import { AgentationWrapper } from "@/components/review/agentation-wrapper";
import { ReviewCommentsPanel } from "@/components/review/review-comments-panel";
import { ReviewSummaryBar } from "@/components/review/review-summary-bar";
import { VersionHistory } from "@/components/proposals/version-history";
import { DealOutcomeSetter } from "@/components/ui/deal-outcome-setter";
import type { ProposalReview, ReviewSummary } from "@/types/review";
import { exportAnnotationsAsMarkdown } from "@/lib/review/export-annotations";

interface Section {
  id: string;
  section_type: string;
  title: string;
  section_order: number;
  generated_content: string | null;
  edited_content: string | null;
  is_edited: boolean;
  generation_status: string;
  generation_error: string | null;
  review_status: string;
}

interface Proposal {
  id: string;
  title: string;
  status: string;
  intake_data: Record<string, unknown>;
  created_at: string;
  deal_outcome?: string;
  deal_value?: number;
}

export default function ProposalPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [reviews, setReviews] = useState<ProposalReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary>({
    total: 0,
    open: 0,
    resolved: 0,
    dismissed: 0,
    approvals: 0,
  });
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [applyingFixes, setApplyingFixes] = useState(false);
  const authFetch = useAuthFetch();

  const fetchProposal = useCallback(async () => {
    try {
      const response = await authFetch(`/api/proposals/${id}`);
      if (!response.ok) throw new Error("Failed to fetch proposal");
      const data = await response.json();
      setProposal(data.proposal);
      setSections(data.sections || []);

      if (!activeSection) {
        const firstCompleted = data.sections?.find(
          (s: Section) => s.generation_status === "completed"
        );
        if (firstCompleted) setActiveSection(firstCompleted.id);
        else if (data.sections?.length > 0)
          setActiveSection(data.sections[0].id);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load proposal");
    } finally {
      setLoading(false);
    }
  }, [id, activeSection]);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await authFetch(`/api/proposals/${id}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setReviewSummary(
          data.summary || {
            total: 0,
            open: 0,
            resolved: 0,
            dismissed: 0,
            approvals: 0,
          }
        );
      }
    } catch {
      // Reviews are optional
    }
  }, [id]);

  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  useEffect(() => {
    if (proposal?.status === "review" || proposal?.status === "exported") {
      fetchReviews();
    }
  }, [proposal?.status, fetchReviews]);

  useEffect(() => {
    if (proposal?.status !== "generating") return;
    const interval = setInterval(fetchProposal, 3000);
    return () => clearInterval(interval);
  }, [proposal?.status, fetchProposal]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const response = await authFetch(`/api/proposals/${id}/generate`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Generation failed");
      }
      toast.success("Proposal generation started");
      setProposal((prev) =>
        prev ? { ...prev, status: "generating" } : null
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Generation failed"
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveEdit(sectionId: string) {
    try {
      await authFetch(`/api/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      toast.success("Changes saved");
      setEditingSection(null);
      fetchProposal();
    } catch {
      toast.error("Failed to save changes");
    }
  }

  async function handleApplyAIFixes(sectionId: string) {
    setApplyingFixes(true);
    try {
      const response = await authFetch(`/api/proposals/${id}/auto-fix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Auto-fix failed");
      }
      const data = await response.json();
      toast.success(`${data.resolvedCount || 0} comments resolved by AI`);
      fetchProposal();
      fetchReviews();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Auto-fix failed"
      );
    } finally {
      setApplyingFixes(false);
    }
  }

  async function handleResolveReview(reviewId: string) {
    try {
      await authFetch(`/api/proposals/${id}/reviews`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: reviewId, status: "resolved" }),
      });
      fetchReviews();
    } catch {
      toast.error("Failed to update review");
    }
  }

  async function handleDismissReview(reviewId: string) {
    try {
      await authFetch(`/api/proposals/${id}/reviews`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: reviewId, status: "dismissed" }),
      });
      fetchReviews();
    } catch {
      toast.error("Failed to update review");
    }
  }

  function handleExportFeedback() {
    if (!proposal) return;
    const md = exportAnnotationsAsMarkdown(
      proposal.title,
      reviews,
      sections.map((s) => ({ id: s.id, title: s.title }))
    );
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${proposal.title.replace(/[^a-zA-Z0-9]/g, "_")}_feedback.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const currentSection = sections.find((s) => s.id === activeSection);
  const isReviewMode =
    proposal?.status === "review" || proposal?.status === "exported";
  const sectionReviews = currentSection
    ? reviews.filter(
        (r) => r.section_id === currentSection.id || !r.section_id
      )
    : reviews;
  const openSectionReviews = sectionReviews.filter(
    (r) => r.status === "open"
  );

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonSection key={i} />
        ))}
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[var(--foreground-muted)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--background-tertiary)] mb-4">
          <Sparkles className="h-8 w-8" />
        </div>
        <p className="text-lg font-medium text-[var(--foreground)]">Proposal not found</p>
      </div>
    );
  }

  const completedCount = sections.filter(
    (s) => s.generation_status === "completed"
  ).length;

  return (
    <div className="-m-6">
      {/* Top bar */}
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
                {(proposal.intake_data as Record<string, string>)?.client_name ||
                  "Client"}
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

            {(proposal.status === "intake" ||
              proposal.status === "draft") && (
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
                      ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Review
                  {reviewSummary.open > 0 && (
                    <span className="badge badge-warning text-[10px]">
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
                  {completedCount} of {sections.length || "..."} sections complete
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

      {/* Split-pane layout */}
      {sections.length > 0 ? (
        <div
          className="flex"
          style={{ minHeight: "calc(100vh - 180px)" }}
        >
          {/* Section nav sidebar */}
          <SectionNavSidebar
            sections={sections}
            activeSection={activeSection}
            onSelect={(sectionId) => {
              setActiveSection(sectionId);
              setEditingSection(null);
            }}
          />

          {/* Content pane */}
          <div className="flex-1 overflow-y-auto bg-[var(--background-secondary)]">
            {currentSection ? (
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
                      <span className="badge badge-warning">
                        Edited
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {/* AI Auto-Fix button */}
                    {isReviewMode &&
                      openSectionReviews.length > 0 &&
                      editingSection !== currentSection.id && (
                        <button
                          onClick={() =>
                            handleApplyAIFixes(currentSection.id)
                          }
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
                                ""
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
                    <button className="btn-secondary text-xs py-1.5">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Regenerate
                    </button>
                  </div>
                </div>

                {/* Error */}
                {currentSection.generation_status === "failed" && (
                  <div className="mb-6 rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-subtle)] p-4 text-sm text-[var(--danger)]">
                    <p className="font-semibold">Generation Failed</p>
                    <p className="mt-1 text-xs opacity-80">
                      {currentSection.generation_error}
                    </p>
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
                          onClick={() =>
                            handleSaveEdit(currentSection.id)
                          }
                          className="btn-primary"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingSection(null)}
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
                        <p className="text-sm font-medium text-[var(--foreground)]">Generating this section...</p>
                        <p className="mt-1 text-xs text-[var(--foreground-muted)]">AI is crafting your content</p>
                      </>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--background-tertiary)] mb-4">
                          <Clock className="h-6 w-6 text-[var(--foreground-muted)]" />
                        </div>
                        <p className="text-sm font-medium text-[var(--foreground)]">Not yet generated</p>
                        <p className="mt-1 text-xs text-[var(--foreground-muted)]">Click Generate to create this section</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--foreground-muted)]">
                <ArrowRight className="h-6 w-6 mb-2" />
                <p className="text-sm">Select a section from the sidebar</p>
              </div>
            )}
          </div>

          {/* Review comments panel */}
          {showReviewPanel && isReviewMode && (
            <div className="w-80 flex-shrink-0 border-l border-[var(--border)] bg-[var(--background-secondary)] overflow-y-auto animate-slide-in-right">
              <div className="p-5 border-b border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--foreground)]">
                    Comments
                  </h3>
                  <span className="badge badge-default">
                    {sectionReviews.length}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <ReviewCommentsPanel
                  reviews={sectionReviews}
                  onResolve={handleResolveReview}
                  onDismiss={handleDismissReview}
                />
              </div>
            </div>
          )}

          {/* Version history panel */}
          {showVersionHistory && (
            <div className="w-80 flex-shrink-0 border-l border-[var(--border)] bg-[var(--background-secondary)] overflow-y-auto animate-slide-in-right">
              <div className="p-4">
                <VersionHistory
                  proposalId={id}
                  onRestore={() => {
                    fetchProposal();
                    fetchReviews();
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        proposal.status !== "generating" && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] mb-6">
              <Sparkles className="h-10 w-10 text-[var(--accent)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--foreground)]">
              Ready to generate
            </h3>
            <p className="mt-2 text-sm text-[var(--foreground-muted)] max-w-md text-center">
              Your proposal is configured. Click Generate to start creating all sections with AI-powered content.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary mt-6"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate Proposal
            </button>
          </div>
        )
      )}
    </div>
  );
}
