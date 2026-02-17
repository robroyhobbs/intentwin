"use client";

import {
  Loader2,
  ArrowRight,
  X,
  Target,
  AlertTriangle,
} from "lucide-react";
import type { BidEvaluation, FactorKey } from "@/lib/ai/bid-scoring";
import { SCORING_FACTORS } from "@/lib/ai/bid-scoring";

const recConfig = {
  bid: {
    label: "Recommended to Bid",
    color: "var(--success)",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  evaluate: {
    label: "Evaluate Further",
    color: "var(--warning)",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
  pass: {
    label: "Recommended to Pass",
    color: "var(--danger)",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
  },
};

interface BidEvaluationScreenProps {
  bidEvaluation: BidEvaluation | null;
  bidScoring: boolean;
  bidError: string | null;
  bidOverrides: Partial<Record<FactorKey, number>>;
  setBidOverrides: React.Dispatch<React.SetStateAction<Partial<Record<FactorKey, number>>>>;
  triggerBidScoring: (intakeData: Record<string, unknown>) => void;
  handleBidDecision: (decision: "proceed" | "skip") => void;
  buildIntakeData: () => Record<string, unknown>;
  computeWeightedTotalClient: (
    aiScores: Record<string, { score: number }>,
    overrides: Partial<Record<string, number>>,
  ) => number;
  getRecommendationClient: (total: number) => "bid" | "evaluate" | "pass";
}

export function BidEvaluationScreen({
  bidEvaluation,
  bidScoring,
  bidError,
  bidOverrides,
  setBidOverrides,
  triggerBidScoring,
  handleBidDecision,
  buildIntakeData,
  computeWeightedTotalClient,
  getRecommendationClient,
}: BidEvaluationScreenProps) {
  const currentTotal = bidEvaluation
    ? Object.keys(bidOverrides).length > 0
      ? computeWeightedTotalClient(bidEvaluation.ai_scores, bidOverrides)
      : bidEvaluation.weighted_total
    : 0;
  const currentRec = getRecommendationClient(currentTotal);
  const rec = recConfig[currentRec];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-white shadow-lg">
            <Target className="h-6 w-6" />
          </div>
          Bid / No-Bid Evaluation
        </h1>
        <p className="mt-2 text-[var(--foreground-muted)]">
          AI-assisted scoring to help you decide whether to pursue this
          opportunity
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Loading state */}
          {bidScoring && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
              <p className="text-[var(--foreground-muted)]">
                Analyzing opportunity against your capabilities...
              </p>
            </div>
          )}

          {/* Error state */}
          {bidError && !bidScoring && (
            <div className="rounded-xl border border-[var(--danger)] bg-red-50 dark:bg-red-950/20 p-6 text-center space-y-4">
              <AlertTriangle className="h-8 w-8 text-[var(--danger)] mx-auto" />
              <p className="text-[var(--foreground)]">{bidError}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => triggerBidScoring(buildIntakeData())}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Retry Scoring
                </button>
                <button
                  onClick={() => handleBidDecision("skip")}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  Skip Evaluation
                </button>
              </div>
            </div>
          )}

          {/* Scores display */}
          {bidEvaluation && !bidScoring && (
            <>
              {/* Recommendation banner */}
              <div
                className={`rounded-xl border ${rec.border} ${rec.bg} p-6 flex items-center justify-between`}
              >
                <div>
                  <p className="text-sm font-medium text-[var(--foreground-muted)]">
                    Overall Score
                  </p>
                  <p
                    className="text-3xl font-bold mt-1"
                    style={{ color: rec.color }}
                  >
                    {currentTotal.toFixed(1)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-lg font-bold"
                    style={{ color: rec.color }}
                  >
                    {rec.label}
                  </p>
                  <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    Based on 5-factor weighted analysis
                  </p>
                </div>
              </div>

              {/* Factor scores */}
              <div className="space-y-4">
                {SCORING_FACTORS.map((factor) => {
                  const aiScore =
                    bidEvaluation.ai_scores[factor.key]?.score ?? 50;
                  const rationale =
                    bidEvaluation.ai_scores[factor.key]?.rationale ?? "";
                  const overrideValue = bidOverrides[factor.key];
                  const displayScore = overrideValue ?? aiScore;

                  return (
                    <div
                      key={factor.key}
                      className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-semibold text-[var(--foreground)]">
                            {factor.label}
                          </span>
                          <span className="ml-2 text-xs text-[var(--foreground-muted)]">
                            ({factor.weight}% weight)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {overrideValue !== undefined && (
                            <button
                              onClick={() => {
                                const next = { ...bidOverrides };
                                delete next[factor.key];
                                setBidOverrides(next);
                              }}
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
                              const val = Math.max(
                                0,
                                Math.min(100, parseInt(e.target.value) || 0),
                              );
                              setBidOverrides((prev) => ({
                                ...prev,
                                [factor.key]: val,
                              }));
                            }}
                            className="w-16 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1 text-center text-sm font-bold"
                          />
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="w-full h-2 rounded-full bg-[var(--border)] mb-3">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${displayScore}%`,
                            backgroundColor:
                              displayScore > 70
                                ? "var(--success)"
                                : displayScore >= 40
                                  ? "var(--warning)"
                                  : "var(--danger)",
                          }}
                        />
                      </div>

                      {/* Rationale */}
                      <p className="text-sm text-[var(--foreground-muted)]">
                        {rationale}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-4 pb-8">
                <button
                  onClick={() => handleBidDecision("skip")}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--foreground-muted)] hover:bg-[var(--background-elevated)] transition-all"
                >
                  <X className="h-4 w-4" />
                  Skip This Opportunity
                </button>
                <button
                  onClick={() => handleBidDecision("proceed")}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] px-6 py-3 text-sm font-bold text-white hover:shadow-lg transition-all"
                >
                  <ArrowRight className="h-4 w-4" />
                  Proceed to Proposal
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
