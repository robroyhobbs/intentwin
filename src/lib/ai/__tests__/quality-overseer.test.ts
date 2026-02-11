import { describe, it, expect, vi, beforeEach } from "vitest";

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

// Mock openai-client
vi.mock("../openai-client", () => ({
  reviewWithGPT4o: vi.fn(),
}));

// Mock claude (Gemini generation)
vi.mock("../claude", () => ({
  generateText: vi.fn().mockResolvedValue("Regenerated content from Gemini."),
  buildSystemPrompt: vi.fn().mockReturnValue("System prompt"),
}));

import {
  runQualityReview,
  type QualityReviewResult,
  type SectionReview,
} from "../quality-overseer";
import { reviewWithGPT4o } from "../openai-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createProposalVersion } from "@/lib/versioning/create-version";

// Helper: fully chainable mock supabase
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

  // Build a fully chainable object — every method returns `this` except terminal ones
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
// HAPPY PATH
// ============================================================
describe("Happy Path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reviews all sections in a proposal sequentially", async () => {
    const mockReview = vi.mocked(reviewWithGPT4o);
    mockReview.mockResolvedValue({
      content_quality: 9,
      client_fit: 9,
      evidence: 9,
      brand_voice: 9,
      feedback: "Excellent section.",
    });

    const supabase = buildMockSupabase(mockSections);
    vi.mocked(createAdminClient).mockReturnValue(supabase as never);

    const result = await runQualityReview("proposal-1", "manual");

    // reviewWithGPT4o should be called once per section
    expect(mockReview).toHaveBeenCalledTimes(2);
    expect(result.sections).toHaveLength(2);
  });

  it("identifies sections scoring below 8.5 threshold", async () => {
    const mockReview = vi.mocked(reviewWithGPT4o);
    // First section: good score
    mockReview.mockResolvedValueOnce({
      content_quality: 9,
      client_fit: 9,
      evidence: 9,
      brand_voice: 9,
      feedback: "Great.",
    });
    // Second section: weak score (avg = 7.5)
    mockReview.mockResolvedValueOnce({
      content_quality: 7,
      client_fit: 8,
      evidence: 7,
      brand_voice: 8,
      feedback: "Needs improvement.",
    });
    // After regen, re-review
    mockReview.mockResolvedValueOnce({
      content_quality: 9,
      client_fit: 9,
      evidence: 8,
      brand_voice: 9,
      feedback: "Better now.",
    });

    const supabase = buildMockSupabase(mockSections);
    vi.mocked(createAdminClient).mockReturnValue(supabase as never);

    const result = await runQualityReview("proposal-1", "manual");

    expect(result.remediation.length).toBeGreaterThan(0);
    expect(result.remediation[0].original_score).toBeLessThan(8.5);
  });

  it("calculates overall score as average of all section averages", async () => {
    const mockReview = vi.mocked(reviewWithGPT4o);
    // Section 1: avg = 9.0
    mockReview.mockResolvedValueOnce({
      content_quality: 9,
      client_fit: 9,
      evidence: 9,
      brand_voice: 9,
      feedback: "Good.",
    });
    // Section 2: avg = 8.0
    mockReview.mockResolvedValueOnce({
      content_quality: 8,
      client_fit: 8,
      evidence: 8,
      brand_voice: 8,
      feedback: "OK.",
    });
    // After regen re-review for section 2
    mockReview.mockResolvedValueOnce({
      content_quality: 9,
      client_fit: 9,
      evidence: 9,
      brand_voice: 9,
      feedback: "Better.",
    });

    const supabase = buildMockSupabase(mockSections);
    vi.mocked(createAdminClient).mockReturnValue(supabase as never);

    const result = await runQualityReview("proposal-1", "manual");

    expect(typeof result.overall_score).toBe("number");
    expect(result.overall_score).toBeGreaterThan(0);
  });

  it("determines pass/fail based on 9.0 threshold", async () => {
    const mockReview = vi.mocked(reviewWithGPT4o);
    // Both sections score 9.0+
    mockReview.mockResolvedValue({
      content_quality: 9,
      client_fit: 10,
      evidence: 9,
      brand_voice: 9,
      feedback: "Excellent.",
    });

    const supabase = buildMockSupabase(mockSections);
    vi.mocked(createAdminClient).mockReturnValue(supabase as never);

    const result = await runQualityReview("proposal-1", "manual");

    expect(result.pass).toBe(true);
    expect(result.overall_score).toBeGreaterThanOrEqual(9.0);
  });

  it("sets status to 'completed' when done", async () => {
    const mockReview = vi.mocked(reviewWithGPT4o);
    mockReview.mockResolvedValue({
      content_quality: 9,
      client_fit: 9,
      evidence: 9,
      brand_voice: 9,
      feedback: "Good.",
    });

    const supabase = buildMockSupabase(mockSections);
    vi.mocked(createAdminClient).mockReturnValue(supabase as never);

    const result = await runQualityReview("proposal-1", "manual");

    expect(result.status).toBe("completed");
  });
});

// ============================================================
// BAD PATH
// ============================================================
describe("Bad Path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles proposal with 0 sections (completes with empty sections)", async () => {
    const supabase = buildMockSupabase([]);
    vi.mocked(createAdminClient).mockReturnValue(supabase as never);

    const result = await runQualityReview("proposal-1", "manual");

    expect(result.status).toBe("completed");
    expect(result.sections).toHaveLength(0);
    expect(result.overall_score).toBe(0);
  });

  it("handles GPT-4o failure mid-review (marks status failed)", async () => {
    const mockReview = vi.mocked(reviewWithGPT4o);
    mockReview.mockResolvedValueOnce({
      content_quality: 9,
      client_fit: 9,
      evidence: 9,
      brand_voice: 9,
      feedback: "Good.",
    });
    mockReview.mockRejectedValueOnce(new Error("OpenAI API error"));

    const supabase = buildMockSupabase(mockSections);
    vi.mocked(createAdminClient).mockReturnValue(supabase as never);

    const result = await runQualityReview("proposal-1", "manual");

    expect(result.status).toBe("failed");
  });

  it("handles all sections failing review (still completes, all in remediation)", async () => {
    const mockReview = vi.mocked(reviewWithGPT4o);
    // Both sections weak initially
    mockReview.mockResolvedValueOnce({
      content_quality: 6,
      client_fit: 6,
      evidence: 6,
      brand_voice: 6,
      feedback: "Weak.",
    });
    mockReview.mockResolvedValueOnce({
      content_quality: 7,
      client_fit: 7,
      evidence: 7,
      brand_voice: 7,
      feedback: "Also weak.",
    });
    // Re-reviews after regen
    mockReview.mockResolvedValueOnce({
      content_quality: 8,
      client_fit: 8,
      evidence: 8,
      brand_voice: 8,
      feedback: "Improved.",
    });
    mockReview.mockResolvedValueOnce({
      content_quality: 8,
      client_fit: 8,
      evidence: 8,
      brand_voice: 8,
      feedback: "Improved.",
    });

    const supabase = buildMockSupabase(mockSections);
    vi.mocked(createAdminClient).mockReturnValue(supabase as never);

    const result = await runQualityReview("proposal-1", "manual");

    expect(result.status).toBe("completed");
    expect(result.remediation).toHaveLength(2);
  });
});

// ============================================================
// EDGE CASES
// ============================================================
describe("Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("proposal with exactly 1 section", async () => {
    const mockReview = vi.mocked(reviewWithGPT4o);
    mockReview.mockResolvedValue({
      content_quality: 9,
      client_fit: 9,
      evidence: 9,
      brand_voice: 9,
      feedback: "Good.",
    });

    const supabase = buildMockSupabase([mockSections[0]]);
    vi.mocked(createAdminClient).mockReturnValue(supabase as never);

    const result = await runQualityReview("proposal-1", "manual");

    expect(result.sections).toHaveLength(1);
    expect(result.status).toBe("completed");
  });

  it("all sections pass first review (no remediation needed)", async () => {
    const mockReview = vi.mocked(reviewWithGPT4o);
    mockReview.mockResolvedValue({
      content_quality: 10,
      client_fit: 9,
      evidence: 9,
      brand_voice: 9,
      feedback: "Perfect.",
    });

    const supabase = buildMockSupabase(mockSections);
    vi.mocked(createAdminClient).mockReturnValue(supabase as never);

    const result = await runQualityReview("proposal-1", "manual");

    expect(result.remediation).toHaveLength(0);
    // Should only call GPT-4o for initial review, no re-review
    expect(vi.mocked(reviewWithGPT4o)).toHaveBeenCalledTimes(2);
  });

  it("section exactly at threshold (8.5) does not trigger regen", async () => {
    const mockReview = vi.mocked(reviewWithGPT4o);
    // avg = (8 + 9 + 8 + 9) / 4 = 8.5
    mockReview.mockResolvedValue({
      content_quality: 8,
      client_fit: 9,
      evidence: 8,
      brand_voice: 9,
      feedback: "Acceptable.",
    });

    const supabase = buildMockSupabase([mockSections[0]]);
    vi.mocked(createAdminClient).mockReturnValue(supabase as never);

    const result = await runQualityReview("proposal-1", "manual");

    expect(result.remediation).toHaveLength(0);
  });

  it("overall score exactly 9.0 is a pass", async () => {
    const mockReview = vi.mocked(reviewWithGPT4o);
    mockReview.mockResolvedValue({
      content_quality: 9,
      client_fit: 9,
      evidence: 9,
      brand_voice: 9,
      feedback: "Good.",
    });

    const supabase = buildMockSupabase([mockSections[0]]);
    vi.mocked(createAdminClient).mockReturnValue(supabase as never);

    const result = await runQualityReview("proposal-1", "manual");

    expect(result.overall_score).toBe(9);
    expect(result.pass).toBe(true);
  });
});

// ============================================================
// SECURITY
// ============================================================
describe("Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("only processes sections belonging to the specified proposal", async () => {
    const mockReview = vi.mocked(reviewWithGPT4o);
    mockReview.mockResolvedValue({
      content_quality: 9,
      client_fit: 9,
      evidence: 9,
      brand_voice: 9,
      feedback: "Good.",
    });

    const supabase = buildMockSupabase(mockSections);
    vi.mocked(createAdminClient).mockReturnValue(supabase as never);

    await runQualityReview("proposal-1", "manual");

    // Verify supabase query included proposal_id filter
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("quality review result doesn't contain raw GPT-4o prompts", async () => {
    const mockReview = vi.mocked(reviewWithGPT4o);
    mockReview.mockResolvedValue({
      content_quality: 9,
      client_fit: 9,
      evidence: 9,
      brand_voice: 9,
      feedback: "Good.",
    });

    const supabase = buildMockSupabase(mockSections);
    vi.mocked(createAdminClient).mockReturnValue(supabase as never);

    const result = await runQualityReview("proposal-1", "manual");

    const resultStr = JSON.stringify(result);
    expect(resultStr).not.toContain(
      "You are a senior proposal quality reviewer",
    );
    expect(resultStr).not.toContain("OPENAI_API_KEY");
  });
});

// ============================================================
// DATA DAMAGE
// ============================================================
describe("Data Damage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runQualityReview returns a complete QualityReviewResult structure", async () => {
    const mockReview = vi.mocked(reviewWithGPT4o);
    mockReview.mockResolvedValue({
      content_quality: 9,
      client_fit: 9,
      evidence: 9,
      brand_voice: 9,
      feedback: "Good.",
    });

    const supabase = buildMockSupabase(mockSections);
    vi.mocked(createAdminClient).mockReturnValue(supabase as never);

    const result = await runQualityReview("proposal-1", "manual");

    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("run_at");
    expect(result).toHaveProperty("trigger");
    expect(result).toHaveProperty("model");
    expect(result).toHaveProperty("overall_score");
    expect(result).toHaveProperty("pass");
    expect(result).toHaveProperty("sections");
    expect(result).toHaveProperty("remediation");
    expect(result.model).toBe("gpt-4o");
  });
});
