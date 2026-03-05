"use client";

import { useCallback } from "react";
import { useCreateFlow } from "../create-provider";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { regenerateSection } from "./draft-helpers";

// ── Retry failed sections button ────────────────────────────────────────────

export function RetryFailedButton() {
  const { state, dispatch } = useCreateFlow();
  const authFetch = useAuthFetch();
  const failedSections = state.sections.filter(
    (s) => s.generationStatus === "failed",
  );

  const handleRetryAll = useCallback(async () => {
    if (!state.proposalId) return;
    // Sequential to avoid 429 bursts from concurrent Gemini calls
    for (const section of failedSections) {
      await regenerateSection(
        state.proposalId,
        section.id,
        dispatch,
        authFetch,
        state.sections,
      );
    }
  }, [state.proposalId, failedSections, dispatch, authFetch, state.sections]);

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

// ── Continue / review-all actions ───────────────────────────────────────────

export function DraftContinueActions() {
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
