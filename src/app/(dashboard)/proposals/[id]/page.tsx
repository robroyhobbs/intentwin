"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import {
  ProposalStatus,
  GenerationStatus,
  ReviewStatus,
} from "@/lib/constants/statuses";
import { SectionNavSidebar } from "@/components/ui/section-nav-sidebar";
import { SkeletonSection } from "@/components/ui/skeleton";
import { DealOutcomeSetter } from "@/components/ui/deal-outcome-setter";
import type { ProposalReview, ReviewSummary } from "@/types/review";
import { exportAnnotationsAsMarkdown } from "@/lib/review/export-annotations";
import { extractPlaceholders } from "@/components/preflight/review-mode-sidebar";
import type { PreflightResult } from "@/lib/ai/pipeline/preflight";
import { logger } from "@/lib/utils/logger";
import {
  calculateRegenerationPollDelay,
  hasRegenerationTimedOut,
  isRegenerationTerminal,
  markSectionGenerating,
} from "@/lib/proposals/regeneration-poll";
import { startBackgroundGeneration } from "@/lib/proposals/background-generation";
import {
  startProposalGenerationPoll,
  type ProposalGenerationPollHandle,
} from "@/lib/proposals/proposal-generation-runner";

import type { Proposal, Section } from "./_components/types";
import { ProposalTopBar } from "./_components/proposal-top-bar";
import { TabBar } from "./_components/tab-bar";
import { SectionContentPane } from "./_components/section-content-pane";

// Dynamic imports for heavy components that are only shown conditionally
// (tab-based rendering). This reduces the initial page bundle by ~250-350KB.
const ReviewCommentsPanel = dynamic(
  () =>
    import("@/components/review/review-comments-panel").then(
      (m) => m.ReviewCommentsPanel,
    ),
  { ssr: false },
);
const ReviewSummaryBar = dynamic(
  () =>
    import("@/components/review/review-summary-bar").then(
      (m) => m.ReviewSummaryBar,
    ),
  { ssr: false },
);
const VersionHistory = dynamic(
  () =>
    import("@/components/proposals/version-history").then(
      (m) => m.VersionHistory,
    ),
  { ssr: false },
);
const QualityReport = dynamic(
  () =>
    import("@/components/proposals/quality-report").then(
      (m) => m.QualityReport,
    ),
  { ssr: false },
);
const ComplianceBoard = dynamic(
  () =>
    import("@/components/compliance/compliance-board").then(
      (m) => m.ComplianceBoard,
    ),
  { ssr: false },
);
const StageReviewDashboard = dynamic(
  () =>
    import("@/components/review-workflow/stage-review-dashboard").then(
      (m) => m.StageReviewDashboard,
    ),
  { ssr: false },
);
const ReviewModeSidebar = dynamic(
  () =>
    import("@/components/preflight/review-mode-sidebar").then(
      (m) => m.ReviewModeSidebar,
    ),
  { ssr: false },
);
const ReadinessReport = dynamic(
  () =>
    import("@/components/preflight/readiness-report").then(
      (m) => m.ReadinessReport,
    ),
  { ssr: false },
);

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
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(false);
  const [showPlaceholderPanel, setShowPlaceholderPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "sections" | "compliance" | "review"
  >(initialTab);
  const authFetch = useAuthFetch();
  const initialSectionSet = useRef(false);
  const regenPollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationPollHandleRef = useRef<ProposalGenerationPollHandle | null>(
    null,
  );

  const applyProposalSnapshot = useCallback(
    (data: { proposal: Proposal; sections?: Section[] }) => {
      setProposal(data.proposal);
      setSections(data.sections || []);

      if (!initialSectionSet.current && data.sections?.length) {
        const firstCompleted = data.sections.find(
          (section) =>
            section.generation_status === GenerationStatus.COMPLETED,
        );
        setActiveSection(firstCompleted?.id || data.sections[0].id);
        initialSectionSet.current = true;
      }
    },
    [],
  );

  const fetchProposal = useCallback(async () => {
    try {
      const response = await authFetch(`/api/proposals/${id}`);
      if (!response.ok) throw new Error("Failed to fetch proposal");
      const data = await response.json();
      applyProposalSnapshot(data);
    } catch (error) {
      logger.error("Failed to fetch proposal", error);
      toast.error("Failed to load proposal");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyProposalSnapshot, id]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- authFetch returns new ref each render
  }, [id]);

  const fetchPreflight = useCallback(async () => {
    setPreflightLoading(true);
    try {
      const response = await authFetch(`/api/proposals/${id}/preflight`);
      if (response.ok) {
        const data = await response.json();
        // Route returns { proposalId, status, gaps, summary } at top level
        setPreflight({
          status: data.status,
          gaps: data.gaps,
          summary: data.summary,
        });
      }
    } catch {
      // Preflight is non-blocking
    } finally {
      setPreflightLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  // Re-fetch when user returns to tab (catches completed generation while tab was inactive)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchProposal();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchProposal]);

  useEffect(() => {
    if (
      proposal?.status === ProposalStatus.REVIEW ||
      proposal?.status === ProposalStatus.EXPORTED
    ) {
      fetchReviews();
    }
  }, [proposal?.status, fetchReviews]);

  // Fetch preflight when proposal is ready to generate (draft, no sections)
  useEffect(() => {
    if (
      proposal &&
      sections.length === 0 &&
      proposal.status !== ProposalStatus.GENERATING
    ) {
      fetchPreflight();
    }
  }, [proposal, sections.length, fetchPreflight]);

  // Auto-show placeholder panel when generation completes (review mode)
  const proposalInReview =
    proposal?.status === ProposalStatus.REVIEW ||
    proposal?.status === ProposalStatus.EXPORTED;
  useEffect(() => {
    if (proposalInReview && sections.length > 0 && !showPlaceholderPanel) {
      const hasPlaceholders = extractPlaceholders(sections).length > 0;
      if (hasPlaceholders) {
        setShowPlaceholderPanel(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalInReview, sections]);

  useEffect(() => {
    generationPollHandleRef.current?.cancel();
    generationPollHandleRef.current = null;

    if (proposal?.status !== ProposalStatus.GENERATING) return;

    const handle = startProposalGenerationPoll<Section>({
      proposalId: id,
      fetchFn: authFetch,
      onSnapshot: (snapshot) => {
        if (snapshot.proposal) {
          applyProposalSnapshot({
            proposal: snapshot.proposal as Proposal,
            sections: (snapshot.sections as Section[] | undefined) ?? [],
          });
        }
      },
      onTimeout: async () => {
        await fetchProposal();
        toast.error(
          "Generation is taking longer than expected. Please refresh the page.",
        );
      },
    });
    generationPollHandleRef.current = handle;

    return () => {
      handle.cancel();
      if (generationPollHandleRef.current === handle) {
        generationPollHandleRef.current = null;
      }
    };
  }, [applyProposalSnapshot, authFetch, fetchProposal, id, proposal?.status]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await startBackgroundGeneration(id, authFetch);
      setProposal((prev) =>
        prev ? { ...prev, status: ProposalStatus.GENERATING } : null,
      );
      toast.success(
        result.status === "already-generating"
          ? "Proposal generation is already in progress"
          : "Proposal generation started",
      );
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
    if (regeneratingSection && regeneratingSection !== sectionId) {
      toast.error("Wait for the current section regeneration to finish.");
      return;
    }

    setRegeneratingSection(sectionId);
    setSections((prev) => markSectionGenerating(prev, sectionId));

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

      if (regenPollTimerRef.current) {
        clearTimeout(regenPollTimerRef.current);
        regenPollTimerRef.current = null;
      }

      const startedAt = Date.now();
      let pollCount = 0;

      const poll = async () => {
        try {
          const res = await authFetch(`/api/proposals/${id}`);
          if (!res.ok) {
            throw new Error(`Proposal refresh failed (${res.status})`);
          }
          const data = await res.json();
          setProposal(data.proposal);
          setSections(data.sections || []);
          const section = data.sections?.find(
            (s: Section) => s.id === sectionId,
          );
          if (section && isRegenerationTerminal(section.generation_status)) {
            setRegeneratingSection(null);
            if (regenPollTimerRef.current) {
              clearTimeout(regenPollTimerRef.current);
              regenPollTimerRef.current = null;
            }
            if (section.generation_status === GenerationStatus.COMPLETED) {
              toast.success("Section regenerated successfully");
            } else if (section.generation_status === GenerationStatus.FAILED) {
              toast.error("Section regeneration failed");
            }
            return;
          }
        } catch {
          // Polling error, will retry
        }

        pollCount++;
        if (hasRegenerationTimedOut(startedAt, Date.now())) {
          setRegeneratingSection(null);
          if (regenPollTimerRef.current) {
            clearTimeout(regenPollTimerRef.current);
            regenPollTimerRef.current = null;
          }
          toast.error(
            "Section regeneration is taking longer than expected. Please refresh the page.",
          );
          return;
        }

        regenPollTimerRef.current = setTimeout(
          poll,
          calculateRegenerationPollDelay(pollCount),
        );
      };

      void poll();
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
      generationPollHandleRef.current?.cancel();
      if (regenPollTimerRef.current) clearTimeout(regenPollTimerRef.current);
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
        body: JSON.stringify({
          review_id: reviewId,
          status: ReviewStatus.RESOLVED,
        }),
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
        body: JSON.stringify({
          review_id: reviewId,
          status: ReviewStatus.DISMISSED,
        }),
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
    proposal?.status === ProposalStatus.REVIEW ||
    proposal?.status === ProposalStatus.EXPORTED;
  const sectionReviews = currentSection
    ? reviews.filter((r) => r.section_id === currentSection.id || !r.section_id)
    : reviews;
  const openSectionReviews = sectionReviews.filter(
    (r) => r.status === ReviewStatus.OPEN,
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
        <p className="text-lg font-medium text-[var(--foreground)]">
          Proposal not found
        </p>
      </div>
    );
  }

  const completedCount = sections.filter(
    (s) => s.generation_status === GenerationStatus.COMPLETED,
  ).length;

  return (
    <div className="-m-6">
      {/* Top bar */}
      <ProposalTopBar
        proposal={proposal}
        sections={sections}
        id={id}
        isReviewMode={isReviewMode}
        showReviewPanel={showReviewPanel}
        setShowReviewPanel={setShowReviewPanel}
        showVersionHistory={showVersionHistory}
        setShowVersionHistory={setShowVersionHistory}
        generating={generating}
        handleGenerate={handleGenerate}
        reviewSummary={reviewSummary}
        completedCount={completedCount}
        handleExportFeedback={handleExportFeedback}
        reviews={reviews}
        fetchProposal={fetchProposal}
        router={router}
        ReviewSummaryBar={ReviewSummaryBar}
        DealOutcomeSetter={DealOutcomeSetter}
      />

      {/* Tab bar */}
      {sections.length > 0 && (
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
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

            <SectionContentPane
              currentSection={currentSection}
              editingSection={editingSection}
              setEditingSection={setEditingSection}
              editContent={editContent}
              setEditContent={setEditContent}
              savingSection={savingSection}
              handleSaveEdit={handleSaveEdit}
              handleRegenerate={handleRegenerate}
              regeneratingSection={regeneratingSection}
              handleApplyAIFixes={handleApplyAIFixes}
              applyingFixes={applyingFixes}
              isReviewMode={isReviewMode}
              openSectionReviews={openSectionReviews}
              proposal={proposal}
              id={id}
              authFetch={authFetch}
              fetchProposal={fetchProposal}
              fetchReviews={fetchReviews}
            />
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

          {/* Placeholder review mode panel */}
          {showPlaceholderPanel && (
            <div className="w-72 flex-shrink-0 border-l border-[var(--border)] bg-[var(--background-secondary)] overflow-y-auto animate-slide-in-right">
              <ReviewModeSidebar
                sections={sections}
                onNavigateToSection={(sectionId) => {
                  setActiveSection(sectionId);
                  setEditingSection(null);
                }}
              />
            </div>
          )}
        </div>
      ) : proposal.status === ProposalStatus.GENERATING ? (
        /* Generating but no sections created yet — show spinner */
        <div className="flex flex-col items-center justify-center py-24">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] mb-6">
            <Loader2 className="h-10 w-10 animate-spin text-[var(--accent)]" />
          </div>
          <h3 className="text-xl font-bold text-[var(--foreground)]">
            Preparing generation...
          </h3>
          <p className="mt-2 text-sm text-[var(--foreground-muted)] max-w-md text-center">
            Building pipeline context and creating section structure. This may
            take 30-60 seconds.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] mb-6">
            <Sparkles className="h-10 w-10 text-[var(--accent)]" />
          </div>
          <h3 className="text-xl font-bold text-[var(--foreground)]">
            Ready to generate
          </h3>
          <p className="mt-2 text-sm text-[var(--foreground-muted)] max-w-md text-center">
            Your proposal is configured. Click Generate to create all sections
            based on your intent and company context.
          </p>

          {/* Show generation error if previous attempt failed */}
          {proposal.generation_error && (
            <div className="mt-4 w-full max-w-lg rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                Previous generation failed
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-300/80 mt-1">
                {proposal.generation_error}
              </p>
            </div>
          )}

          {/* Preflight readiness report */}
          <div className="mt-6 w-full max-w-lg">
            <ReadinessReport
              preflight={preflight}
              loading={preflightLoading}
              onRetry={fetchPreflight}
              onUploadComplete={fetchPreflight}
            />
          </div>

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
      )}
    </div>
  );
}
