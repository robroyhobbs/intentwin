"use client";

/**
 * StepBidDecision -- Step 3 of the proposal wizard.
 *
 * Full-screen bid/no-bid evaluation with the AI-generated score,
 * 5 editable scoring factors, and clear Bid / Pass / Evaluate actions.
 *
 * Auto-triggers scoring on mount if not already evaluated.
 * The user must confirm or skip before proceeding to Configure.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Target, Loader2, ChevronRight } from "lucide-react";
import type { ExtractedField } from "@/types/intake";
import type { BidEvaluation, FactorKey } from "@/lib/ai/bid-scoring";
import { SCORING_FACTORS } from "@/lib/ai/bid-scoring";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useWizard } from "./wizard-provider";

export function StepBidDecision() {
  const { state, dispatch } = useWizard();
  const authFetch = useAuthFetch();

  const [bidScoring, setBidScoring] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidOverrides, setBidOverrides] = useState<Partial<Record<FactorKey, number>>>({});

  // Auto-trigger bid evaluation on mount
  const autoScoreTriggered = useRef(false);
  useEffect(() => {
    if (autoScoreTriggered.current) return;
    if (!state.extractedData || state.bidEvaluation || bidScoring || bidError) return;
    autoScoreTriggered.current = true;
    triggerBidScoring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerBidScoring = async () => {
    if (!state.extractedData) return;
    setBidScoring(true);
    setBidError(null);

    try {
      const ext = state.extractedData.extracted as Record<string, ExtractedField<string | string[]> | undefined>;
      const rfpRequirements = {
        title: state.extractedData.input_summary,
        agency: ext?.client_name?.value,
        deadline: ext?.timeline?.value,
        budget_range: ext?.budget_range?.value,
        scope: ext?.scope_description?.value,
        requirements: ext?.key_requirements?.value,
        evaluation_criteria: ext?.decision_criteria?.value,
        compliance_requirements: ext?.compliance_requirements?.value,
        technical_environment: ext?.technical_environment?.value,
        source_text: state.extractedData.source_text ? String(state.extractedData.source_text).slice(0, 4000) : undefined,
      };

      const response = await authFetch("/api/intake/bid-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfp_requirements: rfpRequirements,
          service_line: ext?.opportunity_type?.value || "other",
          industry: ext?.client_industry?.value,
        }),
      });

      if (!response.ok) {
        let serverMessage = `Server returned ${response.status}`;
        try {
          const errorBody = await response.json();
          serverMessage = errorBody.error || errorBody.message || serverMessage;
        } catch {
          serverMessage = `${response.status} ${response.statusText}`;
        }
        throw new Error(serverMessage);
      }

      const data = await response.json();
      dispatch({
        type: "BID_EVALUATION_UPDATE",
        payload: { bidEvaluation: data.evaluation, bidPhase: "review" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setBidError(message);
    } finally {
      setBidScoring(false);
    }
  };

  const handleOverrideChange = (key: FactorKey, value: number | undefined) => {
    if (value === undefined) {
      const next = { ...bidOverrides };
      delete next[key];
      setBidOverrides(next);
    } else {
      setBidOverrides((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleDecision = (decision: "proceed" | "skip") => {
    if (state.bidEvaluation) {
      let finalEvaluation = { ...state.bidEvaluation };
      finalEvaluation.user_decision = decision;
      finalEvaluation.decided_at = new Date().toISOString();
      if (Object.keys(bidOverrides).length > 0) {
        finalEvaluation = { ...finalEvaluation, user_scores: bidOverrides };
      }
      dispatch({
        type: "BID_EVALUATION_UPDATE",
        payload: { bidEvaluation: finalEvaluation, bidPhase: "decided" },
      });
    } else {
      // No evaluation (skipped or errored) -- just mark as decided
      dispatch({
        type: "BID_EVALUATION_UPDATE",
        payload: { bidPhase: "decided" },
      });
    }
  };

  // Compute current score with overrides
  const computeTotal = useCallback((): number => {
    if (!state.bidEvaluation) return 0;
    let total = 0;
    for (const factor of SCORING_FACTORS) {
      const score = bidOverrides[factor.key] ?? state.bidEvaluation.ai_scores[factor.key]?.score ?? 50;
      total += score * (factor.weight / 100);
    }
    return Math.round(total * 100) / 100;
  }, [state.bidEvaluation, bidOverrides]);

  const currentTotal = computeTotal();
  const recommendation: "bid" | "evaluate" | "pass" =
    currentTotal > 70 ? "bid" : currentTotal >= 40 ? "evaluate" : "pass";

  const recColors = {
    bid: { text: "text-[var(--success)]", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800" },
    evaluate: { text: "text-[var(--warning)]", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800" },
    pass: { text: "text-[var(--danger)]", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800" },
  };
  const recLabels = { bid: "Recommended to Bid", evaluate: "Evaluate Further", pass: "Recommended to Pass" };

  // No extracted data
  if (!state.extractedData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Target className="h-12 w-12 text-[var(--foreground-muted)] mb-4" />
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">No Data to Evaluate</h2>
        <p className="text-sm text-[var(--foreground-muted)]">Go back to upload or paste your RFP content first.</p>
      </div>
    );
  }

  // Loading state
  if (bidScoring) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">Analyzing Opportunity</h2>
          <p className="text-sm text-[var(--foreground-muted)]">Scoring this opportunity against your capabilities...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (bidError && !state.bidEvaluation) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl border border-[var(--danger-muted)] bg-[var(--danger-subtle)] p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger)]/10">
              <Target className="h-7 w-7 text-[var(--danger)]" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Scoring Failed</h3>
          <p className="text-sm text-[var(--foreground-muted)] mb-6">{bidError}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={triggerBidScoring} className="btn-primary text-sm">Try Again</button>
            <button onClick={() => handleDecision("skip")} className="btn-secondary text-sm">Skip Evaluation</button>
          </div>
        </div>
      </div>
    );
  }

  // Already decided -- show summary with option to re-evaluate
  if (state.bidPhase === "decided") {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
              <Target className="h-7 w-7 text-[var(--accent)]" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-1">Bid Decision Confirmed</h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            {state.bidEvaluation
              ? `Score: ${currentTotal.toFixed(0)}/100 -- ${recLabels[recommendation]}`
              : "Evaluation skipped"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-[var(--foreground-muted)]">
            Click <span className="font-medium text-[var(--foreground)]">Continue to Configure</span> to proceed, or re-evaluate below.
          </p>
        </div>
        <div className="text-center">
          <button
            onClick={() => {
              dispatch({ type: "BID_EVALUATION_UPDATE", payload: { bidPhase: "review" } });
            }}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Re-evaluate scores
          </button>
        </div>
      </div>
    );
  }

  // Main scoring view
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
            <Target className="h-7 w-7 text-[var(--accent)]" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-1">Should you bid this?</h2>
        <p className="text-sm text-[var(--foreground-muted)]">
          AI-scored based on your capabilities. Adjust any factor, then confirm.
        </p>
      </div>

      {state.bidEvaluation && (
        <>
          {/* Recommendation banner */}
          <div className={`rounded-xl border ${recColors[recommendation].border} ${recColors[recommendation].bg} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold" style={{ color: `var(--${recommendation === "bid" ? "success" : recommendation === "evaluate" ? "warning" : "danger"})` }}>
                  {currentTotal.toFixed(0)}
                  <span className="text-base font-normal text-[var(--foreground-muted)]"> / 100</span>
                </p>
              </div>
              <span className={`text-sm font-bold ${recColors[recommendation].text}`}>
                {recLabels[recommendation]}
              </span>
            </div>
          </div>

          {/* Factor scores */}
          <div className="space-y-3">
            {SCORING_FACTORS.map((factor) => {
              const aiScore = state.bidEvaluation!.ai_scores[factor.key]?.score ?? 50;
              const rationale = state.bidEvaluation!.ai_scores[factor.key]?.rationale ?? "";
              const overrideValue = bidOverrides[factor.key];
              const displayScore = overrideValue ?? aiScore;

              return (
                <div key={factor.key} className="p-4 rounded-xl border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {factor.label}
                      <span className="ml-1 text-xs text-[var(--foreground-muted)]">({factor.weight}%)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {overrideValue !== undefined && (
                        <button
                          onClick={() => handleOverrideChange(factor.key, undefined)}
                          className="text-xs text-[var(--accent)] hover:underline"
                        >
                          Reset
                        </button>
                      )}
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={displayScore}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                          handleOverrideChange(factor.key, val);
                        }}
                        className="w-14 rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1 text-center text-xs font-bold"
                      />
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--border)] mb-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${displayScore}%`,
                        backgroundColor:
                          displayScore > 70 ? "var(--success)" : displayScore >= 40 ? "var(--warning)" : "var(--danger)",
                      }}
                    />
                  </div>
                  {rationale && (
                    <p className="text-xs text-[var(--foreground-muted)]">{rationale}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => handleDecision("skip")}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              Skip Evaluation
            </button>
            <button
              onClick={() => handleDecision("proceed")}
              className="flex items-center gap-2 bg-[var(--accent)] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all shadow-[0_0_16px_var(--accent-subtle)]"
            >
              Confirm & Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
