"use client";

import { Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { BidEvalData } from "./types";

/** Labels for bid scoring factor keys */
const FACTOR_LABELS: Record<string, string> = {
  requirement_match: "Req Match",
  past_performance: "Past Perf",
  capability_alignment: "Capability",
  timeline_feasibility: "Timeline",
  strategic_value: "Strategic",
};

/** Short labels for narrow displays */
const FACTOR_ORDER = [
  "requirement_match",
  "past_performance",
  "capability_alignment",
  "timeline_feasibility",
  "strategic_value",
];

function getScoreColor(score: number): string {
  if (score >= 70) return "var(--success)";
  if (score >= 40) return "var(--warning)";
  return "var(--error)";
}

function getRecommendationBadge(rec: string) {
  switch (rec) {
    case "bid":
      return {
        label: "BID",
        bg: "bg-emerald-500/15 border-emerald-500/30",
        text: "text-emerald-600 dark:text-emerald-400",
        Icon: TrendingUp,
      };
    case "evaluate":
      return {
        label: "EVALUATE",
        bg: "bg-amber-500/15 border-amber-500/30",
        text: "text-amber-600 dark:text-amber-400",
        Icon: Minus,
      };
    case "pass":
      return {
        label: "PASS",
        bg: "bg-red-500/15 border-red-500/30",
        text: "text-red-600 dark:text-red-400",
        Icon: TrendingDown,
      };
    default:
      return {
        label: rec.toUpperCase(),
        bg: "bg-gray-500/15 border-gray-500/30",
        text: "text-gray-600 dark:text-gray-400",
        Icon: Minus,
      };
  }
}

interface BidEvalBannerProps {
  bidEvaluation: BidEvalData;
}

export function BidEvalBanner({ bidEvaluation }: BidEvalBannerProps) {
  const { weighted_total, recommendation, ai_scores, user_decision } = bidEvaluation;
  const badge = getRecommendationBadge(recommendation);
  const BadgeIcon = badge.Icon;

  return (
    <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3">
      <div className="flex items-center gap-4">
        {/* Score & Recommendation */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[var(--foreground-muted)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">
              Bid Score: {Math.round(weighted_total)}
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${badge.bg} ${badge.text}`}
          >
            <BadgeIcon className="h-3 w-3" />
            {badge.label}
          </span>
          {user_decision && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                user_decision === "proceed"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              {user_decision === "proceed" ? "Proceeding" : "Skipped"}
            </span>
          )}
        </div>

        {/* Factor Mini-Bars */}
        <div className="flex items-center gap-3 flex-1 min-w-0 overflow-x-auto">
          {FACTOR_ORDER.map((key) => {
            const factor = ai_scores[key];
            if (!factor) return null;
            const score = factor.score;
            return (
              <div key={key} className="flex items-center gap-1.5 shrink-0" title={`${FACTOR_LABELS[key]}: ${score}/100 — ${factor.rationale}`}>
                <span className="text-[10px] text-[var(--foreground-muted)] whitespace-nowrap">
                  {FACTOR_LABELS[key]}
                </span>
                <div className="w-12 h-1.5 rounded-full bg-[var(--background-tertiary)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${score}%`,
                      backgroundColor: getScoreColor(score),
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[var(--foreground-muted)]">
                  {score}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
