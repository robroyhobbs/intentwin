import { describe, it, expect } from "vitest";
import {
  computeCapabilityAlignment,
  type L1Summary,
} from "../capability-alignment";
import type { BidEvaluation, FactorKey, FactorScore } from "../../bid-scoring";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeAiScores(baseScore = 50): Record<FactorKey, FactorScore> {
  return {
    requirement_match: { score: baseScore, rationale: "test" },
    past_performance: { score: baseScore, rationale: "test" },
    capability_alignment: { score: baseScore, rationale: "test" },
    timeline_feasibility: { score: baseScore, rationale: "test" },
    strategic_value: { score: baseScore, rationale: "test" },
  };
}

function makeBidEvaluation(
  weightedTotal: number,
  aiScores?: Record<FactorKey, FactorScore>,
): BidEvaluation {
  return {
    ai_scores: aiScores ?? makeAiScores(),
    weighted_total: weightedTotal,
    recommendation: weightedTotal > 70 ? "bid" : weightedTotal >= 40 ? "evaluate" : "pass",
    scored_at: new Date().toISOString(),
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("computeCapabilityAlignment", () => {
  it('returns "high" when bid score > 70 and no l1Summary provided', () => {
    const result = computeCapabilityAlignment(makeBidEvaluation(85));
    expect(result.level).toBe("high");
  });

  it('returns "moderate" when bid score is between 50-70', () => {
    const result = computeCapabilityAlignment(makeBidEvaluation(60));
    expect(result.level).toBe("moderate");
  });

  it('returns "low" when bid score < 50', () => {
    const result = computeCapabilityAlignment(makeBidEvaluation(30));
    expect(result.level).toBe("low");
  });

  it('returns "low" when l1Summary shows zero evidence AND zero products', () => {
    const l1: L1Summary = { evidenceCount: 0, productCount: 0, teamMemberCount: 5 };
    const result = computeCapabilityAlignment(makeBidEvaluation(85), l1);
    expect(result.level).toBe("low");
  });

  it('returns "moderate" when l1Summary has 1 evidence item', () => {
    const l1: L1Summary = { evidenceCount: 1, productCount: 3, teamMemberCount: 5 };
    const result = computeCapabilityAlignment(makeBidEvaluation(85), l1);
    expect(result.level).toBe("moderate");
  });

  it("skips L1 data checks when l1Summary is undefined (bases decision on bid score only)", () => {
    // High bid score + no l1Summary → should be "high", not penalized for missing data
    const result = computeCapabilityAlignment(makeBidEvaluation(85));
    expect(result.level).toBe("high");
    expect(result.reasons).not.toContainEqual(
      expect.stringContaining("No case studies"),
    );
    expect(result.reasons).not.toContainEqual(
      expect.stringContaining("No products"),
    );
  });

  it("populates reasons array correctly for each alignment level", () => {
    // Low bid score
    const low = computeCapabilityAlignment(makeBidEvaluation(30));
    expect(low.reasons.length).toBeGreaterThan(0);
    expect(low.reasons[0]).toContain("below the 50-point threshold");

    // Moderate bid score
    const moderate = computeCapabilityAlignment(makeBidEvaluation(60));
    expect(moderate.reasons.length).toBeGreaterThan(0);
    expect(moderate.reasons[0]).toContain("moderate alignment");

    // High bid score — no bid-score-related reasons
    const high = computeCapabilityAlignment(makeBidEvaluation(85));
    expect(high.reasons.length).toBe(0);
  });

  it("populates sectionRisks for evidence/product-dependent sections when data is thin", () => {
    const l1: L1Summary = { evidenceCount: 0, productCount: 0, teamMemberCount: 0 };
    const result = computeCapabilityAlignment(makeBidEvaluation(85), l1);

    // Evidence-dependent sections
    expect(result.sectionRisks).toContain("Case Studies & Past Performance");
    expect(result.sectionRisks).toContain("Executive Summary");
    expect(result.sectionRisks).toContain("Why Us / Differentiators");
    expect(result.sectionRisks).toContain("Cover Letter");

    // Product-dependent sections
    expect(result.sectionRisks).toContain("Technical Solution");
    expect(result.sectionRisks).toContain("Timeline & Milestones");

    // Approach & Methodology appears in both lists — should appear once
    expect(
      result.sectionRisks.filter((s) => s === "Approach & Methodology").length,
    ).toBe(1);
  });

  it("handles null bidEvaluation gracefully", () => {
    const result = computeCapabilityAlignment(null);
    // With null bidEvaluation and no l1Summary, bidScore is null and no L1 checks
    // Neither isLowBid nor noData is true, so it falls to "high" (default)
    expect(result.level).toBe("high");
    expect(result.bidScore).toBeNull();
    expect(result.evidenceCount).toBe(0);
    expect(result.productCount).toBe(0);
  });

  it("handles null bidEvaluation with l1Summary showing no data as low", () => {
    const l1: L1Summary = { evidenceCount: 0, productCount: 0, teamMemberCount: 0 };
    const result = computeCapabilityAlignment(null, l1);
    expect(result.level).toBe("low");
    expect(result.bidScore).toBeNull();
  });

  it("adds weak scoring factor reasons when individual ai_scores are below 50", () => {
    const scores = makeAiScores(80);
    scores.past_performance = { score: 30, rationale: "No relevant case studies" };
    const eval_ = makeBidEvaluation(70, scores);
    // weighted_total is set explicitly, but ai_scores has a weak factor
    const result = computeCapabilityAlignment(eval_);
    expect(result.reasons).toContainEqual(
      expect.stringContaining("Past Performance"),
    );
  });

  it("returns correct evidenceCount and productCount from l1Summary", () => {
    const l1: L1Summary = { evidenceCount: 5, productCount: 3, teamMemberCount: 10 };
    const result = computeCapabilityAlignment(makeBidEvaluation(85), l1);
    expect(result.evidenceCount).toBe(5);
    expect(result.productCount).toBe(3);
  });
});
