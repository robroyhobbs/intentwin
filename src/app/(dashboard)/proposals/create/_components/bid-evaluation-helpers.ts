import type { BidEvaluation } from "@/lib/ai/bid-scoring";

const FALLBACK_MARKERS = [
  "ai response could not be parsed",
  "could not be scored",
  "insufficient data",
];

export function isParseFallbackBidEvaluation(
  evaluation: BidEvaluation | null | undefined,
): boolean {
  if (!evaluation?.ai_scores) return false;

  const scores = Object.values(evaluation.ai_scores);
  if (scores.length === 0) return false;

  // Detect if ANY factor has a fallback marker (not just all)
  const fallbackCount = scores.filter(
    (item) =>
      item.score === 50 &&
      typeof item.rationale === "string" &&
      FALLBACK_MARKERS.some((m) => item.rationale.toLowerCase().includes(m)),
  ).length;

  // If more than half the factors are fallbacks, trigger auto-retry
  return fallbackCount >= Math.ceil(scores.length / 2);
}
