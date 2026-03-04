"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCreateFlow } from "../create-provider";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { SectionCard } from "../shared/section-card";
import { PhaseIcon } from "../shared/phase-icon";
import { runDraftFlow, regenerateSection } from "./draft-helpers";
import { computeCapabilityAlignment } from "@/lib/ai/pipeline/capability-alignment";
import { CapabilityWarningGate } from "@/components/capability-warning-gate";

// ── Small presentational pieces ─────────────────────────────────────────────

function DraftHeader() {
  return (
    <div className="flex items-center gap-3">
      <PhaseIcon phase="draft" state="active" />
      <div>
        <h2 className="text-xl font-bold">Proposal Draft</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sections generate from your RFP analysis and win themes. Review each
          as it completes.
        </p>
      </div>
    </div>
  );
}

function SpinnerBanner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-6">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--accent)]/20 border-t-[var(--accent)] shrink-0" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3"
    >
      <span
        className="text-destructive text-lg leading-none mt-0.5"
        aria-hidden="true"
      >
        !
      </span>
      <div className="flex-1">
        <p className="text-sm text-destructive">
          Proposal generation failed. Please try again.
        </p>
        <button
          onClick={onRetry}
          className="mt-2 text-xs font-medium text-primary hover:underline"
        >
          Retry generation
        </button>
      </div>
    </div>
  );
}

function ElapsedTime() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const label = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  return (
    <span className="text-xs text-muted-foreground tabular-nums">{label}</span>
  );
}

function RetryFailedButton() {
  const { state, dispatch } = useCreateFlow();
  const authFetch = useAuthFetch();
  const failedSections = state.sections.filter(
    (s) => s.generationStatus === "failed",
  );

  const handleRetryAll = useCallback(() => {
    if (!state.proposalId) return;
    for (const section of failedSections) {
      void regenerateSection(state.proposalId, section.id, dispatch, authFetch);
    }
  }, [state.proposalId, failedSections, dispatch, authFetch]);

  if (failedSections.length === 0) return null;

  return (
    <button
      onClick={handleRetryAll}
      className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
    >
      Retry {failedSections.length} failed section(s)
    </button>
  );
}

function ProgressSummary({
  total,
  completed,
  failed,
  isGenerating,
}: {
  total: number;
  completed: number;
  failed: number;
  isGenerating: boolean;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium">Generation Progress</span>
        <div className="flex items-center gap-2">
          {isGenerating && <ElapsedTime />}
          <span className="text-muted-foreground">
            {completed}/{total} sections
            {failed > 0 && (
              <span className="text-destructive ml-1">({failed} failed)</span>
            )}
          </span>
        </div>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_8px_var(--accent)] ${isGenerating ? "animate-glow-pulse" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Section list ────────────────────────────────────────────────────────────

function SectionList() {
  const { state, dispatch } = useCreateFlow();
  const authFetch = useAuthFetch();
  const sorted = [...state.sections].sort((a, b) => a.order - b.order);

  const handleMarkReviewed = useCallback(
    (sectionId: string) => {
      dispatch({ type: "MARK_SECTION_REVIEWED", sectionId });
    },
    [dispatch],
  );

  const handleRegenerate = useCallback(
    (sectionId: string) => {
      if (!state.proposalId) return;
      void regenerateSection(state.proposalId, sectionId, dispatch, authFetch);
    },
    [state.proposalId, dispatch, authFetch],
  );

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-3">
      {sorted.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          onMarkReviewed={handleMarkReviewed}
          onRegenerate={state.proposalId ? handleRegenerate : undefined}
          defaultExpanded={
            state.generationStatus === "complete" &&
            section.generationStatus === "complete"
          }
        />
      ))}
    </div>
  );
}

// ── Continue button ─────────────────────────────────────────────────────────

function DraftActions() {
  const { state, dispatch } = useCreateFlow();
  const unreviewedCount = state.sections.filter(
    (s) => !s.reviewed && s.generationStatus === "complete",
  ).length;

  const handleReviewAll = useCallback(() => {
    dispatch({ type: "REVIEW_ALL_SECTIONS" });
  }, [dispatch]);

  const handleContinue = useCallback(() => {
    dispatch({ type: "COMPLETE_PHASE", phase: "draft" });
    dispatch({ type: "SET_PHASE", phase: "finalize" });
  }, [dispatch]);

  return (
    <div className="flex items-center justify-between pt-2">
      {unreviewedCount > 0 ? (
        <button
          onClick={handleReviewAll}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          Review All ({unreviewedCount})
        </button>
      ) : (
        <span className="text-xs text-emerald-600 font-medium">
          All sections reviewed
        </span>
      )}
      <button
        onClick={handleContinue}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Continue to Finalize
      </button>
    </div>
  );
}

// ── Draft flow hook ─────────────────────────────────────────────────────────

function useDraftFlow() {
  const { state, dispatch } = useCreateFlow();
  const authFetch = useAuthFetch();
  const mountedRef = useRef(true);
  const startedRef = useRef(false);
  const [gateAcknowledged, setGateAcknowledged] = useState(false);

  // Compute capability alignment for the warning gate
  const alignment = computeCapabilityAlignment(state.bidEvaluation);
  const needsGate = alignment.level !== "high" && !gateAcknowledged;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (needsGate) return; // Wait for user acknowledgment
    if (state.proposalId !== null) return;
    if (state.generationStatus !== "idle") return;
    if (startedRef.current) return;
    startedRef.current = true;
    void runDraftFlow(state, dispatch, mountedRef, authFetch);
  }, [state, dispatch, authFetch, needsGate]);

  const handleAcknowledgeGate = useCallback(() => {
    setGateAcknowledged(true);
  }, []);

  const handleRetry = useCallback(() => {
    startedRef.current = true;
    void runDraftFlow(state, dispatch, mountedRef, authFetch);
  }, [state, dispatch, authFetch]);

  const completed = state.sections.filter(
    (s) => s.generationStatus === "complete",
  ).length;
  const failed = state.sections.filter(
    (s) => s.generationStatus === "failed",
  ).length;

  return {
    state,
    completed,
    failed,
    handleRetry,
    needsGate,
    alignment,
    handleAcknowledgeGate,
  };
}

// ── Main component ──────────────────────────────────────────────────────────

export function DraftPhase() {
  const {
    state,
    completed,
    failed,
    handleRetry,
    needsGate,
    alignment,
    handleAcknowledgeGate,
  } = useDraftFlow();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <DraftHeader />

      {needsGate && (
        <CapabilityWarningGate
          alignment={alignment}
          onAcknowledge={handleAcknowledgeGate}
        />
      )}

      {!needsGate && state.generationStatus === "idle" && (
        <SpinnerBanner label="Setting up your proposal..." />
      )}

      {state.generationStatus === "generating" &&
        state.sections.length === 0 && (
          <SpinnerBanner label="Setting up your proposal..." />
        )}

      {state.sections.length > 0 && state.generationStatus !== "idle" && (
        <ProgressSummary
          total={state.sections.length}
          completed={completed}
          failed={failed}
          isGenerating={state.generationStatus === "generating"}
        />
      )}

      <SectionList />

      {state.generationStatus === "complete" && failed > 0 && (
        <RetryFailedButton />
      )}

      {state.generationStatus === "failed" && state.sections.length === 0 && (
        <ErrorBanner onRetry={handleRetry} />
      )}

      {state.generationStatus === "complete" && <DraftActions />}
    </div>
  );
}
