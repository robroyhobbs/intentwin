"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  PlayCircle,
  ArrowRight,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { ReviewStageStatus, StageReviewerStatus } from "@/lib/constants/statuses";
import { ReviewStageTracker } from "./review-stage-tracker";
import { ReviewerAssignment } from "./reviewer-assignment";
import { SectionReviewForm } from "./section-review-form";
import { ReviewSummaryCard } from "./review-summary-card";
import { AdvanceGateModal } from "./advance-gate-modal";

// ── Types ──────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  title: string;
  section_type: string;
}

interface Stage {
  id: string;
  stage: string;
  status: string;
  stage_order: number;
}

interface Reviewer {
  id: string;
  reviewer_id: string;
  full_name: string;
  email: string;
  status: string;
}

interface ReviewEntry {
  id: string;
  section_id: string;
  reviewer_id: string;
  score: number | null;
  comment: string | null;
  strengths: string | null;
  weaknesses: string | null;
  recommendations: string | null;
}

interface StageDetail {
  stage: Stage;
  reviewers: Reviewer[];
  reviews: ReviewEntry[];
}

interface StageReviewDashboardProps {
  proposalId: string;
  sections: Section[];
}

// ── Score Cell Helpers ─────────────────────────────────────────────────────

function getScoreColor(score: number | null): string {
  if (score === null) return "var(--foreground-subtle)";
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "var(--warning)";
  return "var(--danger)";
}

function computeAverage(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => s !== null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

// ── Component ──────────────────────────────────────────────────────────────

export function StageReviewDashboard({
  proposalId,
  sections,
}: StageReviewDashboardProps) {
  const authFetch = useAuthFetch();
  const [stages, setStages] = useState<Stage[]>([]);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [stageDetail, setStageDetail] = useState<StageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);

  // ── Fetch stages ─────────────────────────────────────────────────────────

  const fetchStages = useCallback(async () => {
    try {
      const res = await authFetch(`/api/proposals/${proposalId}/review-stages`);
      if (!res.ok) throw new Error("Failed to load stages");
      const data = await res.json();
      const stageList: Stage[] = data.stages ?? data ?? [];
      setStages(stageList);

      // Auto-select the active (or first non-completed) stage
      const active =
        stageList.find((s) => s.status === ReviewStageStatus.ACTIVE) ??
        stageList.find((s) => s.status !== ReviewStageStatus.COMPLETED) ??
        stageList[stageList.length - 1] ??
        null;
      setActiveStageId(active?.id ?? null);
    } catch {
      // Could be 404 if no stages exist yet
      setStages([]);
      setActiveStageId(null);
    } finally {
      setLoading(false);
    }
  }, [authFetch, proposalId]);

  // ── Fetch stage detail ───────────────────────────────────────────────────

  const fetchStageDetail = useCallback(async () => {
    if (!activeStageId) {
      setStageDetail(null);
      return;
    }
    try {
      const res = await authFetch(
        `/api/proposals/${proposalId}/review-stages/${activeStageId}`,
      );
      if (!res.ok) throw new Error("Failed to load stage detail");
      const data = await res.json();
      setStageDetail({
        stage: data.stage ?? stages.find((s) => s.id === activeStageId)!,
        reviewers: data.reviewers ?? [],
        reviews: data.reviews ?? [],
      });
    } catch {
      setStageDetail(null);
    }
  }, [authFetch, proposalId, activeStageId, stages]);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  useEffect(() => {
    if (activeStageId) {
      fetchStageDetail();
    }
  }, [activeStageId, fetchStageDetail]);

  // ── Initialize stages ────────────────────────────────────────────────────

  const handleInitialize = async () => {
    setInitializing(true);
    try {
      const res = await authFetch(
        `/api/proposals/${proposalId}/review-stages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to initialize review stages");
      }
      toast.success("Color Team Review stages initialized");
      await fetchStages();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Initialization failed");
    } finally {
      setInitializing(false);
    }
  };

  // ── Refresh handler ──────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    await fetchStages();
    await fetchStageDetail();
  }, [fetchStages, fetchStageDetail]);

  // ── Build review matrix data ─────────────────────────────────────────────

  const reviewers = stageDetail?.reviewers ?? [];
  const reviews = stageDetail?.reviews ?? [];

  // Map: sectionId -> reviewerId -> ReviewEntry
  const reviewMatrix = new Map<string, Map<string, ReviewEntry>>();
  for (const review of reviews) {
    if (!reviewMatrix.has(review.section_id)) {
      reviewMatrix.set(review.section_id, new Map());
    }
    reviewMatrix.get(review.section_id)!.set(review.reviewer_id, review);
  }

  // Per-section averages
  const sectionAverages = new Map<string, number | null>();
  for (const section of sections) {
    const scores = reviewers.map(
      (r) => reviewMatrix.get(section.id)?.get(r.reviewer_id)?.score ?? null,
    );
    sectionAverages.set(section.id, computeAverage(scores));
  }

  // Per-reviewer stats
  const reviewerStats = new Map<
    string,
    { count: number; avgScore: number | null }
  >();
  for (const reviewer of reviewers) {
    const rReviews = reviews.filter(
      (r) => r.reviewer_id === reviewer.reviewer_id,
    );
    const avg = computeAverage(rReviews.map((r) => r.score));
    reviewerStats.set(reviewer.reviewer_id, {
      count: rReviews.length,
      avgScore: avg,
    });
  }

  // Active stage object
  const activeStage = stages.find((s) => s.id === activeStageId) ?? null;

  // Gate criteria summary
  const overallAvg = computeAverage(
    Array.from(sectionAverages.values()).filter((v): v is number => v !== null),
  );
  const sectionsWithReviews = sections.filter(
    (s) => reviewMatrix.has(s.id) && (reviewMatrix.get(s.id)?.size ?? 0) > 0,
  ).length;
  const allReviewersComplete = reviewers.every((r) => r.status === StageReviewerStatus.COMPLETED);

  // ── Loading State ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--foreground-muted)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading review stages...
      </div>
    );
  }

  // ── No Stages: Initialize ────────────────────────────────────────────────

  if (stages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--card-bg)] p-10 text-center space-y-4">
        <BarChart3 className="h-10 w-10 mx-auto text-[var(--foreground-subtle)]" />
        <div>
          <h3 className="text-sm font-bold text-[var(--foreground)]">
            No Review Stages Found
          </h3>
          <p className="text-xs text-[var(--foreground-muted)] mt-1 max-w-sm mx-auto">
            Initialize the Color Team Review process to create Pink, Red, Gold,
            and White review stages for this proposal.
          </p>
        </div>
        <button
          type="button"
          disabled={initializing}
          onClick={handleInitialize}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition-all duration-200 disabled:opacity-40"
          style={{ backgroundColor: "var(--accent)", color: "#0a0a0a" }}
        >
          {initializing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PlayCircle className="h-4 w-4" />
          )}
          Initialize Color Team Review
        </button>
      </div>
    );
  }

  // ── Main Dashboard ───────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Stage Tracker */}
      <ReviewStageTracker
        stages={stages}
        activeStageId={activeStageId}
        onStageClick={(id) => setActiveStageId(id)}
      />

      {activeStage && stageDetail && (
        <>
          {/* Stage Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              {activeStage.stage.charAt(0).toUpperCase() +
                activeStage.stage.slice(1)}{" "}
              Team Review
            </h2>
            <button
              type="button"
              onClick={refresh}
              className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>

          {/* Reviewer Assignment */}
          <ReviewerAssignment
            stageId={activeStageId!}
            proposalId={proposalId}
            reviewers={reviewers}
            onUpdate={refresh}
          />

          {/* Reviewer Summary Cards */}
          {reviewers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {reviewers.map((reviewer) => {
                const stats = reviewerStats.get(reviewer.reviewer_id) ?? {
                  count: 0,
                  avgScore: null,
                };
                return (
                  <ReviewSummaryCard
                    key={reviewer.id}
                    reviewer={reviewer}
                    reviewCount={stats.count}
                    totalSections={sections.length}
                    avgScore={stats.avgScore}
                  />
                );
              })}
            </div>
          )}

          {/* Review Matrix Table */}
          {reviewers.length > 0 && sections.length > 0 && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                  Review Matrix
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left text-xs font-semibold text-[var(--foreground-muted)] px-4 py-2.5">
                        Section
                      </th>
                      {reviewers.map((r) => (
                        <th
                          key={r.id}
                          className="text-center text-xs font-semibold text-[var(--foreground-muted)] px-3 py-2.5"
                        >
                          {r.full_name.split(" ")[0]}
                        </th>
                      ))}
                      <th className="text-center text-xs font-bold text-[var(--foreground)] px-3 py-2.5 bg-[var(--background-tertiary)]">
                        Avg
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((section, idx) => {
                      const avg: number | null =
                        sectionAverages.get(section.id) ?? null;
                      return (
                        <tr
                          key={section.id}
                          className={
                            idx % 2 === 0
                              ? ""
                              : "bg-[var(--background-secondary)]"
                          }
                        >
                          <td className="px-4 py-2.5 text-xs font-medium text-[var(--foreground)] max-w-[200px] truncate">
                            {section.title}
                          </td>
                          {reviewers.map((r) => {
                            const review = reviewMatrix
                              .get(section.id)
                              ?.get(r.reviewer_id);
                            const score = review?.score ?? null;
                            return (
                              <td
                                key={r.id}
                                className="text-center px-3 py-2.5"
                              >
                                <span
                                  className="text-xs font-bold"
                                  style={{ color: getScoreColor(score) }}
                                >
                                  {score !== null ? score : "--"}
                                </span>
                              </td>
                            );
                          })}
                          <td className="text-center px-3 py-2.5 bg-[var(--background-tertiary)]">
                            <span
                              className="text-xs font-bold"
                              style={{ color: getScoreColor(avg ?? null) }}
                            >
                              {avg != null ? avg.toFixed(1) : "--"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Gate Criteria Summary Bar */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-[var(--foreground-muted)]">
                Sections covered:{" "}
                <span className="font-bold text-[var(--foreground)]">
                  {sectionsWithReviews}/{sections.length}
                </span>
              </span>
              <span className="text-[var(--foreground-muted)]">
                Overall avg:{" "}
                <span
                  className="font-bold"
                  style={{ color: getScoreColor(overallAvg ?? null) }}
                >
                  {overallAvg !== null ? overallAvg.toFixed(1) : "--"}
                </span>
              </span>
              <span className="text-[var(--foreground-muted)]">
                Reviewers complete:{" "}
                <span
                  className="font-bold"
                  style={{
                    color: allReviewersComplete
                      ? "var(--success)"
                      : "var(--warning)",
                  }}
                >
                  {reviewers.filter((r) => r.status === StageReviewerStatus.COMPLETED).length}/
                  {reviewers.length}
                </span>
              </span>
            </div>

            {activeStage.status !== ReviewStageStatus.COMPLETED && (
              <button
                type="button"
                onClick={() => setShowAdvanceModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "#0a0a0a",
                }}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Advance Stage
              </button>
            )}
          </div>

          {/* Section Review Form */}
          <SectionReviewForm
            stageId={activeStageId!}
            proposalId={proposalId}
            sections={sections}
            onSubmit={refresh}
          />
        </>
      )}

      {/* Advance Gate Modal */}
      {showAdvanceModal && activeStage && (
        <AdvanceGateModal
          proposalId={proposalId}
          stageId={activeStageId!}
          stage={activeStage.stage}
          onAdvance={refresh}
          onClose={() => setShowAdvanceModal(false)}
        />
      )}
    </div>
  );
}
