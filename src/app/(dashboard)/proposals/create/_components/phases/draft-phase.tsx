"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCreateFlow } from "../create-provider";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { SectionCard } from "../shared/section-card";
import { PhaseIcon } from "../shared/phase-icon";
import { runDraftFlow, regenerateSection } from "./draft-helpers";
import { computeCapabilityAlignment } from "@/lib/ai/pipeline/capability-alignment";
import { CapabilityWarningGate } from "@/components/capability-warning-gate";
import { WaitLoader } from "../shared/wait-loader";
import { cn } from "@/lib/utils/cn";

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
  const remaining = Math.max(0, total - completed - failed);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Generation Progress</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {completed}/{total} sections completed
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold tabular-nums">{pct}%</p>
          {isGenerating && <ElapsedTime />}
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-all duration-500",
            isGenerating
              ? "motion-safe:animate-pulse motion-reduce:animate-none"
              : "",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300 tabular-nums">
          {completed} complete
        </span>
        <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-muted-foreground tabular-nums">
          {remaining} remaining
        </span>
        {failed > 0 && (
          <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-destructive tabular-nums">
            {failed} failed
          </span>
        )}
      </div>
    </div>
  );
}

// ── Section list ────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  if (status === "complete") {
    return (
      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
        Complete
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        Failed
      </span>
    );
  }
  if (status === "generating") {
    return (
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        Generating
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Pending
    </span>
  );
}

function SectionList({ compact }: { compact: boolean }) {
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

  if (compact) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/70 bg-background/40 px-4 py-2 text-[11px] uppercase text-muted-foreground">
          <span>Section</span>
          <span>Status</span>
        </div>
        {sorted.map((section, idx) => (
          <div
            key={section.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3",
              idx > 0 ? "border-t border-border/60" : "",
              section.generationStatus === "generating"
                ? "bg-primary/5"
                : "bg-transparent",
            )}
          >
            <span className="flex size-6 items-center justify-center rounded-md bg-background/60 text-xs text-muted-foreground tabular-nums shrink-0">
              {idx + 1}
            </span>
            <span className="flex-1 truncate text-sm font-medium">{section.title}</span>
            <StatusPill status={section.generationStatus} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          onMarkReviewed={handleMarkReviewed}
          onRegenerate={state.proposalId ? handleRegenerate : undefined}
          defaultExpanded={false}
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
        <ProgressSummary
          total={state.sections.length}
          completed={completed}
          failed={failed}
          isGenerating={state.generationStatus === "generating"}
        />
      )}

      <SectionList compact={state.generationStatus === "generating"} />

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
