"use client";

/**
 * StepInput — Step 1 of the proposal wizard.
 *
 * Embeds the existing FlexibleIntake component and wires its callbacks
 * to the wizard state via dispatch. Handles:
 * - Extraction success → dispatch EXTRACTION_SUCCESS → auto-advance to step 2
 * - Extraction failure → show ExtractionFailureDialog (retry/manual/review-partial)
 * - Manual entry → dispatch UPDATE_INPUT with intakeMode: "manual" → enables Next (skip to step 3)
 * - Opportunity prefill from sessionStorage (from opportunity feed)
 * - Draft resume banner when returning to step 1 with data
 */

import { useEffect, useCallback } from "react";
import { FileText } from "lucide-react";
import { FlexibleIntake } from "@/components/intake/flexible-intake";
import type { ExtractedIntake, ClientResearch } from "@/types/intake";
import { useWizard } from "./wizard-provider";
import { ExtractionFailureDialog } from "./extraction-failure-dialog";

export function StepInput() {
  const { state, dispatch } = useWizard();

  // ── Opportunity prefill from sessionStorage (e.g., from opportunity feed) ──
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("opportunity-prefill");
      if (!raw) return;
      sessionStorage.removeItem("opportunity-prefill");
      const prefill = JSON.parse(raw) as Record<string, unknown>;

      // Pre-fill form fields from opportunity feed
      const payload: Record<string, string> = {};
      if (prefill.client_name) payload.clientName = prefill.client_name as string;
      if (prefill.scope_description) payload.scopeDescription = prefill.scope_description as string;
      if (prefill.solicitation_type) payload.solicitationType = prefill.solicitation_type as string;
      if (prefill.timeline_expectation) payload.timelineExpectation = prefill.timeline_expectation as string;

      if (Object.keys(payload).length > 0) {
        dispatch({ type: "UPDATE_FORM_FIELDS", payload });
        // Go directly to manual entry mode since we have pre-filled data
        dispatch({ type: "UPDATE_INPUT", payload: { intakeMode: "manual" } });
      }
    } catch {
      // Ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Extraction success handler ──
  const handleExtracted = useCallback(
    (data: ExtractedIntake, research: ClientResearch | null) => {
      // Ensure required sub-objects exist (AI may return partial data)
      if (!data.extracted) data.extracted = {} as ExtractedIntake["extracted"];
      if (!data.inferred) data.inferred = {} as ExtractedIntake["inferred"];
      if (!data.gaps) data.gaps = [];

      dispatch({
        type: "EXTRACTION_SUCCESS",
        payload: { extracted: data, research },
      });
    },
    [dispatch],
  );

  // ── Manual entry handler ──
  const handleManualEntry = useCallback(() => {
    dispatch({ type: "UPDATE_INPUT", payload: { intakeMode: "manual" } });
    // Skip step 2 (review) — go directly to step 3 (configure)
    dispatch({ type: "SET_STEP", step: 3 });
  }, [dispatch]);

  // ── Extraction failure dialog handlers ──
  const handleRetry = useCallback(() => {
    dispatch({ type: "UPDATE_INPUT", payload: { intakeMode: null } });
    // Reset extraction error — this will re-show FlexibleIntake in its initial state
    dispatch({ type: "EXTRACTION_FAIL", error: "" });
    // Clear the error by dispatching a fresh state
    dispatch({
      type: "RESTORE_DRAFT",
      state: { extractionError: null, isExtracting: false },
    });
  }, [dispatch]);

  const handleManualFallback = useCallback(() => {
    dispatch({ type: "UPDATE_INPUT", payload: { intakeMode: "manual" } });
    dispatch({ type: "SET_STEP", step: 3 });
  }, [dispatch]);

  const handleReviewPartial = useCallback(() => {
    // Advance to step 2 with whatever partial data we have
    // The review screen will show gaps and allow manual completion
    if (state.extractedData) {
      dispatch({ type: "SET_STEP", step: 2 });
    } else {
      // No data at all — fall back to manual entry
      handleManualFallback();
    }
  }, [dispatch, state.extractedData, handleManualFallback]);

  // ── Show manual entry confirmation when intakeMode is "manual" ──
  if (state.intakeMode === "manual") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] mb-6">
          <FileText className="h-8 w-8 text-[var(--accent)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Manual Entry Mode
        </h2>
        <p className="text-[var(--foreground-muted)] max-w-md mb-6">
          You&apos;ll fill in the proposal details manually on the next screen.
          Click &quot;Continue&quot; below to proceed.
        </p>
        <p className="text-sm text-[var(--foreground-subtle)]">
          Tip: You can always go back and upload documents later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-white shadow-lg">
            <FileText className="h-6 w-6" />
          </div>
          New Proposal
        </h1>
        <p className="mt-2 text-[var(--foreground-muted)]">
          Start with documents, pasted content, or manual entry
        </p>
      </div>

      {/* Extraction Failure Dialog */}
      {state.extractionError && (
        <ExtractionFailureDialog
          error={state.extractionError}
          hasPartialData={!!state.extractedData}
          onRetry={handleRetry}
          onManualEntry={handleManualFallback}
          onReviewPartial={handleReviewPartial}
        />
      )}

      {/* FlexibleIntake — the existing component handles mode selection, uploads, and extraction */}
      {!state.extractionError && (
        <div className="max-w-2xl mx-auto">
          <FlexibleIntake
            onExtracted={handleExtracted}
            onManualEntry={handleManualEntry}
          />
        </div>
      )}
    </div>
  );
}
