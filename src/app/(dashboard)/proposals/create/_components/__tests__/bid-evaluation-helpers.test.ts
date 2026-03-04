import { describe, expect, it } from "vitest";
import { isParseFallbackBidEvaluation } from "../bid-evaluation-helpers";
import type { BidEvaluation } from "@/lib/ai/bid-scoring";

const baseEvaluation = {
  weighted_total: 50,
  recommendation: "evaluate",
  scored_at: "2026-03-04T00:00:00.000Z",
} as const;

describe("isParseFallbackBidEvaluation", () => {
  it("returns true when all factors are parse-fallback defaults", () => {
    const evaluation = {
      ...baseEvaluation,
      ai_scores: {
        requirement_match: {
          score: 50,
          rationale: "Scoring unavailable — AI response could not be parsed.",
        },
        past_performance: {
          score: 50,
          rationale: "Scoring unavailable — AI response could not be parsed.",
        },
        capability_alignment: {
          score: 50,
          rationale: "Scoring unavailable — AI response could not be parsed.",
        },
        timeline_feasibility: {
          score: 50,
          rationale: "Scoring unavailable — AI response could not be parsed.",
        },
        strategic_value: {
          score: 50,
          rationale: "Scoring unavailable — AI response could not be parsed.",
        },
      },
    } as BidEvaluation;

    expect(isParseFallbackBidEvaluation(evaluation)).toBe(true);
  });

  it("returns false when at least one factor is real", () => {
    const evaluation = {
      ...baseEvaluation,
      ai_scores: {
        requirement_match: { score: 65, rationale: "Strong fit." },
        past_performance: {
          score: 50,
          rationale: "Scoring unavailable — AI response could not be parsed.",
        },
        capability_alignment: {
          score: 50,
          rationale: "Scoring unavailable — AI response could not be parsed.",
        },
        timeline_feasibility: {
          score: 50,
          rationale: "Scoring unavailable — AI response could not be parsed.",
        },
        strategic_value: {
          score: 50,
          rationale: "Scoring unavailable — AI response could not be parsed.",
        },
      },
    } as BidEvaluation;

    expect(isParseFallbackBidEvaluation(evaluation)).toBe(false);
  });
});
