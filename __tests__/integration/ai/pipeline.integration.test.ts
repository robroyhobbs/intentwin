import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all external dependencies BEFORE imports
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/ai/claude", () => ({
  generateText: vi.fn(),
  generateStructuredAnalysis: vi.fn(),
  buildSystemPrompt: vi.fn(),
}));

vi.mock("@/lib/ai/embeddings", () => ({
  generateQueryEmbedding: vi.fn(),
}));

vi.mock("@/lib/ai/quality-overseer", () => ({
  runQualityReview: vi.fn(),
}));

vi.mock("@/lib/versioning/create-version", () => ({
  createProposalVersion: vi.fn(),
}));

vi.mock("@/lib/sources", () => ({
  loadSources: vi.fn(),
  formatSourcesAsL1Context: vi.fn(),
}));

vi.mock("@/lib/ai/persuasion", () => ({
  getPersuasionPrompt: vi.fn(() => ""),
  getBestPracticesPrompt: vi.fn(() => ""),
  buildWinThemesPrompt: vi.fn(() => ""),
  buildCompetitivePrompt: vi.fn(() => ""),
  runQualityChecks: vi.fn(() => ({ score: 0.85 })),
}));

vi.mock("@/lib/ai/industry-configs", () => ({
  getIndustryConfig: vi.fn(() => null),
  buildIndustryContext: vi.fn(() => ""),
}));

// Mock all prompt builders individually (vi.mock is hoisted, can't use loops)
vi.mock("@/lib/ai/prompts/executive-summary", () => ({
  buildExecutiveSummaryPrompt: vi.fn(() => "Mock prompt for executive-summary"),
}));
vi.mock("@/lib/ai/prompts/understanding", () => ({
  buildUnderstandingPrompt: vi.fn(() => "Mock prompt for understanding"),
}));
vi.mock("@/lib/ai/prompts/approach", () => ({
  buildApproachPrompt: vi.fn(() => "Mock prompt for approach"),
}));
vi.mock("@/lib/ai/prompts/methodology", () => ({
  buildMethodologyPrompt: vi.fn(() => "Mock prompt for methodology"),
}));
vi.mock("@/lib/ai/prompts/team", () => ({
  buildTeamPrompt: vi.fn(() => "Mock prompt for team"),
}));
vi.mock("@/lib/ai/prompts/case-studies", () => ({
  buildCaseStudiesPrompt: vi.fn(() => "Mock prompt for case-studies"),
}));
vi.mock("@/lib/ai/prompts/timeline", () => ({
  buildTimelinePrompt: vi.fn(() => "Mock prompt for timeline"),
}));
vi.mock("@/lib/ai/prompts/pricing", () => ({
  buildPricingPrompt: vi.fn(() => "Mock prompt for pricing"),
}));
vi.mock("@/lib/ai/prompts/risk-mitigation", () => ({
  buildRiskMitigationPrompt: vi.fn(() => "Mock prompt for risk-mitigation"),
}));
vi.mock("@/lib/ai/prompts/why-us", () => ({
  buildWhyUsPrompt: vi.fn(() => "Mock prompt for why-us"),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateText,
  generateStructuredAnalysis,
  buildSystemPrompt,
} from "@/lib/ai/claude";
import { generateQueryEmbedding } from "@/lib/ai/embeddings";
import { runQualityReview } from "@/lib/ai/quality-overseer";
import { createProposalVersion } from "@/lib/versioning/create-version";
import { loadSources, formatSourcesAsL1Context } from "@/lib/sources";
import { generateProposal, regenerateSection } from "@/lib/ai/pipeline";
import { clearL1Cache } from "@/lib/ai/pipeline/context";

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
const ORG_ID = "org-pipeline-test";
const PROPOSAL_ID = "proposal-pipeline-test";

function mockProposalRecord() {
  return {
    id: PROPOSAL_ID,
    organization_id: ORG_ID,
    title: "Test Proposal",
    status: "draft",
    intake_data: {
      opportunity_type: "cloud_migration",
      client_industry: "Financial Services",
      client_name: "Acme Bank",
    },
    win_strategy_data: {
      win_themes: ["innovation", "speed"],
      differentiators: ["AI-first approach"],
    },
    outcome_contract: {
      current_state: ["Legacy systems"],
      desired_state: ["Cloud native"],
      transformation: "Digital transformation",
      success_metrics: [],
    },
    rfp_extracted_requirements: null,
    organizations: {
      name: "Test Corp",
      settings: { description: "A test company", industry: "Technology" },
    },
  };
}

function createSectionRecords() {
  const types = [
    "executive_summary",
    "understanding",
    "approach",
    "methodology",
    "team",
    "case_studies",
    "timeline",
    "pricing",
    "risk_mitigation",
    "why_us",
  ];
  return types.map((type, idx) => ({
    id: `section-${type}`,
    proposal_id: PROPOSAL_ID,
    section_type: type,
    section_order: idx + 1,
    title: type.replace(/_/g, " "),
    generation_status: "pending",
  }));
}

/**
 * Create a deeply chainable Supabase mock where every method returns
 * the chain itself, and terminal methods (single, etc.) can be configured.
 */
function createChainableMock() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "in",
    "is",
    "like",
    "ilike",
    "or",
    "order",
    "limit",
    "range",
    "match",
    "contains",
    "containedBy",
    "overlaps",
    "single",
    "maybeSingle",
  ];

  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }

  // Default: resolve as { data: null, error: null } when awaited
  chain.then = vi.fn(
    (
      resolve: (v: { data: unknown; error: null }) => unknown,
      _reject?: (e: unknown) => unknown,
    ) => Promise.resolve(resolve({ data: null, error: null })),
  );

  return chain;
}

// ──────────────────────────────────────────────────────────
// Setup
// ──────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chain: any;
let mockFromFn: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  clearL1Cache();

  chain = createChainableMock();
  mockFromFn = vi.fn(() => chain);

  const mockRpc = vi.fn().mockResolvedValue({
    data: [
      {
        id: "chunk-1",
        document_title: "Past Proposal",
        section_heading: "Overview",
        content: "We successfully migrated 500 workloads...",
        similarity: 0.92,
        document_type: "capability",
      },
    ],
    error: null,
  });

  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
    from: mockFromFn,
    rpc: mockRpc,
  });

  // Claude mock
  (generateText as ReturnType<typeof vi.fn>).mockResolvedValue(
    "Generated section content with compelling details and evidence.",
  );
  (generateStructuredAnalysis as ReturnType<typeof vi.fn>).mockResolvedValue(
    "Strategic analysis: The client needs cloud migration with a focus on security.",
  );
  (buildSystemPrompt as ReturnType<typeof vi.fn>).mockReturnValue(
    "You are a professional proposal writer.",
  );

  // Embeddings mock
  (generateQueryEmbedding as ReturnType<typeof vi.fn>).mockResolvedValue(
    Array(1024)
      .fill(0)
      .map(() => Math.random()),
  );

  // Quality review mock (fire-and-forget)
  (runQualityReview as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

  // Version mock
  (createProposalVersion as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: "version-1",
  });

  // Sources mock
  (loadSources as ReturnType<typeof vi.fn>).mockResolvedValue({
    all: [],
    methodologies: [],
    caseStudies: [],
    branding: [],
    legal: [],
    templates: [],
  });
  (formatSourcesAsL1Context as ReturnType<typeof vi.fn>).mockReturnValue("");
});

// ──────────────────────────────────────────────────────────
// generateProposal
// ──────────────────────────────────────────────────────────
describe("generateProposal", () => {
  it("runs the full generation pipeline end-to-end", async () => {
    const proposal = mockProposalRecord();
    const sections = createSectionRecords();

    // The pipeline calls .single() in several places.
    // First .single() is proposal fetch, rest are updates (which resolve via chain)
    let singleCallCount = 0;
    chain.single = vi.fn(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        // proposal fetch
        return Promise.resolve({ data: proposal, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    // .select() after .insert() for sections returns the section records
    let selectAfterInsert = false;
    const origInsert = chain.insert;
    chain.insert = vi.fn((...args: unknown[]) => {
      selectAfterInsert = true;
      return origInsert(...args);
    });

    chain.select = vi.fn(() => {
      if (selectAfterInsert) {
        selectAfterInsert = false;
        // This returns something that, when awaited or .single() is called,
        // returns section records. But the pipeline does .insert().select()
        // without .single(), so it resolves via .then
        return {
          ...chain,
          then: vi.fn(
            (
              resolve: (v: { data: unknown; error: null }) => unknown,
            ) =>
              Promise.resolve(
                resolve({ data: sections, error: null }),
              ),
          ),
        };
      }
      return chain;
    });

    await generateProposal(PROPOSAL_ID);

    // Verify: AI was called for each section (10 times)
    expect(generateText).toHaveBeenCalledTimes(10);

    // Verify: structured analysis was run once
    expect(generateStructuredAnalysis).toHaveBeenCalledTimes(1);

    // Verify: version snapshot was created
    expect(createProposalVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        proposalId: PROPOSAL_ID,
        triggerEvent: "generation_complete",
      }),
    );

    // Verify: quality review was triggered (fire-and-forget)
    expect(runQualityReview).toHaveBeenCalledWith(
      PROPOSAL_ID,
      "auto_post_generation",
    );
  });

  it("resets proposal to draft on generation failure", async () => {
    // Make the proposal fetch fail
    chain.single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    await expect(generateProposal("nonexistent")).rejects.toThrow(
      "Proposal not found",
    );

    // Verify update was called (to reset status to draft)
    expect(chain.update).toHaveBeenCalled();
  });

  it("loads L1 context scoped to organization", async () => {
    const proposal = mockProposalRecord();
    const sections = createSectionRecords();

    let singleCallCount = 0;
    chain.single = vi.fn(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        return Promise.resolve({ data: proposal, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    let selectAfterInsert = false;
    chain.insert = vi.fn(() => {
      selectAfterInsert = true;
      return chain;
    });
    chain.select = vi.fn(() => {
      if (selectAfterInsert) {
        selectAfterInsert = false;
        return {
          ...chain,
          then: vi.fn((resolve: (v: { data: unknown; error: null }) => unknown) =>
            Promise.resolve(resolve({ data: sections, error: null })),
          ),
        };
      }
      return chain;
    });

    await generateProposal(PROPOSAL_ID);

    // Verify org scoping: eq was called with organization_id for L1 context
    expect(chain.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
  });

  it("continues generation when static sources fail", async () => {
    const proposal = mockProposalRecord();
    const sections = createSectionRecords();

    (loadSources as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Sources directory not found"),
    );

    let singleCallCount = 0;
    chain.single = vi.fn(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        return Promise.resolve({ data: proposal, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    let selectAfterInsert = false;
    chain.insert = vi.fn(() => {
      selectAfterInsert = true;
      return chain;
    });
    chain.select = vi.fn(() => {
      if (selectAfterInsert) {
        selectAfterInsert = false;
        return {
          ...chain,
          then: vi.fn((resolve: (v: { data: unknown; error: null }) => unknown) =>
            Promise.resolve(resolve({ data: sections, error: null })),
          ),
        };
      }
      return chain;
    });

    // Should not throw — static sources are non-critical
    await generateProposal(PROPOSAL_ID);

    expect(generateText).toHaveBeenCalledTimes(10);
  });

  it("handles individual section failures without aborting", async () => {
    const proposal = mockProposalRecord();
    const sections = createSectionRecords();

    let singleCallCount = 0;
    chain.single = vi.fn(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        return Promise.resolve({ data: proposal, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    let selectAfterInsert = false;
    chain.insert = vi.fn(() => {
      selectAfterInsert = true;
      return chain;
    });
    chain.select = vi.fn(() => {
      if (selectAfterInsert) {
        selectAfterInsert = false;
        return {
          ...chain,
          then: vi.fn((resolve: (v: { data: unknown; error: null }) => unknown) =>
            Promise.resolve(resolve({ data: sections, error: null })),
          ),
        };
      }
      return chain;
    });

    // Make AI fail on the 3rd call (approach section)
    (generateText as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce("Section 1 content")
      .mockResolvedValueOnce("Section 2 content")
      .mockRejectedValueOnce(new Error("AI rate limit exceeded"))
      .mockResolvedValue("Section N content");

    await generateProposal(PROPOSAL_ID);

    // All 10 sections should have been attempted
    expect(generateText).toHaveBeenCalledTimes(10);

    // Proposal should still end with update calls
    expect(chain.update).toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────
// regenerateSection
// ──────────────────────────────────────────────────────────
describe("regenerateSection", () => {
  const SECTION_ID = "section-executive_summary";

  it("regenerates a single section with fresh content", async () => {
    const proposal = mockProposalRecord();
    const section = {
      id: SECTION_ID,
      proposal_id: PROPOSAL_ID,
      section_type: "executive_summary",
      section_order: 1,
      title: "Executive Summary",
      generation_status: "completed",
      generated_content: "Old content",
    };

    let singleCallCount = 0;
    chain.single = vi.fn(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        return Promise.resolve({ data: section, error: null });
      }
      if (singleCallCount === 2) {
        return Promise.resolve({ data: proposal, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    await regenerateSection(PROPOSAL_ID, SECTION_ID);

    // Verify AI was called once for the single section
    expect(generateText).toHaveBeenCalledTimes(1);

    // Verify section was updated
    expect(chain.update).toHaveBeenCalled();
  });

  it("incorporates quality feedback into regeneration prompt", async () => {
    const proposal = mockProposalRecord();
    const section = {
      id: SECTION_ID,
      proposal_id: PROPOSAL_ID,
      section_type: "executive_summary",
      section_order: 1,
      title: "Executive Summary",
      generation_status: "completed",
    };

    const qualityFeedback =
      "Section lacks specific metrics. Add concrete ROI figures and timeline details.";

    let singleCallCount = 0;
    chain.single = vi.fn(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        return Promise.resolve({ data: section, error: null });
      }
      if (singleCallCount === 2) {
        return Promise.resolve({ data: proposal, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    await regenerateSection(PROPOSAL_ID, SECTION_ID, qualityFeedback);

    // Verify the prompt includes quality feedback
    const promptArg = (generateText as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(promptArg).toContain("Quality Review Feedback");
    expect(promptArg).toContain("specific metrics");
  });

  it("throws when section is not found", async () => {
    chain.single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    await expect(
      regenerateSection(PROPOSAL_ID, "nonexistent-section"),
    ).rejects.toThrow("Section not found");
  });

  it("marks section as failed on generation error", async () => {
    const proposal = mockProposalRecord();
    const section = {
      id: SECTION_ID,
      proposal_id: PROPOSAL_ID,
      section_type: "executive_summary",
      section_order: 1,
    };

    let singleCallCount = 0;
    chain.single = vi.fn(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        return Promise.resolve({ data: section, error: null });
      }
      if (singleCallCount === 2) {
        return Promise.resolve({ data: proposal, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    (generateText as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Model overloaded"),
    );

    await expect(
      regenerateSection(PROPOSAL_ID, SECTION_ID),
    ).rejects.toThrow("Model overloaded");

    // Verify section was marked as failed
    expect(chain.update).toHaveBeenCalled();
  });

  it("clears old source references before inserting new ones", async () => {
    const proposal = mockProposalRecord();
    const section = {
      id: SECTION_ID,
      proposal_id: PROPOSAL_ID,
      section_type: "executive_summary",
      section_order: 1,
    };

    let singleCallCount = 0;
    chain.single = vi.fn(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        return Promise.resolve({ data: section, error: null });
      }
      if (singleCallCount === 2) {
        return Promise.resolve({ data: proposal, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    await regenerateSection(PROPOSAL_ID, SECTION_ID);

    // Verify old sources were deleted before new ones inserted
    expect(chain.delete).toHaveBeenCalled();
  });
});
