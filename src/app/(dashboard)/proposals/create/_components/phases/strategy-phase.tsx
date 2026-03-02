"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCreateFlow } from "../create-provider";
import { logger } from "@/lib/utils/logger";
import { fetchBidEvaluation, fetchWinStrategy } from "./strategy-helpers";
import {
  SpinnerOverlay,
  ErrorBanner,
  StrategyHeader,
  ScoreCard,
  BidDecisionButtons,
  WinThemeChips,
  ConfirmStrategyButton,
} from "./strategy-ui";

// ── Custom hook: auto-fetch bid evaluation ──────────────────────────────────

function useBidScoring() {
  const { state, dispatch } = useCreateFlow();
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef(false);

  useEffect(() => {
    if (inflightRef.current) return;
    if (state.bidEvaluation !== null) return;
    if (!state.extractedData) return;

    inflightRef.current = true;
    const data = state.extractedData;

    // Use queueMicrotask to avoid synchronous setState in effect body
    queueMicrotask(() => {
      setIsScoring(true);
      setError(null);

      fetchBidEvaluation(data, dispatch)
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "Scoring failed";
          setError(msg);
          inflightRef.current = false;
        })
        .finally(() => setIsScoring(false));
    });
  }, [state.bidEvaluation, state.extractedData, dispatch]);

  const retry = useCallback(() => {
    if (!state.extractedData) return;
    inflightRef.current = false;
    setError(null);
    setIsScoring(true);

    fetchBidEvaluation(state.extractedData, dispatch)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Scoring failed";
        setError(msg);
      })
      .finally(() => setIsScoring(false));
  }, [state.extractedData, dispatch]);

  return { isScoring, error, retry };
}

// ── Custom hook: auto-fetch win strategy ────────────────────────────────────

function useWinStrategy() {
  const { state, dispatch } = useCreateFlow();
  const [isGenerating, setIsGenerating] = useState(false);
  const inflightRef = useRef(false);

  useEffect(() => {
    if (inflightRef.current) return;
    if (!state.bidEvaluation) return;
    if (state.winThemes.length > 0) return;
    if (!state.extractedData) return;

    inflightRef.current = true;
    const data = state.extractedData;

    queueMicrotask(() => {
      setIsGenerating(true);

      fetchWinStrategy(data, dispatch)
        .catch((err: unknown) => {
          const msg =
            err instanceof Error ? err.message : "Theme generation failed";
          logger.warn("Win strategy generation failed", { error: msg });
          inflightRef.current = false;
        })
        .finally(() => setIsGenerating(false));
    });
  }, [
    state.bidEvaluation,
    state.winThemes.length,
    state.extractedData,
    dispatch,
  ]);

  return { isGenerating };
}

// ── Scored view (after evaluation completes) ────────────────────────────────

function ScoredView({ isGenerating }: { isGenerating: boolean }) {
  const { state, dispatch } = useCreateFlow();

  const handleProceed = useCallback(() => {
    dispatch({ type: "SET_BID_DECISION", decision: "proceed" });
  }, [dispatch]);

  const handleSkip = useCallback(() => {
    dispatch({ type: "SET_BID_DECISION", decision: "skip" });
  }, [dispatch]);

  const handleToggle = useCallback(
    (id: string) => dispatch({ type: "TOGGLE_WIN_THEME", themeId: id }),
    [dispatch],
  );

  const handleConfirm = useCallback(() => {
    dispatch({ type: "CONFIRM_STRATEGY" });
    dispatch({ type: "COMPLETE_PHASE", phase: "strategy" });
    dispatch({ type: "SET_PHASE", phase: "draft" });
  }, [dispatch]);

  const hasConfirmedTheme = state.winThemes.some((t) => t.confirmed);
  const canConfirm = state.bidDecision !== null && hasConfirmedTheme;

  return (
    <>
      <ScoreCard evaluation={state.bidEvaluation!} />
      {state.bidDecision === null && (
        <BidDecisionButtons onProceed={handleProceed} onSkip={handleSkip} />
      )}
      {state.bidDecision !== null && (
        <>
          {isGenerating && <SpinnerOverlay label="Generating win themes..." />}
          {state.winThemes.length > 0 && (
            <WinThemeChips themes={state.winThemes} onToggle={handleToggle} />
          )}
          <ConfirmStrategyButton
            disabled={!canConfirm}
            onClick={handleConfirm}
          />
        </>
      )}
    </>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function StrategyPhase() {
  const { state } = useCreateFlow();
  const { isScoring, error, retry } = useBidScoring();
  const { isGenerating } = useWinStrategy();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <StrategyHeader />
      {isScoring && (
        <SpinnerOverlay label="Analyzing your opportunity and scoring bid factors..." />
      )}
      {!isScoring && error && <ErrorBanner message={error} onRetry={retry} />}
      {!isScoring && !error && !state.bidEvaluation && (
        <p className="text-sm text-muted-foreground">
          No extracted data available. Complete the intake phase first.
        </p>
      )}
      {!isScoring && !error && state.bidEvaluation && (
        <ScoredView isGenerating={isGenerating} />
      )}
    </div>
  );
}
