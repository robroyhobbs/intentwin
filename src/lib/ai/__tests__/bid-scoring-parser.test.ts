/**
 * Tests for bid scoring response parsing.
 *
 * The parser must handle diverse AI response formats:
 * - Clean JSON in markdown code blocks
 * - Raw JSON without code fences
 * - JSON with preamble text before/after
 * - String-typed scores ("75" instead of 75)
 * - Truncated / unparseable responses
 */
import { describe, it, expect } from "vitest";
import { extractJsonFromResponse } from "@/lib/utils/extract-json";

const VALID_SCORES = {
  requirement_match: { score: 85, rationale: "Strong alignment with IT managed services scope." },
  past_performance: { score: 78, rationale: "GMU engagement is directly relevant." },
  capability_alignment: { score: 90, rationale: "CCIE certification and federal experience match perfectly." },
  timeline_feasibility: { score: 65, rationale: "Timeline is tight but achievable with current team." },
  strategic_value: { score: 72, rationale: "Government education sector aligns with growth targets." },
};

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH — Clean JSON Responses
// ════════════════════════════════════════════════════════════════════════════

describe("extractJsonFromResponse — Happy Path", () => {
  it("parses JSON wrapped in ```json code block", () => {
    const response = "```json\n" + JSON.stringify(VALID_SCORES, null, 2) + "\n```";
    const result = extractJsonFromResponse(response);
    expect(result).toEqual(VALID_SCORES);
  });

  it("parses JSON wrapped in ``` code block (no json tag)", () => {
    const response = "```\n" + JSON.stringify(VALID_SCORES) + "\n```";
    const result = extractJsonFromResponse(response);
    expect(result).toEqual(VALID_SCORES);
  });

  it("parses raw JSON with no code fences", () => {
    const response = JSON.stringify(VALID_SCORES);
    const result = extractJsonFromResponse(response);
    expect(result).toEqual(VALID_SCORES);
  });

  it("parses pretty-printed raw JSON", () => {
    const response = JSON.stringify(VALID_SCORES, null, 2);
    const result = extractJsonFromResponse(response);
    expect(result).toEqual(VALID_SCORES);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES — Messy AI Responses
// ════════════════════════════════════════════════════════════════════════════

describe("extractJsonFromResponse — Edge Cases", () => {
  it("handles preamble text before JSON", () => {
    const response =
      "Here is my analysis based on the RFP and company context:\n\n" +
      JSON.stringify(VALID_SCORES, null, 2);
    const result = extractJsonFromResponse(response);
    expect(result).toEqual(VALID_SCORES);
  });

  it("handles preamble text before code block", () => {
    const response =
      "I'll evaluate each factor carefully.\n\n```json\n" +
      JSON.stringify(VALID_SCORES, null, 2) +
      "\n```\n\nLet me know if you need clarification.";
    const result = extractJsonFromResponse(response);
    expect(result).toEqual(VALID_SCORES);
  });

  it("handles trailing text after JSON", () => {
    const response =
      JSON.stringify(VALID_SCORES, null, 2) +
      "\n\nI recommend pursuing this opportunity.";
    const result = extractJsonFromResponse(response);
    expect(result).toEqual(VALID_SCORES);
  });

  it("handles JSON with both preamble and trailing text", () => {
    const response =
      "Analysis:\n" +
      JSON.stringify(VALID_SCORES) +
      "\nRecommendation: Bid.";
    const result = extractJsonFromResponse(response);
    expect(result).toEqual(VALID_SCORES);
  });

  it("handles whitespace around code block", () => {
    const response =
      "\n\n```json\n  " +
      JSON.stringify(VALID_SCORES) +
      "  \n```\n\n";
    const result = extractJsonFromResponse(response);
    expect(result).toEqual(VALID_SCORES);
  });

  it("returns null for completely unparseable response", () => {
    const response = "I cannot evaluate this RFP because the document is empty.";
    const result = extractJsonFromResponse(response);
    expect(result).toBeNull();
  });

  it("returns null for empty response", () => {
    expect(extractJsonFromResponse("")).toBeNull();
  });

  it("returns null for truncated JSON", () => {
    const truncated = JSON.stringify(VALID_SCORES).slice(0, 50);
    const result = extractJsonFromResponse(truncated);
    expect(result).toBeNull();
  });

  it("recovers a valid nested object from truncated code block content", () => {
    const response = "```json\n" + JSON.stringify(VALID_SCORES).slice(0, 100);
    // No closing ```, and truncated JSON
    const result = extractJsonFromResponse(response);
    expect(result).not.toBeNull();
    expect(result).toEqual(VALID_SCORES.requirement_match);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SCORE VALIDATION
// ════════════════════════════════════════════════════════════════════════════

describe("Score validation patterns", () => {
  it("handles string-typed scores from AI", () => {
    const withStringScores = {
      requirement_match: { score: "85", rationale: "Good match." },
      past_performance: { score: "78", rationale: "Relevant." },
      capability_alignment: { score: "90", rationale: "Excellent." },
      timeline_feasibility: { score: "65", rationale: "Tight." },
      strategic_value: { score: "72", rationale: "Aligned." },
    };
    const response = JSON.stringify(withStringScores);
    const result = extractJsonFromResponse(response);
    expect(result).not.toBeNull();
    // Verify the scores are strings (the parser function in bid-scoring.ts handles coercion)
    expect((result as Record<string, Record<string, unknown>>).requirement_match.score).toBe("85");
  });

  it("handles missing rationale field", () => {
    const noRationale = {
      requirement_match: { score: 85 },
      past_performance: { score: 78 },
      capability_alignment: { score: 90 },
      timeline_feasibility: { score: 65 },
      strategic_value: { score: 72 },
    };
    const response = "```json\n" + JSON.stringify(noRationale) + "\n```";
    const result = extractJsonFromResponse(response);
    expect(result).not.toBeNull();
    expect((result as Record<string, Record<string, unknown>>).requirement_match.score).toBe(85);
  });

  it("handles extra fields gracefully", () => {
    const withExtras = {
      ...VALID_SCORES,
      overall_summary: "This is a strong opportunity.",
      confidence: 0.85,
    };
    const response = JSON.stringify(withExtras);
    const result = extractJsonFromResponse(response);
    expect(result).not.toBeNull();
    expect((result as Record<string, unknown>).requirement_match).toEqual(VALID_SCORES.requirement_match);
  });
});
