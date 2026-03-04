import type { BidEvaluation } from "@/lib/ai/bid-scoring";

const PARSE_FAILURE_MARKER = "ai response could not be parsed";

export function isParseFallbackBidEvaluation(
  evaluation: BidEvaluation | null | undefined,
): boolean {
  if (!evaluation?.ai_scores) return false;

  const scores = Object.values(evaluation.ai_scores);
  if (scores.length === 0) return false;

  return scores.every(
    (item) =>
      item.score === 50 &&
      typeof item.rationale === "string" &&
      item.rationale.toLowerCase().includes(PARSE_FAILURE_MARKER),
  );
}
