"use client";

/**
 * StepGenerate — Step 4 of the proposal wizard.
 *
 * On entry:
 *   1. Creates proposal via POST /api/proposals with all wizard state data
 *   2. Triggers generation via POST /api/proposals/{id}/generate
 *   3. Polls GET /api/proposals/{id} for section progress (exponential backoff)
 *   4. Shows per-section status list + progress bar
 *   5. Redirects to /proposals/{id} on completion
 *
 * Error handling:
 *   - Proposal creation failure → retry option
 *   - Generation trigger failure → retry option
 *   - Poll failure → retries with backoff
 *   - All sections failed → "Start Over" option
 *   - 10-minute timeout → timeout message
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  FileText,
  Sparkles,
  Clock,
} from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useWizard } from "./wizard-provider";
import type { SectionProgress } from "@/lib/proposal-core/wizard-state";
import { computeCapabilityAlignment } from "@/lib/ai/pipeline/capability-alignment";
import { CapabilityWarningGate } from "@/components/capability-warning-gate";
import { startBackgroundGeneration } from "@/lib/proposals/background-generation";
import {
  startProposalGenerationPoll,
  type ProposalGenerationPollHandle,
} from "@/lib/proposals/proposal-generation-runner";

// ────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────

const MIN_PROGRESS_DISPLAY_MS = 3000; // Show progress for at least 3s before redirect
const SOFT_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes — show "taking longer" warning
const SOFT_TIMEOUT_CHECK_INTERVAL = 30_000; // Check every 30 seconds

// ────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────

type GenerationPhase =
  | "creating"
  | "triggering"
  | "generating"
  | "complete"
  | "failed"
  | "timeout";

interface ApiSection {
  id: string;
  section_type: string;
  title: string;
  generation_status: string;
  generation_error: string | null;
}

// ────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────

function SectionStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "generating":
    case "regenerating":
      return <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-[var(--danger)]" />;
    default:
      return <Clock className="h-4 w-4 text-[var(--foreground-subtle)]" />;
  }
}

function SectionStatusLabel({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <span className="text-xs text-emerald-500 font-medium">Complete</span>
      );
    case "generating":
    case "regenerating":
      return (
        <span className="text-xs text-[var(--accent)] font-medium">
          Generating...
        </span>
      );
    case "failed":
      return (
        <span className="text-xs text-[var(--danger)] font-medium">Failed</span>
      );
    default:
      return (
        <span className="text-xs text-[var(--foreground-subtle)]">Pending</span>
      );
  }
}

function ProgressBar({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--foreground-muted)]">
          {completed} of {total || "..."} sections complete
        </span>
        <span className="font-semibold text-[var(--foreground)]">
          {percent}%
        </span>
      </div>
      <div
        className="h-2.5 rounded-full bg-[var(--background-tertiary)] overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Generation progress: ${completed} of ${total} sections complete`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────

export function StepGenerate() {
  const { state, dispatch } = useWizard();
  const authFetch = useAuthFetch();
  const router = useRouter();

  const [phase, setPhase] = useState<GenerationPhase>("creating");
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<ApiSection[]>([]);
  const [proposalId, setProposalId] = useState<string | null>(state.proposalId);
  const [gateAcknowledged, setGateAcknowledged] = useState(false);
  const [softTimeoutReached, setSoftTimeoutReached] = useState(false);

  // Capability alignment gate
  const alignment = computeCapabilityAlignment(state.bidEvaluation ?? null);
  const needsGate = alignment.level !== "high" && !gateAcknowledged;

  // Refs for polling lifecycle
  const pollHandleRef = useRef<ProposalGenerationPollHandle | null>(null);
  const startTimeRef = useRef(Date.now());
  const generationStartedRef = useRef(false);
  const progressShownAtRef = useRef<number | null>(null);
  const viewDelayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const lastStatusChangeRef = useRef(Date.now());
  const softTimeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling and timers on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      pollHandleRef.current?.cancel();
      if (viewDelayTimerRef.current) {
        clearTimeout(viewDelayTimerRef.current);
      }
      if (softTimeoutTimerRef.current) {
        clearInterval(softTimeoutTimerRef.current);
      }
    };
  }, []);

  // ── Step 1: Create proposal ──
  const createProposal = useCallback(async (): Promise<string | null> => {
    setPhase("creating");
    setError(null);

    try {
      // Build the title from available data
      const title = state.clientName
        ? `${state.solicitationType} Response — ${state.clientName}`
        : `${state.solicitationType} Proposal`;

      const body = {
        title,
        intake_data: {
          client_name: state.clientName,
          client_industry: state.clientIndustry,
          client_size: state.clientSize,
          solicitation_type: state.solicitationType,
          opportunity_type: state.opportunityType,
          scope_description: state.scopeDescription,
          current_state_pains: state.currentStatePains,
          desired_outcomes: state.desiredOutcomes,
          budget_range: state.budgetRange,
          timeline_expectation: state.timelineExpectation,
          technical_environment: state.technicalEnvironment,
          compliance_requirements: state.complianceRequirements,
          competitive_intel: state.competitiveIntel,
          tone: state.tone,
          selected_sections: state.selectedSections,
          selected_product_ids: state.selectedProductIds,
          rfp_analysis: state.extractedData?.rfp_analysis ?? null,
        },
        win_strategy_data: state.winStrategy,
        bid_evaluation: state.bidEvaluation,
        client_research: state.researchData,
      };

      const response = await authFetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 403) {
          throw new Error(
            data.error ||
              "Plan limit reached. Please upgrade to create more proposals.",
          );
        }
        throw new Error(
          data.error || `Failed to create proposal (${response.status})`,
        );
      }

      const data = await response.json();
      const id = data.proposal?.id;
      if (!id) throw new Error("Proposal created but no ID returned");

      setProposalId(id);
      dispatch({ type: "GENERATION_START", proposalId: id });
      return id;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create proposal";
      setError(message);
      setPhase("failed");
      return null;
    }
  }, [authFetch, dispatch, state]);

  // ── Step 2: Trigger generation (client-orchestrated) ──
  const triggerGeneration = useCallback(
    async (id: string): Promise<boolean> => {
      setPhase("triggering");

      try {
        await startBackgroundGeneration(id, authFetch);
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to trigger generation";
        setError(message);
        setPhase("failed");
        return false;
      }
    },
    [authFetch],
  );

  const cancelPollProgress = useCallback(() => {
    pollHandleRef.current?.cancel();
    pollHandleRef.current = null;
  }, []);

  // ── Step 3: Poll for progress ──
  const beginPolling = useCallback(
    (id: string) => {
      cancelPollProgress();

      const handle = startProposalGenerationPoll<ApiSection>({
        proposalId: id,
        fetchFn: authFetch,
        startedAt: startTimeRef.current,
        shouldContinue: () => mountedRef.current,
        onSnapshot: (data, summary) => {
          const apiSections: ApiSection[] = data.sections || [];
          setSections(apiSections);

          const sectionProgress: SectionProgress[] = apiSections.map(
            (section: ApiSection) => ({
              type: section.section_type,
              title: section.title,
              status:
                section.generation_status === "completed" ||
                section.generation_status === "failed" ||
                section.generation_status === "generating"
                  ? (section.generation_status as
                      | "completed"
                      | "failed"
                      | "generating")
                  : ("pending" as const),
            }),
          );
          dispatch({ type: "SECTION_STATUS_UPDATE", sections: sectionProgress });

          if (summary.totalCount > 0 && !progressShownAtRef.current) {
            progressShownAtRef.current = Date.now();
          }

          if (summary.completedCount > 0 || summary.failedCount > 0) {
            lastStatusChangeRef.current = Date.now();
            setSoftTimeoutReached(false);
          }

          if (summary.phase === "generating") {
            setPhase("generating");
          }
        },
        onTerminal: (_data, summary) => {
          if (summary.phase === "failed") {
            setPhase("failed");
            setError("All sections failed to generate. Please try again.");
            dispatch({ type: "GENERATION_FAIL" });
            return;
          }

          setPhase("complete");
          dispatch({ type: "GENERATION_COMPLETE" });
        },
        onTimeout: () => {
          setPhase("timeout");
          dispatch({ type: "GENERATION_FAIL" });
        },
      });

      pollHandleRef.current = handle;
      void handle.promise.finally(() => {
        if (pollHandleRef.current === handle) {
          pollHandleRef.current = null;
        }
      });
    },
    [authFetch, cancelPollProgress, dispatch],
  );

  // ── Orchestrate: create → trigger → poll ──
  const startGeneration = useCallback(async () => {
    // Prevent double-start
    if (generationStartedRef.current) return;
    generationStartedRef.current = true;

    startTimeRef.current = Date.now();
    progressShownAtRef.current = null;
    lastStatusChangeRef.current = Date.now();
    setSoftTimeoutReached(false);

    const id = await createProposal();
    if (!id) {
      generationStartedRef.current = false;
      return;
    }

    const triggered = await triggerGeneration(id);
    if (!triggered) {
      generationStartedRef.current = false;
      return;
    }

    setPhase("generating");
    beginPolling(id);
  }, [beginPolling, createProposal, triggerGeneration]);

  // ── Auto-start on mount (respects capability gate) ──
  useEffect(() => {
    if (needsGate) return; // Wait for user acknowledgment
    // Only start if we don't already have a proposalId (idempotent)
    if (!state.proposalId && !generationStartedRef.current) {
      startGeneration();
    } else if (state.proposalId && state.generationStatus === "generating") {
      // Resume polling for an in-progress generation
      setPhase("generating");
      setProposalId(state.proposalId);
      startTimeRef.current = Date.now();
      lastStatusChangeRef.current = Date.now();
      setSoftTimeoutReached(false);
      beginPolling(state.proposalId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsGate]);

  // ── Visibility API: refetch when tab becomes visible ──
  useEffect(() => {
    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        proposalId &&
        phase === "generating"
      ) {
        beginPolling(proposalId);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [beginPolling, phase, proposalId]);

  // ── Soft timeout: warn after 3 min with no section status changes ──
  useEffect(() => {
    if (phase !== "generating") {
      if (softTimeoutTimerRef.current)
        clearInterval(softTimeoutTimerRef.current);
      return;
    }
    softTimeoutTimerRef.current = setInterval(() => {
      if (Date.now() - lastStatusChangeRef.current > SOFT_TIMEOUT_MS) {
        setSoftTimeoutReached(true);
      }
    }, SOFT_TIMEOUT_CHECK_INTERVAL);
    return () => {
      if (softTimeoutTimerRef.current)
        clearInterval(softTimeoutTimerRef.current);
    };
  }, [phase]);

  // ── Retry handler ──
  // If we already have a proposalId, only re-trigger generation (don't create a duplicate).
  // If creation itself failed (no proposalId), restart from scratch.
  const handleRetry = useCallback(async () => {
    setError(null);
    setSections([]);
    cancelPollProgress();
    startTimeRef.current = Date.now();
    progressShownAtRef.current = null;
    lastStatusChangeRef.current = Date.now();
    setSoftTimeoutReached(false);

    if (proposalId) {
      // Proposal exists — just re-trigger generation and poll
      const triggered = await triggerGeneration(proposalId);
      if (triggered) {
        setPhase("generating");
        beginPolling(proposalId);
      }
    } else {
      // No proposal yet — full restart
      generationStartedRef.current = false;
      startGeneration();
    }
  }, [
    beginPolling,
    cancelPollProgress,
    proposalId,
    startGeneration,
    triggerGeneration,
  ]);

  // ── Navigate to proposal ──
  const handleViewProposal = () => {
    if (!proposalId) return;

    // Ensure progress was shown for at least MIN_PROGRESS_DISPLAY_MS
    const showDuration = progressShownAtRef.current
      ? Date.now() - progressShownAtRef.current
      : MIN_PROGRESS_DISPLAY_MS;

    if (showDuration < MIN_PROGRESS_DISPLAY_MS) {
      viewDelayTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          router.push(`/proposals/${proposalId}`);
        }
      }, MIN_PROGRESS_DISPLAY_MS - showDuration);
    } else {
      router.push(`/proposals/${proposalId}`);
    }
  };

  // ── Derived state ──
  const completedCount = sections.filter(
    (s) => s.generation_status === "completed",
  ).length;
  const failedCount = sections.filter(
    (s) => s.generation_status === "failed",
  ).length;
  const totalCount = sections.length;
  const hasPartialFailure = failedCount > 0 && completedCount > 0;

  // ── Render ──
  if (needsGate) {
    return (
      <div className="space-y-8 max-w-lg mx-auto">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            Before We Generate
          </h2>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Please review the capability assessment below.
          </p>
        </div>
        <CapabilityWarningGate
          alignment={alignment}
          onAcknowledge={() => setGateAcknowledged(true)}
          onCancel={() => dispatch({ type: "SET_STEP", step: 3 })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        {phase === "creating" && (
          <>
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center shadow-lg animate-pulse">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Creating Proposal
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              Setting up your proposal structure...
            </p>
          </>
        )}

        {phase === "triggering" && (
          <>
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center shadow-lg animate-pulse">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Starting Generation
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              Initializing AI pipeline...
            </p>
          </>
        )}

        {phase === "generating" && (
          <>
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-emerald-500 flex items-center justify-center shadow-lg">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Generating Proposal
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              {totalCount === 0
                ? "Building pipeline context and creating section structure..."
                : "Writing each section using your win strategy and context..."}
            </p>
          </>
        )}

        {phase === "complete" && (
          <>
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {hasPartialFailure
                ? "Proposal Partially Generated"
                : "Proposal Ready"}
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              {hasPartialFailure
                ? `${completedCount} of ${totalCount} sections generated successfully. You can regenerate failed sections later.`
                : `All ${completedCount} sections generated successfully.`}
            </p>
          </>
        )}

        {phase === "failed" && (
          <>
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-[var(--danger)] to-red-600 flex items-center justify-center shadow-lg">
              <XCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Generation Failed
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              {error || "Something went wrong."}
            </p>
          </>
        )}

        {phase === "timeout" && (
          <>
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Generation Timed Out
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              The generation is taking longer than expected. Your proposal may
              still be processing.
            </p>
          </>
        )}
      </div>

      {/* Progress Bar */}
      {(phase === "generating" || phase === "complete") && totalCount > 0 && (
        <div className="max-w-md mx-auto">
          <ProgressBar completed={completedCount} total={totalCount} />
        </div>
      )}

      {/* Loading spinner for pre-section phase */}
      {(phase === "creating" ||
        phase === "triggering" ||
        (phase === "generating" && totalCount === 0)) && (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
        </div>
      )}

      {/* Section List */}
      {totalCount > 0 && (
        <div className="max-w-md mx-auto">
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            {sections.map((section, idx) => (
              <div
                key={section.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  idx > 0 ? "border-t border-[var(--border)]" : ""
                } ${
                  section.generation_status === "completed"
                    ? "bg-emerald-500/5"
                    : section.generation_status === "failed"
                      ? "bg-[var(--danger-subtle)]"
                      : ""
                }`}
              >
                <SectionStatusIcon status={section.generation_status} />
                <span className="flex-1 text-sm text-[var(--foreground)]">
                  {section.title}
                </span>
                <SectionStatusLabel status={section.generation_status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Soft timeout warning */}
      {softTimeoutReached && phase === "generating" && proposalId && (
        <div className="max-w-md mx-auto rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Generation is taking longer than expected
            </span>
          </div>
          <button
            onClick={() => {
              setSoftTimeoutReached(false);
              lastStatusChangeRef.current = Date.now();
              beginPolling(proposalId);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-500/20 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Check Status
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-3">
        {/* View Proposal */}
        {phase === "complete" && proposalId && (
          <button
            onClick={handleViewProposal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] px-8 py-3.5 text-sm font-bold text-white hover:shadow-lg transition-all"
          >
            View Proposal
            <ArrowRight className="h-4 w-4" />
          </button>
        )}

        {/* Retry on failure */}
        {(phase === "failed" || phase === "timeout") && (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white hover:brightness-110 transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </button>
            <button
              onClick={() => dispatch({ type: "RESET" })}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Start Over
            </button>
          </div>
        )}

        {/* View partial proposal on timeout */}
        {phase === "timeout" && proposalId && (
          <button
            onClick={() => router.push(`/proposals/${proposalId}`)}
            className="flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
          >
            View Current Progress
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
