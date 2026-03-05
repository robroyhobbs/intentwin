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

  it("returns true when majority of factors are fallbacks (4/5)", () => {
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

    // 4 of 5 are fallbacks — exceeds ceil(5/2)=3 threshold
    expect(isParseFallbackBidEvaluation(evaluation)).toBe(true);
  });

  it("returns false when majority of factors are real (3/5)", () => {
    const evaluation = {
      ...baseEvaluation,
      ai_scores: {
        requirement_match: { score: 65, rationale: "Strong fit." },
        past_performance: { score: 70, rationale: "Solid track record." },
        capability_alignment: { score: 80, rationale: "Well aligned." },
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

    // Only 2 of 5 are fallbacks — below ceil(5/2)=3 threshold
    expect(isParseFallbackBidEvaluation(evaluation)).toBe(false);
  });
});
