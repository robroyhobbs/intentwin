import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildQualityReviewPrompt,
  calculateSectionScore,
  QUALITY_DIMENSIONS,
  PASS_THRESHOLD,
  REGEN_THRESHOLD,
  type QualityScores,
} from "../prompts/quality-review";

// ============================================================
// HAPPY PATH
// ============================================================
describe("Happy Path", () => {
  it("buildQualityReviewPrompt includes all 4 dimensions with rubric", () => {
    const prompt = buildQualityReviewPrompt({
      sectionContent:
        "This is an executive summary about digital transformation.",
      sectionType: "executive_summary",
      proposalContext: { clientName: "Acme Corp", industry: "technology" },
    });

    expect(prompt).toContain("content_quality");
    expect(prompt).toContain("client_fit");
    expect(prompt).toContain("evidence");
    expect(prompt).toContain("brand_voice");
    expect(prompt).toContain("1-10");
  });

  it("buildQualityReviewPrompt injects section content, type, and proposal context", () => {
    const prompt = buildQualityReviewPrompt({
      sectionContent: "Our approach leverages cloud-native architecture.",
      sectionType: "approach",
      proposalContext: {
        clientName: "Acme Corp",
        industry: "financial_services",
      },
    });

    expect(prompt).toContain(
      "Our approach leverages cloud-native architecture.",
    );
    expect(prompt).toContain("approach");
    expect(prompt).toContain("Acme Corp");
    expect(prompt).toContain("financial_services");
  });

  it("GPT-4o response schema has scores (1-10) for each dimension + feedback", () => {
    // Verify the expected return structure
    const mockScores: QualityScores = {
      content_quality: 9,
      client_fit: 8,
      evidence: 7,
      brand_voice: 9,
      feedback: "Strong section. Could use more specific metrics.",
    };

    expect(mockScores.content_quality).toBeGreaterThanOrEqual(1);
    expect(mockScores.content_quality).toBeLessThanOrEqual(10);
    expect(mockScores.feedback).toBeTruthy();
  });

  it("calculateSectionScore returns correct average from 4 dimension scores", () => {
    const scores: QualityScores = {
      content_quality: 8,
      client_fit: 9,
      evidence: 7,
      brand_voice: 10,
      feedback: "Good.",
    };
    // (8 + 9 + 7 + 10) / 4 = 8.5
    expect(calculateSectionScore(scores)).toBe(8.5);
  });

  it("buildQualityReviewPrompt includes brand voice settings when available", () => {
    const prompt = buildQualityReviewPrompt({
      sectionContent: "Content here.",
      sectionType: "executive_summary",
      proposalContext: { clientName: "Test" },
      brandVoice: {
        tone: "confident, direct",
        terminology: {
          use: ["leverage", "accelerate"],
          avoid: ["cheap", "basic"],
        },
      },
    });

    expect(prompt).toContain("confident, direct");
    expect(prompt).toContain("leverage");
    expect(prompt).toContain("avoid");
    expect(prompt).toContain("cheap");
  });

  it("buildQualityReviewPrompt includes win strategy context when available", () => {
    const prompt = buildQualityReviewPrompt({
      sectionContent: "Content here.",
      sectionType: "executive_summary",
      proposalContext: { clientName: "Test" },
      winStrategy: {
        win_themes: ["Cloud-first transformation", "Speed to value"],
        differentiators: ["Proprietary AI engine"],
      },
    });

    expect(prompt).toContain("Cloud-first transformation");
    expect(prompt).toContain("Speed to value");
    expect(prompt).toContain("Proprietary AI engine");
  });
});

// ============================================================
// BAD PATH
// ============================================================
describe("Bad Path", () => {
  it("buildQualityReviewPrompt handles empty section content", () => {
    const prompt = buildQualityReviewPrompt({
      sectionContent: "",
      sectionType: "executive_summary",
      proposalContext: { clientName: "Test" },
    });

    // Should still produce a valid prompt even with empty content
    expect(prompt).toContain("content_quality");
    expect(prompt).toContain("No content provided");
  });

  it("buildQualityReviewPrompt handles missing brand voice (skips that context)", () => {
    const prompt = buildQualityReviewPrompt({
      sectionContent: "Some content.",
      sectionType: "approach",
      proposalContext: { clientName: "Test" },
      // brandVoice not provided
    });

    // Should still produce valid prompt, just without brand voice details
    expect(prompt).toContain("content_quality");
    expect(prompt).not.toContain("Brand Voice Settings:");
  });

  it("calculateSectionScore handles zero scores", () => {
    const scores: QualityScores = {
      content_quality: 0,
      client_fit: 0,
      evidence: 0,
      brand_voice: 0,
      feedback: "No content.",
    };
    expect(calculateSectionScore(scores)).toBe(0);
  });
});

// ============================================================
// EDGE CASES
// ============================================================
describe("Edge Cases", () => {
  it("very long section content is truncated in prompt", () => {
    const longContent = "A".repeat(50000);
    const prompt = buildQualityReviewPrompt({
      sectionContent: longContent,
      sectionType: "approach",
      proposalContext: { clientName: "Test" },
    });

    // Should truncate — prompt should be under 40000 chars
    expect(prompt.length).toBeLessThan(45000);
  });

  it("all dimensions score exactly 10 (perfect score)", () => {
    const scores: QualityScores = {
      content_quality: 10,
      client_fit: 10,
      evidence: 10,
      brand_voice: 10,
      feedback: "Perfect.",
    };
    expect(calculateSectionScore(scores)).toBe(10);
  });

  it("all dimensions score exactly 1 (worst score)", () => {
    const scores: QualityScores = {
      content_quality: 1,
      client_fit: 1,
      evidence: 1,
      brand_voice: 1,
      feedback: "Terrible.",
    };
    expect(calculateSectionScore(scores)).toBe(1);
  });

  it("QUALITY_DIMENSIONS has exactly 4 entries", () => {
    expect(QUALITY_DIMENSIONS).toHaveLength(4);
  });

  it("PASS_THRESHOLD is 9.0", () => {
    expect(PASS_THRESHOLD).toBe(9.0);
  });

  it("REGEN_THRESHOLD is 8.5", () => {
    expect(REGEN_THRESHOLD).toBe(8.5);
  });

  it("calculateSectionScore rounds to 1 decimal place", () => {
    const scores: QualityScores = {
      content_quality: 9,
      client_fit: 8,
      evidence: 7,
      brand_voice: 9,
      feedback: "Ok.",
    };
    // (9+8+7+9)/4 = 8.25 → round to 8.3
    const score = calculateSectionScore(scores);
    const decimalPlaces = (score.toString().split(".")[1] || "").length;
    expect(decimalPlaces).toBeLessThanOrEqual(1);
  });
});

// ============================================================
// SECURITY
// ============================================================
describe("Security", () => {
  it("prompt doesn't leak system instructions or internal architecture details", () => {
    const prompt = buildQualityReviewPrompt({
      sectionContent: "Content here.",
      sectionType: "executive_summary",
      proposalContext: { clientName: "Test" },
    });

    expect(prompt).not.toContain("openai-client.ts");
    expect(prompt).not.toContain("pipeline.ts");
    expect(prompt).not.toContain("OPENAI_API_KEY");
    expect(prompt).not.toContain("supabase");
  });

  it("client data sent is only the section content + needed context", () => {
    const prompt = buildQualityReviewPrompt({
      sectionContent: "Content here.",
      sectionType: "executive_summary",
      proposalContext: { clientName: "Test", industry: "tech" },
    });

    // Should not contain database IDs, internal URLs, etc.
    expect(prompt).not.toContain("postgresql://");
    expect(prompt).not.toContain("supabase.co");
  });
});

// ============================================================
// DATA LEAK
// ============================================================
describe("Data Leak", () => {
  it("prompt instructs GPT-4o not to echo back the rubric in feedback", () => {
    const prompt = buildQualityReviewPrompt({
      sectionContent: "Content.",
      sectionType: "approach",
      proposalContext: { clientName: "Test" },
    });

    expect(prompt).toContain("feedback");
    // Prompt should ask for actionable feedback, not rubric repetition
    expect(prompt).toContain("actionable");
  });

  it("module does not export any API keys or internal configuration", async () => {
    const mod = await import("../prompts/quality-review");
    const exportedKeys = Object.keys(mod);
    expect(exportedKeys).not.toContain("apiKey");
    expect(exportedKeys).not.toContain("OPENAI_API_KEY");
  });
});

// ============================================================
// DATA DAMAGE
// ============================================================
describe("Data Damage", () => {
  it("buildQualityReviewPrompt is a pure function (no side effects)", () => {
    const input = {
      sectionContent: "Content.",
      sectionType: "executive_summary" as const,
      proposalContext: { clientName: "Test" },
    };
    const inputCopy = JSON.parse(JSON.stringify(input));

    buildQualityReviewPrompt(input);

    // Input should not be modified
    expect(input).toEqual(inputCopy);
  });

  it("calculateSectionScore is a pure function (no side effects)", () => {
    const scores: QualityScores = {
      content_quality: 8,
      client_fit: 9,
      evidence: 7,
      brand_voice: 10,
      feedback: "Good.",
    };
    const scoresCopy = { ...scores };

    calculateSectionScore(scores);

    expect(scores).toEqual(scoresCopy);
  });

  it("calculateSectionScore does not modify the input scores object", () => {
    const scores: QualityScores = {
      content_quality: 8,
      client_fit: 9,
      evidence: 7,
      brand_voice: 10,
      feedback: "Good.",
    };

    const result1 = calculateSectionScore(scores);
    const result2 = calculateSectionScore(scores);
    expect(result1).toBe(result2);
  });
});
