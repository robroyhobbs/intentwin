"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  ShieldCheck,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
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
import { SectionNavSidebar } from "@/components/ui/section-nav-sidebar";
import { SectionStatusBadge } from "@/components/ui/section-status-badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { SkeletonSection } from "@/components/ui/skeleton";
import { AgentationWrapper } from "@/components/review/agentation-wrapper";
import { ReviewCommentsPanel } from "@/components/review/review-comments-panel";
import { ReviewSummaryBar } from "@/components/review/review-summary-bar";
import { VersionHistory } from "@/components/proposals/version-history";
import { QualityReport } from "@/components/proposals/quality-report";
import { DealOutcomeSetter } from "@/components/ui/deal-outcome-setter";
import { ComplianceBoard } from "@/components/compliance/compliance-board";
import { StageReviewDashboard } from "@/components/review-workflow/stage-review-dashboard";
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

interface QualityReviewSection {
  section_id: string;
  score: number;
}

interface Proposal {
  id: string;
  title: string;
  status: string;
  intake_data: Record<string, unknown>;
  created_at: string;
  deal_outcome?: string;
  deal_value?: number;
  quality_review?: {
    status: string;
    sections?: QualityReviewSection[];
  } | null;
}

export default function ProposalPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const tabParam = searchParams.get("tab");
  const initialTab =
    tabParam === "compliance"
      ? "compliance"
      : tabParam === "review"
        ? "review"
        : "sections";

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
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(
    null,
  );
  const [savingSection, setSavingSection] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "sections" | "compliance" | "review"
  >(initialTab);
  const authFetch = useAuthFetch();
  const initialSectionSet = useRef(false);
  const regenIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchProposal = useCallback(async () => {
    try {
      const response = await authFetch(`/api/proposals/${id}`);
      if (!response.ok) throw new Error("Failed to fetch proposal");
      const data = await response.json();
      setProposal(data.proposal);
      setSections(data.sections || []);

      // Only set initial active section once
      if (!initialSectionSet.current && data.sections?.length > 0) {
        const firstCompleted = data.sections?.find(
          (s: Section) => s.generation_status === "completed",
        );
        setActiveSection(firstCompleted?.id || data.sections[0].id);
        initialSectionSet.current = true;
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load proposal");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
          },
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

  // Poll during generation with a 10-minute timeout safety net
  useEffect(() => {
    if (proposal?.status !== "generating") return;
    const startedAt = Date.now();
    const MAX_POLL_MS = 10 * 60 * 1000; // 10 minutes

    const interval = setInterval(() => {
      if (Date.now() - startedAt > MAX_POLL_MS) {
        clearInterval(interval);
        toast.error(
          "Generation appears to have stalled. Please refresh or try again.",
        );
        // Force-refresh once more to pick up any status change we missed
        fetchProposal();
        return;
      }
      fetchProposal();
    }, 3000);
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
      setProposal((prev) => (prev ? { ...prev, status: "generating" } : null));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveEdit(sectionId: string) {
    setSavingSection(true);
    try {
      const response = await authFetch(
        `/api/proposals/${id}/sections/${sectionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ edited_content: editContent }),
        },
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Save failed");
      }
      toast.success("Changes saved");
      setEditingSection(null);
      fetchProposal();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save changes",
      );
    } finally {
      setSavingSection(false);
    }
  }

  async function handleRegenerate(sectionId: string) {
    setRegeneratingSection(sectionId);
    try {
      const response = await authFetch(
        `/api/proposals/${id}/sections/${sectionId}/regenerate`,
        { method: "POST" },
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Regeneration failed");
      }
      toast.success("Regenerating section...");
      // Poll until section is no longer generating
      if (regenIntervalRef.current) clearInterval(regenIntervalRef.current);
      regenIntervalRef.current = setInterval(async () => {
        try {
          const res = await authFetch(`/api/proposals/${id}`);
          if (!res.ok) return;
          const data = await res.json();
          setProposal(data.proposal);
          setSections(data.sections || []);
          const section = data.sections?.find(
            (s: Section) => s.id === sectionId,
          );
          if (section && section.generation_status !== "generating") {
            setRegeneratingSection(null);
            if (regenIntervalRef.current) {
              clearInterval(regenIntervalRef.current);
              regenIntervalRef.current = null;
            }
            if (section.generation_status === "completed") {
              toast.success("Section regenerated successfully");
            } else if (section.generation_status === "failed") {
              toast.error("Section regeneration failed");
            }
          }
        } catch {
          // Polling error, will retry
        }
      }, 3000);
    } catch (error) {
      setRegeneratingSection(null);
      toast.error(
        error instanceof Error ? error.message : "Regeneration failed",
      );
    }
  }

  // Cleanup regen polling on unmount
  useEffect(() => {
    return () => {
      if (regenIntervalRef.current) clearInterval(regenIntervalRef.current);
    };
  }, []);

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
      toast.error(error instanceof Error ? error.message : "Auto-fix failed");
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
      sections.map((s) => ({ id: s.id, title: s.title })),
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
    ? reviews.filter((r) => r.section_id === currentSection.id || !r.section_id)
    : reviews;
  const openSectionReviews = sectionReviews.filter((r) => r.status === "open");

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
        <p className="text-lg font-medium text-[var(--foreground)]">
          Proposal not found
        </p>
      </div>
    );
  }

  const completedCount = sections.filter(
    (s) => s.generation_status === "completed",
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

      {/* Tab bar */}
      {sections.length > 0 && (
        <div className="border-b border-[var(--border)] bg-[var(--card-bg)] px-6 flex gap-1">
          <button
            onClick={() => setActiveTab("sections")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "sections"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
            Sections
          </button>
          <button
            onClick={() => setActiveTab("compliance")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "compliance"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
            Compliance
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "review"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Eye className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
            Review
          </button>
        </div>
      )}

      {/* Review tab content */}
      {sections.length > 0 && activeTab === "review" ? (
        <div
          style={{ minHeight: "calc(100vh - 220px)" }}
          className="bg-[var(--background-secondary)]"
        >
          <StageReviewDashboard
            proposalId={id}
            sections={sections.map((s) => ({
              id: s.id,
              title: s.title,
              section_type: s.section_type,
            }))}
          />
        </div>
      ) : /* Compliance tab content */
      sections.length > 0 && activeTab === "compliance" ? (
        <div
          style={{ minHeight: "calc(100vh - 220px)" }}
          className="bg-[var(--background-secondary)]"
        >
          <ComplianceBoard
            proposalId={id}
            sections={sections.map((s) => ({
              id: s.id,
              title: s.title,
              section_type: s.section_type,
            }))}
          />
        </div>
      ) : /* Split-pane layout */
      sections.length > 0 ? (
        <div className="flex" style={{ minHeight: "calc(100vh - 180px)" }}>
          {/* Section nav sidebar */}
          <SectionNavSidebar
            sections={sections}
            activeSection={activeSection}
            onSelect={(sectionId) => {
              if (editingSection) {
                const discard = window.confirm(
                  "You have unsaved edits. Discard changes?",
                );
                if (!discard) return;
              }
              setActiveSection(sectionId);
              setEditingSection(null);
            }}
          />

          {/* Content pane */}
          <div className="flex-1 overflow-y-auto bg-[var(--background-secondary)]">
            {/* Quality Report */}
            <div className="px-8 pt-6 max-w-4xl mx-auto">
              <QualityReport
                proposalId={id}
                proposalStatus={proposal?.status}
              />
            </div>

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
              Your proposal is configured. Click Generate to start creating all
              sections with AI-powered content.
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
