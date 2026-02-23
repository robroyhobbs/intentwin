/**
 * Tests for buildBidEvalRiskBlock — the function that injects bid evaluation
 * weak-factor guidance into section generation prompts.
 */
import { describe, it, expect } from "vitest";
import { buildBidEvalRiskBlock } from "../functions/generate-single-section";
import type { BidEvaluation } from "@/lib/ai/bid-scoring";

function makeBidEval(overrides: Partial<Record<string, { score: number; rationale: string }>> = {}): BidEvaluation {
  const defaults: BidEvaluation["ai_scores"] = {
    requirement_match: { score: 80, rationale: "Strong requirement alignment." },
    past_performance: { score: 75, rationale: "Decent portfolio of work." },
    capability_alignment: { score: 70, rationale: "Good capability overlap." },
    timeline_feasibility: { score: 65, rationale: "Timeline is tight but doable." },
    strategic_value: { score: 60, rationale: "Moderate strategic fit." },
  };

  return {
    ai_scores: { ...defaults, ...overrides } as BidEvaluation["ai_scores"],
    weighted_total: 72,
    recommendation: "bid",
    scored_at: new Date().toISOString(),
  };
}

describe("buildBidEvalRiskBlock", () => {
  it("returns empty string when bidEvaluation is null", () => {
    expect(buildBidEvalRiskBlock(null, "approach")).toBe("");
  });

  it("returns empty string when bidEvaluation is undefined", () => {
    expect(buildBidEvalRiskBlock(undefined, "approach")).toBe("");
  });

  it("returns empty string when all scores are above threshold", () => {
    const eval_ = makeBidEval(); // all >= 60
    expect(buildBidEvalRiskBlock(eval_, "approach")).toBe("");
  });

  it("returns risk block for weak past_performance on case_studies section", () => {
    const eval_ = makeBidEval({
      past_performance: { score: 35, rationale: "No relevant case studies in healthcare." },
    });
    const block = buildBidEvalRiskBlock(eval_, "case_studies");
    expect(block).toContain("BID RISK AREAS");
    expect(block).toContain("Past Performance");
    expect(block).toContain("35/100");
    expect(block).toContain("No relevant case studies in healthcare.");
  });

  it("does NOT inject past_performance risk into unrelated section (timeline)", () => {
    const eval_ = makeBidEval({
      past_performance: { score: 35, rationale: "No relevant case studies." },
    });
    const block = buildBidEvalRiskBlock(eval_, "timeline");
    expect(block).toBe("");
  });

  it("injects timeline_feasibility risk into approach section", () => {
    const eval_ = makeBidEval({
      timeline_feasibility: { score: 40, rationale: "6-week timeline is aggressive." },
    });
    const block = buildBidEvalRiskBlock(eval_, "approach");
    expect(block).toContain("Timeline Feasibility");
    expect(block).toContain("40/100");
    expect(block).toContain("6-week timeline is aggressive.");
  });

  it("injects multiple weak factors into relevant section", () => {
    const eval_ = makeBidEval({
      requirement_match: { score: 30, rationale: "Missing key requirements." },
      capability_alignment: { score: 45, rationale: "Partial capability overlap." },
    });
    const block = buildBidEvalRiskBlock(eval_, "approach");
    expect(block).toContain("Requirement Match");
    expect(block).toContain("Capability Alignment");
    expect(block).toContain("30/100");
    expect(block).toContain("45/100");
  });

  it("injects strategic_value risk into executive_summary", () => {
    const eval_ = makeBidEval({
      strategic_value: { score: 20, rationale: "Not aligned with growth areas." },
    });
    const block = buildBidEvalRiskBlock(eval_, "executive_summary");
    expect(block).toContain("Strategic Value");
    expect(block).toContain("20/100");
  });

  it("handles rfp_task section type (maps to requirement_match)", () => {
    const eval_ = makeBidEval({
      requirement_match: { score: 25, rationale: "Many gaps in task requirements." },
    });
    const block = buildBidEvalRiskBlock(eval_, "rfp_task");
    expect(block).toContain("Requirement Match");
    expect(block).toContain("25/100");
  });

  it("includes actionable guidance in the risk block", () => {
    const eval_ = makeBidEval({
      past_performance: { score: 30, rationale: "No relevant experience." },
    });
    const block = buildBidEvalRiskBlock(eval_, "case_studies");
    expect(block).toContain("proactively address");
    expect(block).toContain("evidence, metrics, or examples");
  });

  it("returns empty for edge case: scores exactly at threshold (60)", () => {
    const eval_ = makeBidEval({
      past_performance: { score: 60, rationale: "Exactly at threshold." },
    });
    // 60 is NOT below threshold, so no risk block
    expect(buildBidEvalRiskBlock(eval_, "case_studies")).toBe("");
  });

  it("returns risk block for score at 59 (just below threshold)", () => {
    const eval_ = makeBidEval({
      past_performance: { score: 59, rationale: "Just below threshold." },
    });
    const block = buildBidEvalRiskBlock(eval_, "case_studies");
    expect(block).toContain("Past Performance");
    expect(block).toContain("59/100");
  });
});
