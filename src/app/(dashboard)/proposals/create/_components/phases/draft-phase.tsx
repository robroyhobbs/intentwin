"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCreateFlow } from "../create-provider";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { PhaseIcon } from "../shared/phase-icon";
import { runDraftFlow, resumeDraftFlow } from "./draft-helpers";
import { computeCapabilityAlignment } from "@/lib/ai/pipeline/capability-alignment";
import { CapabilityWarningGate } from "@/components/capability-warning-gate";
import { WaitLoader } from "../shared/wait-loader";
import { ErrorBanner } from "../shared/error-banner";
import { DraftProgressSummary } from "./draft-progress-summary";
import { DraftSectionList } from "./draft-section-list";
import { RetryFailedButton, DraftContinueActions } from "./draft-actions";

// ── Small presentational pieces ─────────────────────────────────────────────

function DraftHeader() {
  return (
    <div className="flex items-center gap-3">
      <PhaseIcon phase="draft" state="active" />
      <div>
        <h2 className="text-xl font-bold text-balance">Proposal Draft</h2>
        <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
          Sections generate from your RFP analysis and win themes. Review each
          as it completes.
        </p>
      </div>
    </div>
  );
}

function SpinnerBanner({ label }: { label: string }) {
  return (
    <WaitLoader
      label={label}
      detail="Draft sections are being assembled with your selected strategy."
    />
  );
}

// ── Draft flow hook ─────────────────────────────────────────────────────────

function useDraftFlow() {
  const { state, dispatch } = useCreateFlow();
  const authFetch = useAuthFetch();
  const mountedRef = useRef(true);
  const startedRef = useRef(false);
  const [gateAcknowledged, setGateAcknowledged] = useState(false);

  const alignment = useMemo(
    () => computeCapabilityAlignment(state.bidEvaluation),
    [state.bidEvaluation],
  );
  const needsGate = alignment.level !== "high" && !gateAcknowledged;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (needsGate) return;
    if (startedRef.current) return;

    // Resume interrupted generation (e.g., browser refresh mid-flow)
    if (state.proposalId !== null && state.generationStatus === "generating") {
      startedRef.current = true;
      void resumeDraftFlow(state.proposalId, dispatch, mountedRef, authFetch);
      return;
    }

    // Normal start — only when idle and no existing proposal
    if (state.proposalId !== null) return;
    if (state.generationStatus !== "idle") return;
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
    <div className="max-w-2xl mx-auto space-y-6">
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
        <DraftProgressSummary
          total={state.sections.length}
          completed={completed}
          failed={failed}
          isGenerating={state.generationStatus === "generating"}
        />
      )}

      <DraftSectionList compact={state.generationStatus === "generating"} />

      {state.generationStatus === "complete" && failed > 0 && (
        <RetryFailedButton />
      )}

      {state.generationStatus === "failed" && state.sections.length === 0 && (
        <ErrorBanner
          message="Proposal generation failed. Please try again."
          onRetry={handleRetry}
          retryLabel="Retry generation"
        />
      )}

      {state.generationStatus === "complete" && <DraftContinueActions />}
    </div>
  );
}
