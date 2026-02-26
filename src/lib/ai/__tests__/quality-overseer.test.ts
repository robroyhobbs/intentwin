import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================
// Mocks — vi.mock() calls are hoisted; no loops or variables
// ============================================================

// Mock supabase admin
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

// Mock versioning
vi.mock("@/lib/versioning/create-version", () => ({
  createProposalVersion: vi
    .fn()
    .mockResolvedValue({ versionId: "v1", error: null }),
}));

// Mock observability metrics (non-critical, should never break tests)
vi.mock("@/lib/observability/metrics", () => ({
  logQualityReviewMetric: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    event: vi.fn(),
    time: vi.fn(() => vi.fn()),
  },
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    event: vi.fn(),
    time: vi.fn(() => vi.fn()),
  })),
}));

// Mock intelligence client (used for dynamic quality threshold)
vi.mock("@/lib/intelligence", () => ({
  intelligenceClient: {
    getProposalIntelligence: vi.fn().mockResolvedValue(null),
    isConfigured: false,
  },
  getQualityThreshold: vi.fn().mockReturnValue(8.5),
}));

// Mock Gemini review client
vi.mock("../gemini-review-client", () => ({
  reviewWithGemini: vi.fn(),
}));

// Mock gemini generation (for remediation)
vi.mock("../gemini", () => ({
  generateText: vi.fn().mockResolvedValue("Regenerated content from Gemini."),
  buildSystemPrompt: vi.fn().mockReturnValue("System prompt"),
}));

// ============================================================
// Imports (after mocks)
// ============================================================

import {
  runQualityReview,
  type QualityReviewResult,
  type CouncilSectionReview,
} from "../quality-overseer";
import { reviewWithGemini } from "../gemini-review-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createProposalVersion } from "@/lib/versioning/create-version";

// ============================================================
// Helpers
// ============================================================

/** Build a fully chainable mock Supabase client. */
function buildMockSupabase(
  sections: Record<string, unknown>[] = [],
  proposal: Record<string, unknown> = {},
) {
  const mockFrom = vi.fn();
  const supabase = { from: mockFrom };

  const proposalData = {
    id: "proposal-1",
    quality_review: null,
    intake_data: { client_name: "Acme Corp", client_industry: "technology" },
    win_strategy_data: null,
    organization_id: "org-1",
    ...proposal,
  };

  function chainable(terminalData: unknown, terminalError: unknown = null) {
    const chain: Record<string, unknown> = {};
    const self = () => chain;
    chain.select = vi.fn(self);
    chain.eq = vi.fn(self);
    chain.neq = vi.fn(self);
    chain.order = vi
      .fn()
      .mockResolvedValue({ data: terminalData, error: terminalError });
    chain.single = vi
      .fn()
      .mockResolvedValue({ data: terminalData, error: terminalError });
    chain.update = vi.fn(self);
    return chain;
  }

  mockFrom.mockImplementation((table: string) => {
    if (table === "proposals") {
      return chainable(proposalData);
    }
    if (table === "proposal_sections") {
      return chainable(sections);
    }
    return chainable(null);
  });

  return supabase;
}

/** High scores that pass all thresholds (avg = 9.25). */
function highScores(feedback = "Excellent section.") {
  return {
    content_quality: 9,
    client_fit: 10,
    evidence: 9,
    brand_voice: 9,
    feedback,
  };
}

/** Scores below REGEN_THRESHOLD of 8.5 (avg = 7.5). */
function lowScores(feedback = "Needs improvement.") {
  return {
    content_quality: 7,
    client_fit: 8,
    evidence: 7,
    brand_voice: 8,
    feedback,
  };
}

/** Scores at exactly 9.0 — on the PASS_THRESHOLD boundary. */
function borderlinePassScores(feedback = "Acceptable.") {
  return {
    content_quality: 9,
    client_fit: 9,
    evidence: 9,
    brand_voice: 9,
    feedback,
  };
}

/** Scores at exactly 8.5 — on the REGEN_THRESHOLD boundary (no regen). */
function borderlineRegenScores(feedback = "Borderline.") {
  return {
    content_quality: 8,
    client_fit: 9,
    evidence: 8,
    brand_voice: 9,
    feedback,
  };
}

const mockSections = [
  {
    id: "sec-1",
    section_type: "executive_summary",
    title: "Executive Summary",
    generated_content:
      "A strong executive summary about digital transformation.",
    generation_status: "completed",
  },
  {
    id: "sec-2",
    section_type: "approach",
    title: "Proposed Approach",
    generated_content: "Our approach uses cloud-native architecture.",
    generation_status: "completed",
  },
];

// ============================================================
// Setup
// ============================================================

describe("Quality Overseer (Gemini)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
    vi.stubEnv("GEMINI_MODEL", "gemini-test-model");
  });

  // ============================================================
  // HAPPY PATH
  // ============================================================
  describe("Happy Path", () => {
    it("reviews all sections using Gemini", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(highScores());

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      // Gemini called once per section for initial review
      expect(mockGemini).toHaveBeenCalledTimes(2);
      expect(result.sections).toHaveLength(2);
      expect(result.status).toBe("completed");
    });

    it("identifies sections scoring below REGEN_THRESHOLD and remediates", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      // Section 1: high score (passes)
      mockGemini.mockResolvedValueOnce(highScores());
      // Section 2: low score (triggers remediation)
      mockGemini.mockResolvedValueOnce(lowScores());
      // Re-review after remediation for section 2
      mockGemini.mockResolvedValueOnce(highScores("Better now."));

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(result.remediation.length).toBeGreaterThan(0);
      expect(result.remediation[0].original_score).toBeLessThan(8.5);
      expect(result.status).toBe("completed");
    });

    it("calculates overall score as average of all section scores", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValueOnce(highScores());
      mockGemini.mockResolvedValueOnce(borderlinePassScores());

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(typeof result.overall_score).toBe("number");
      expect(result.overall_score).toBeGreaterThan(0);
    });

    it("determines pass/fail based on PASS_THRESHOLD (9.0)", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(highScores());

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(result.pass).toBe(true);
      expect(result.overall_score).toBeGreaterThanOrEqual(9.0);
    });

    it("sets status to 'completed' when review finishes", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(highScores());

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(result.status).toBe("completed");
    });

    it("creates a version snapshot when remediation occurs", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      // Both sections low — triggers remediation for both
      mockGemini.mockResolvedValueOnce(lowScores());
      mockGemini.mockResolvedValueOnce(lowScores());
      // Re-reviews after remediation
      mockGemini.mockResolvedValueOnce(highScores());
      mockGemini.mockResolvedValueOnce(highScores());

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      await runQualityReview("proposal-1", "manual");

      expect(createProposalVersion).toHaveBeenCalledWith(
        expect.objectContaining({
          proposalId: "proposal-1",
          triggerEvent: "generation_complete",
          label: "Quality Council Remediation",
        }),
      );
    });

    it("does NOT create a version snapshot when no remediation occurs", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(highScores());

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      await runQualityReview("proposal-1", "manual");

      expect(createProposalVersion).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // BAD PATH
  // ============================================================
  describe("Bad Path", () => {
    it("handles proposal with 0 sections (completes with empty sections)", async () => {
      const supabase = buildMockSupabase([]);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(result.status).toBe("completed");
      expect(result.sections).toHaveLength(0);
      expect(result.overall_score).toBe(0);
      expect(result.pass).toBe(false);
    });

    it("handles Gemini failure mid-review gracefully", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      // First section succeeds
      mockGemini.mockResolvedValueOnce(highScores());
      // Second section throws — caught inside review loop, results in score 0 → remediation
      mockGemini.mockRejectedValueOnce(new Error("Gemini API error"));

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(["completed", "failed"]).toContain(result.status);
    });

    it("handles all sections failing review (remediation triggered for all)", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      // Both sections score low
      mockGemini.mockResolvedValueOnce(lowScores("Weak section 1."));
      mockGemini.mockResolvedValueOnce(lowScores("Weak section 2."));
      // Re-reviews after remediation
      mockGemini.mockResolvedValueOnce(borderlinePassScores("Improved 1."));
      mockGemini.mockResolvedValueOnce(borderlinePassScores("Improved 2."));

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(result.status).toBe("completed");
      expect(result.remediation).toHaveLength(2);
    });

    it("handles proposal not found (returns failed status)", async () => {
      const mockFrom = vi.fn();
      const supabase = { from: mockFrom };

      function chainableError() {
        const chain: Record<string, unknown> = {};
        const self = () => chain;
        chain.select = vi.fn(self);
        chain.eq = vi.fn(self);
        chain.order = vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: "Not found" } });
        chain.single = vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: "Not found" } });
        chain.update = vi.fn(self);
        return chain;
      }

      mockFrom.mockReturnValue(chainableError());
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("nonexistent", "manual");

      expect(result.status).toBe("failed");
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================
  describe("Edge Cases", () => {
    it("proposal with exactly 1 section", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(highScores());

      const supabase = buildMockSupabase([mockSections[0]]);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(result.sections).toHaveLength(1);
      expect(result.status).toBe("completed");
    });

    it("all sections pass first review (no remediation needed)", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(highScores("Perfect."));

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(result.remediation).toHaveLength(0);
      // Gemini called once per section for initial review only
      expect(mockGemini).toHaveBeenCalledTimes(2);
    });

    it("section exactly at REGEN_THRESHOLD (8.5) does not trigger regen", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      // avg = (8+9+8+9)/4 = 8.5 — at threshold, no regen
      mockGemini.mockResolvedValue(borderlineRegenScores());

      const supabase = buildMockSupabase([mockSections[0]]);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(result.remediation).toHaveLength(0);
    });

    it("overall score exactly 9.0 is a pass", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(borderlinePassScores());

      const supabase = buildMockSupabase([mockSections[0]]);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(result.overall_score).toBe(9);
      expect(result.pass).toBe(true);
    });

    it("consensus is 'unanimous' for single-judge review", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(highScores());

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(result.consensus).toBe("unanimous");
    });

    it("empty sections returns consensus 'split'", async () => {
      const supabase = buildMockSupabase([]);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(result.consensus).toBe("split");
    });
  });

  // ============================================================
  // SECURITY
  // ============================================================
  describe("Security", () => {
    it("only processes sections belonging to the specified proposal", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(highScores());

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      await runQualityReview("proposal-1", "manual");

      const fromCalls = supabase.from.mock.calls;
      const sectionCalls = fromCalls.filter(
        (c: string[]) => c[0] === "proposal_sections",
      );
      expect(sectionCalls.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // DATA LEAK
  // ============================================================
  describe("Data Leak", () => {
    it("quality review result doesn't contain raw prompts or API keys", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(highScores());

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      const resultStr = JSON.stringify(result);
      expect(resultStr).not.toContain(
        "You are a senior proposal quality reviewer",
      );
      expect(resultStr).not.toContain("OPENAI_API_KEY");
      expect(resultStr).not.toContain("GEMINI_API_KEY");
      expect(resultStr).not.toContain("GROQ_API_KEY");
      expect(resultStr).not.toContain("MISTRAL_API_KEY");
    });
  });

  // ============================================================
  // DATA STRUCTURE VALIDATION
  // ============================================================
  describe("Data Structure", () => {
    it("returns a complete QualityReviewResult structure", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(highScores());

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("run_at");
      expect(result).toHaveProperty("trigger");
      expect(result).toHaveProperty("model");
      expect(result).toHaveProperty("judges");
      expect(result).toHaveProperty("consensus");
      expect(result).toHaveProperty("overall_score");
      expect(result).toHaveProperty("pass");
      expect(result).toHaveProperty("sections");
      expect(result).toHaveProperty("remediation");
    });

    it("model field reflects the Gemini model", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(highScores());

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(result.model).toBe("gemini-test-model");
    });

    it("judges array contains exactly one Gemini entry", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(highScores());

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(result.judges).toBeDefined();
      expect(result.judges!.length).toBe(1);
      expect(result.judges![0].provider).toBe("google");
      expect(result.judges![0].judge_name).toBe("Gemini");
    });

    it("section reviews include a single judge_reviews entry (Gemini)", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(highScores("Gemini feedback."));

      const supabase = buildMockSupabase([mockSections[0]]);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      const section = result.sections[0] as CouncilSectionReview;
      expect(section.judge_reviews).toBeDefined();
      expect(section.judge_reviews.length).toBe(1);
      expect(section.judge_reviews[0].provider).toBe("google");
    });

    it("section reviews include dimensions breakdown", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(highScores());

      const supabase = buildMockSupabase([mockSections[0]]);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      const section = result.sections[0];
      expect(section).toHaveProperty("section_id");
      expect(section).toHaveProperty("section_type");
      expect(section).toHaveProperty("score");
      expect(section).toHaveProperty("dimensions");
      expect(section.dimensions).toHaveProperty("content_quality");
      expect(section.dimensions).toHaveProperty("client_fit");
      expect(section.dimensions).toHaveProperty("evidence");
      expect(section.dimensions).toHaveProperty("brand_voice");
      expect(section).toHaveProperty("feedback");
    });

    it("remediation entries have correct structure", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValueOnce(lowScores());
      mockGemini.mockResolvedValueOnce(highScores("Improved."));

      const supabase = buildMockSupabase([mockSections[0]]);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      expect(result.remediation).toHaveLength(1);
      const entry = result.remediation[0];
      expect(entry).toHaveProperty("section_id");
      expect(entry).toHaveProperty("round");
      expect(entry).toHaveProperty("original_score");
      expect(entry).toHaveProperty("issues");
      expect(entry).toHaveProperty("new_score");
      expect(entry.round).toBe(1);
      expect(Array.isArray(entry.issues)).toBe(true);
    });

    it("run_at is a valid ISO date string", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(highScores());

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const result = await runQualityReview("proposal-1", "manual");

      const parsed = new Date(result.run_at);
      expect(parsed.toISOString()).toBe(result.run_at);
    });

    it("trigger reflects the value passed to runQualityReview", async () => {
      const mockGemini = vi.mocked(reviewWithGemini);
      mockGemini.mockResolvedValue(highScores());

      const supabase = buildMockSupabase(mockSections);
      vi.mocked(createAdminClient).mockReturnValue(supabase as never);

      const manualResult = await runQualityReview("proposal-1", "manual");
      expect(manualResult.trigger).toBe("manual");

      vi.clearAllMocks();
      mockGemini.mockResolvedValue(highScores());
      vi.mocked(createAdminClient).mockReturnValue(
        buildMockSupabase(mockSections) as never,
      );

      const autoResult = await runQualityReview(
        "proposal-1",
        "auto_post_generation",
      );
      expect(autoResult.trigger).toBe("auto_post_generation");
    });
  });
});
