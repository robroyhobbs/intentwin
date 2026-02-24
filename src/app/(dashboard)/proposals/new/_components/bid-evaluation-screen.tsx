"use client";

import {
  Loader2,
  ArrowRight,
  X,
  Target,
  AlertTriangle,
  Globe,
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import type { BidEvaluation, FactorKey, BidIntelligenceContext } from "@/lib/ai/bid-scoring";
import type { WinProbabilityResponse } from "@/lib/intelligence/types";
import { SCORING_FACTORS } from "@/lib/ai/bid-scoring";

const recConfig = {
  bid: {
    label: "Recommended to Bid",
    description: "Strong alignment between your capabilities and this opportunity. You have a competitive advantage.",
    color: "var(--success)",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  evaluate: {
    label: "Evaluate Further",
    description: "Mixed signals \u2014 some areas align well, others have gaps. Review the factor scores below to decide if you can address the weak areas before bidding.",
    color: "var(--warning)",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
  pass: {
    label: "Recommended to Pass",
    description: "Significant gaps between your capabilities and what this RFP requires. Consider whether this opportunity is worth the pursuit cost.",
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
          Score this opportunity against your capabilities to decide whether
          to pursue it
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
                className={`rounded-xl border ${rec.border} ${rec.bg} p-6`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground-muted)]">
                      Overall Score
                    </p>
                    <p
                      className="text-3xl font-bold mt-1"
                      style={{ color: rec.color }}
                    >
                      {currentTotal.toFixed(1)}
                      <span className="text-base font-normal text-[var(--foreground-muted)]"> / 100</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-lg font-bold"
                      style={{ color: rec.color }}
                    >
                      {rec.label}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">
                      Weighted average of 5 factors below
                      {bidEvaluation.intelligence?.has_agency_profile && bidEvaluation.intelligence.agency_total_awards && bidEvaluation.intelligence.agency_total_awards > 0 && (
                        <span className="text-[var(--accent)]">
                          {" "}+ {bidEvaluation.intelligence.agency_total_awards.toLocaleString()} tracked awards
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[var(--foreground-muted)]">
                  {rec.description}
                </p>
                <div className="mt-2 flex gap-4 text-[10px] text-[var(--foreground-subtle)]">
                  <span>Above 70 = Bid</span>
                  <span>40-70 = Evaluate</span>
                  <span>Below 40 = Pass</span>
                </div>
              </div>

              {/* Win Probability */}
              {bidEvaluation.intelligence?.win_probability && (
                <WinProbabilityPanel winProb={bidEvaluation.intelligence.win_probability} />
              )}

              {/* Intelligence context */}
              {bidEvaluation.intelligence && (bidEvaluation.intelligence.has_agency_profile || bidEvaluation.intelligence.has_pricing_data) && (
                <IntelligencePanel intelligence={bidEvaluation.intelligence} />
              )}

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

function WinProbabilityPanel({ winProb }: { winProb: WinProbabilityResponse }) {
  const pct = Math.round((winProb.probability || 0) * 100);
  const color =
    pct >= 50
      ? "var(--success)"
      : pct >= 25
        ? "var(--warning)"
        : "var(--danger)";

  const confidenceConfig = {
    high: { label: "High Confidence", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
    medium: { label: "Medium Confidence", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
    low: { label: "Low Confidence", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  };
  const conf = confidenceConfig[winProb.confidence] || { label: "Confidence Unknown", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" };

  const helpingFactors = (winProb.factors || []).filter((f) => f.impact > 0);
  const hurtingFactors = (winProb.factors || []).filter((f) => f.impact < 0);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-[var(--accent)]" />
          <span className="text-sm font-semibold text-[var(--foreground)]">
            Win Likelihood
          </span>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${conf.bg} ${conf.text}`}>
          <ShieldCheck className="h-3 w-3" />
          {conf.label}
        </span>
      </div>

      {/* Win probability gauge */}
      <div className="flex items-center gap-6 mb-4">
        <div className="relative flex items-center justify-center">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="var(--border)"
              strokeWidth="8"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={`${(pct / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              className="transition-all duration-700"
            />
          </svg>
          <span
            className="absolute text-xl font-bold"
            style={{ color }}
          >
            {pct}%
          </span>
        </div>
        <div>
          <p className="text-sm text-[var(--foreground)]">
            Based on <strong>{winProb.matching_awards || 0}</strong> similar historical awards
          </p>
          {(winProb.comparable_awards || []).length > 0 && (
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              {winProb.comparable_awards.length} comparable awards analyzed
            </p>
          )}
        </div>
      </div>

      {/* Factor breakdown */}
      {(helpingFactors.length > 0 || hurtingFactors.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {helpingFactors.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-[var(--success)]" />
                <span className="text-xs font-medium text-[var(--success)]">Helps</span>
              </div>
              <div className="space-y-1">
                {helpingFactors.map((f, i) => (
                  <div key={i} className="text-xs text-[var(--foreground-muted)]">
                    <strong className="text-[var(--foreground)]">{f.name}</strong>
                    <span className="text-[var(--success)]"> +{Math.round(f.impact * 100)}%</span>
                    <p className="text-[var(--foreground-muted)]">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {hurtingFactors.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <TrendingDown className="h-3.5 w-3.5 text-[var(--danger)]" />
                <span className="text-xs font-medium text-[var(--danger)]">Hurts</span>
              </div>
              <div className="space-y-1">
                {hurtingFactors.map((f, i) => (
                  <div key={i} className="text-xs text-[var(--foreground-muted)]">
                    <strong className="text-[var(--foreground)]">{f.name}</strong>
                    <span className="text-[var(--danger)]"> {Math.round(f.impact * 100)}%</span>
                    <p className="text-[var(--foreground-muted)]">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IntelligencePanel({ intelligence }: { intelligence: BidIntelligenceContext }) {
  const formatCurrency = (v: number | null) => {
    if (v == null) return null;
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toLocaleString()}`;
  };

  return (
    <div className="rounded-xl border border-[var(--accent-muted)] bg-[var(--accent-subtle)] p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-sm font-semibold text-[var(--foreground)]">
            Procurement Intelligence
          </span>
        </div>
      </div>
      <p className="text-xs text-[var(--foreground-muted)] mb-3">
        This data informed the scoring above and will be used during proposal generation to tailor competitive positioning, pricing guidance, and win strategy.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {intelligence.has_agency_profile && (
          <>
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-[var(--foreground-subtle)]" />
              <span className="text-xs text-[var(--foreground-muted)]">
                <strong className="text-[var(--foreground)]">{intelligence.agency_name}</strong>
              </span>
            </div>
            {intelligence.agency_eval_method && (
              <div className="text-xs text-[var(--foreground-muted)]">
                Eval Method: <strong className="text-[var(--foreground)]">{intelligence.agency_eval_method}</strong>
              </div>
            )}
            {intelligence.agency_avg_offers != null && !isNaN(Number(intelligence.agency_avg_offers)) && (
              <div className="text-xs text-[var(--foreground-muted)]">
                Avg Competing Offers: <strong className="text-[var(--foreground)]">{Number(intelligence.agency_avg_offers).toFixed(1)}</strong>
              </div>
            )}
            {intelligence.agency_avg_amount != null && (
              <div className="text-xs text-[var(--foreground-muted)]">
                Avg Award: <strong className="text-[var(--foreground)]">{formatCurrency(intelligence.agency_avg_amount)}</strong>
              </div>
            )}
          </>
        )}
        {intelligence.has_pricing_data && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-[var(--foreground-subtle)]" />
            <span className="text-xs text-[var(--foreground-muted)]">
              <strong className="text-[var(--foreground)]">{intelligence.pricing_categories_found}</strong> rate benchmarks matched
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
