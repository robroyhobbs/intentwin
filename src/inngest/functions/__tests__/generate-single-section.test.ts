import { describe, it, expect } from "vitest";
import {
  buildBidEvalRiskBlock,
  buildRepetitionLimiterBlock,
} from "../generate-single-section";
import type { BidEvaluation } from "@/lib/ai/bid-scoring";

// ── Helper: build a minimal BidEvaluation with all factors at 100 ────────────
function makeBidEval(
  overrides: Partial<Record<string, { score: number; rationale: string }>> = {},
): BidEvaluation {
  const defaults: BidEvaluation["ai_scores"] = {
    requirement_match: { score: 100, rationale: "Strong match" },
    past_performance: { score: 100, rationale: "Strong past performance" },
    capability_alignment: { score: 100, rationale: "Well aligned" },
    timeline_feasibility: { score: 100, rationale: "Feasible" },
    strategic_value: { score: 100, rationale: "High strategic value" },
  };
  return {
    ai_scores: { ...defaults, ...overrides },
    weighted_total: 80,
    recommendation: "bid",
    scored_at: new Date().toISOString(),
  };
}

// ── buildBidEvalRiskBlock ────────────────────────────────────────────────────

describe("buildBidEvalRiskBlock", () => {
  it("returns empty string for null bid evaluation", () => {
    expect(buildBidEvalRiskBlock(null, "approach")).toBe("");
  });

  it("returns empty string for undefined bid evaluation", () => {
    expect(buildBidEvalRiskBlock(undefined, "approach")).toBe("");
  });

  it("returns empty string when no weak factors match the section type", () => {
    // All scores are 100, none are below the 60 threshold
    const eval_ = makeBidEval();
    expect(buildBidEvalRiskBlock(eval_, "approach")).toBe("");
  });

  it("returns empty string when weak factor does not map to the section type", () => {
    // past_performance is weak but maps to case_studies/why_us, not executive_summary
    const eval_ = makeBidEval({
      past_performance: { score: 30, rationale: "No prior work" },
    });
    expect(buildBidEvalRiskBlock(eval_, "executive_summary")).toBe("");
  });

  it("returns risk block when there is a weak factor matching the section type", () => {
    // requirement_match maps to "approach" and score < 60
    const eval_ = makeBidEval({
      requirement_match: { score: 40, rationale: "Missing key requirements" },
    });
    const result = buildBidEvalRiskBlock(eval_, "approach");
    expect(result).toContain("BID RISK AREAS");
    expect(result).toContain("Requirement Match");
    expect(result).toContain("40/100");
  });

  it("includes the factor's rationale in the risk block", () => {
    const eval_ = makeBidEval({
      capability_alignment: {
        score: 25,
        rationale: "Team lacks cloud certifications",
      },
    });
    const result = buildBidEvalRiskBlock(eval_, "approach");
    expect(result).toContain("Team lacks cloud certifications");
  });

  it("includes multiple weak factors when several affect the same section", () => {
    // Both requirement_match and capability_alignment map to "approach"
    const eval_ = makeBidEval({
      requirement_match: { score: 30, rationale: "Gaps in compliance" },
      capability_alignment: { score: 45, rationale: "Limited expertise" },
    });
    const result = buildBidEvalRiskBlock(eval_, "approach");
    expect(result).toContain("Requirement Match");
    expect(result).toContain("Capability Alignment");
    expect(result).toContain("Gaps in compliance");
    expect(result).toContain("Limited expertise");
  });

  it("does not include factors scoring at exactly 60 (threshold)", () => {
    const eval_ = makeBidEval({
      requirement_match: { score: 60, rationale: "Borderline match" },
    });
    expect(buildBidEvalRiskBlock(eval_, "approach")).toBe("");
  });

  it("includes factors scoring at 59 (just below threshold)", () => {
    const eval_ = makeBidEval({
      requirement_match: { score: 59, rationale: "Slightly below threshold" },
    });
    const result = buildBidEvalRiskBlock(eval_, "approach");
    expect(result).toContain("BID RISK AREAS");
  });
});

// ── buildRepetitionLimiterBlock ──────────────────────────────────────────────

describe("buildRepetitionLimiterBlock", () => {
  it("returns empty string for empty differentiators array", () => {
    expect(buildRepetitionLimiterBlock([])).toBe("");
  });

  it("returns repetition limiter text when differentiators are provided", () => {
    const diffs = ["47 federal migrations"];
    const result = buildRepetitionLimiterBlock(diffs);
    expect(result).toContain("REPETITION LIMITER (MANDATORY)");
    expect(result).toContain("DO NOT re-state these claims verbatim");
  });

  it("includes each differentiator in the output", () => {
    const diffs = ["FedRAMP certified", "200+ cloud migrations", "24/7 NOC"];
    const result = buildRepetitionLimiterBlock(diffs);
    for (const d of diffs) {
      expect(result).toContain(d);
    }
  });

  it("formats differentiators as a bulleted list", () => {
    const diffs = ["Item A", "Item B"];
    const result = buildRepetitionLimiterBlock(diffs);
    expect(result).toContain("  - Item A");
    expect(result).toContain("  - Item B");
  });
});
