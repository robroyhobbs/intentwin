"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCreateFlow } from "../create-provider";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { SectionCard } from "../shared/section-card";
import { runDraftFlow } from "./draft-helpers";

// ── Small presentational pieces ─────────────────────────────────────────────

function DraftHeader() {
  return (
    <div>
      <h2 className="text-lg font-semibold">Proposal Draft</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Your proposal sections are being generated. Review each section as it
        completes.
      </p>
    </div>
  );
}

function SpinnerBanner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent shrink-0" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
      <span className="text-destructive text-lg leading-none mt-0.5">!</span>
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

function ProgressSummary({
  total,
  completed,
  failed,
}: {
  total: number;
  completed: number;
  failed: number;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium">Generation Progress</span>
        <span className="text-muted-foreground">
          {completed}/{total} sections
          {failed > 0 && (
            <span className="text-destructive ml-1">({failed} failed)</span>
          )}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Section list ────────────────────────────────────────────────────────────

function SectionList() {
  const { state, dispatch } = useCreateFlow();
  const sorted = [...state.sections].sort((a, b) => a.order - b.order);

  const handleMarkReviewed = useCallback(
    (sectionId: string) => {
      dispatch({ type: "MARK_SECTION_REVIEWED", sectionId });
    },
    [dispatch],
  );

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-3">
      {sorted.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          onMarkReviewed={handleMarkReviewed}
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

function ContinueButton() {
  const { dispatch } = useCreateFlow();

  const handleContinue = useCallback(() => {
    dispatch({ type: "COMPLETE_PHASE", phase: "draft" });
    dispatch({ type: "SET_PHASE", phase: "finalize" });
  }, [dispatch]);

  return (
    <div className="flex justify-end pt-2">
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

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (state.proposalId !== null) return;
    if (state.generationStatus !== "idle") return;
    if (startedRef.current) return;
    startedRef.current = true;
    void runDraftFlow(state, dispatch, mountedRef, authFetch);
  }, [state, dispatch, authFetch]);

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

  return { state, completed, failed, handleRetry };
}

// ── Main component ──────────────────────────────────────────────────────────

export function DraftPhase() {
  const { state, completed, failed, handleRetry } = useDraftFlow();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <DraftHeader />

      {state.generationStatus === "idle" && (
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
        />
      )}

      {state.generationStatus === "failed" && state.sections.length === 0 && (
        <ErrorBanner onRetry={handleRetry} />
      )}

      <SectionList />

      {state.generationStatus === "failed" && state.sections.length > 0 && (
        <ErrorBanner onRetry={handleRetry} />
      )}

      {state.generationStatus === "complete" && <ContinueButton />}
    </div>
  );
}
