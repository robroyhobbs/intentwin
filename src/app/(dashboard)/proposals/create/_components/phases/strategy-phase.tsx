"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCreateFlow } from "../create-provider";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { logger } from "@/lib/utils/logger";
import { fetchBidEvaluation, fetchWinStrategy } from "./strategy-helpers";
import { isParseFallbackBidEvaluation } from "../bid-evaluation-helpers";
import {
  SpinnerOverlay,
  StrategyHeader,
  ScoreCard,
  BidDecisionButtons,
  WinThemeChips,
  ConfirmStrategyButton,
} from "./strategy-ui";
import { ErrorBanner } from "../shared/error-banner";

// ── Custom hook: auto-fetch bid evaluation ──────────────────────────────────

function useBidScoring(
  authFetch: (url: string, options?: RequestInit) => Promise<Response>,
) {
  const { state, dispatch } = useCreateFlow();
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef(false);
  const recoveryAttemptedRef = useRef(false);

  useEffect(() => {
    if (inflightRef.current) return;
    if (!state.extractedData) return;

    const needsInitialScore = state.bidEvaluation === null;
    const needsRecoveryScore =
      state.bidEvaluation !== null &&
      isParseFallbackBidEvaluation(state.bidEvaluation) &&
      !recoveryAttemptedRef.current;
    if (!needsInitialScore && !needsRecoveryScore) return;

    if (needsRecoveryScore) {
      recoveryAttemptedRef.current = true;
    }

    inflightRef.current = true;
    const data = state.extractedData;

    // Use queueMicrotask to avoid synchronous setState in effect body
    queueMicrotask(() => {
      setIsScoring(true);
      setError(null);

      fetchBidEvaluation(data, dispatch, authFetch)
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "Scoring failed";
          setError(msg);
        })
        .finally(() => {
          setIsScoring(false);
          inflightRef.current = false;
        });
    });
  }, [state.bidEvaluation, state.extractedData, dispatch, authFetch]);

  const retry = useCallback(() => {
    if (!state.extractedData) return;
    inflightRef.current = false;
    setError(null);
    setIsScoring(true);

    fetchBidEvaluation(state.extractedData, dispatch, authFetch)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Scoring failed";
        setError(msg);
      })
      .finally(() => {
        setIsScoring(false);
        inflightRef.current = false;
      });
  }, [state.extractedData, dispatch, authFetch]);

  return { isScoring, error, retry };
}

// ── Custom hook: auto-fetch win strategy ────────────────────────────────────

function useWinStrategy(
  authFetch: (url: string, options?: RequestInit) => Promise<Response>,
) {
  const { state, dispatch } = useCreateFlow();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef(false);

  const generate = useCallback(() => {
    if (!state.extractedData) return;
    inflightRef.current = true;
    setIsGenerating(true);
    setError(null);

    fetchWinStrategy(state.extractedData, dispatch, authFetch)
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Theme generation failed";
        logger.warn("Win strategy generation failed", { error: msg });
        setError(msg);
        inflightRef.current = false;
      })
      .finally(() => setIsGenerating(false));
  }, [state.extractedData, dispatch, authFetch]);

  useEffect(() => {
    if (inflightRef.current) return;
    if (!state.bidEvaluation) return;
    if (state.winThemes.length > 0) return;
    if (!state.extractedData) return;

    queueMicrotask(generate);
  }, [
    state.bidEvaluation,
    state.winThemes.length,
    state.extractedData,
    generate,
  ]);

  const retry = useCallback(() => {
    inflightRef.current = false;
    queueMicrotask(generate);
  }, [generate]);

  return { isGenerating, error, retry };
}

// ── Scored view (after evaluation completes) ────────────────────────────────

function ScoredView({
  isGenerating,
  strategyError,
  onRetryStrategy,
}: {
  isGenerating: boolean;
  strategyError: string | null;
  onRetryStrategy: () => void;
}) {
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
          {!isGenerating && strategyError && (
            <ErrorBanner
              message={strategyError}
              onRetry={onRetryStrategy}
              retryLabel="Retry theme generation"
            />
          )}
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
  const authFetch = useAuthFetch();
  const { isScoring, error, retry } = useBidScoring(authFetch);
  const {
    isGenerating,
    error: strategyError,
    retry: retryStrategy,
  } = useWinStrategy(authFetch);

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
        <ScoredView
          isGenerating={isGenerating}
          strategyError={strategyError}
          onRetryStrategy={retryStrategy}
        />
      )}
    </div>
  );
}
