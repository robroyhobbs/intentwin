/**
 * Tests for client-orchestrated generation routes:
 *   POST /api/proposals/[id]/generate/setup
 *   POST /api/proposals/[id]/generate/section
 *   POST /api/proposals/[id]/generate/finalize
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockIngestCopilotEvent = vi.fn();

// ── Shared mock state ────────────────────────────────────────────────────────

const mockUserContext = {
  user: { id: "user-1", email: "test@test.com" },
  organizationId: "org-1",
  role: "admin",
};

const mockProposal = {
  id: "prop-1",
  organization_id: "org-1",
  title: "Test Proposal",
  status: "draft",
  intake_data: {
    client_industry: "Technology",
    opportunity_type: "consulting",
    service_line: "cloud",
    selected_sections: [],
  },
  win_strategy_data: null,
  outcome_contract: null,
  rfp_extracted_requirements: [],
  bid_evaluation: null,
  generation_metadata: null,
  organizations: { name: "Test Org", settings: {} },
};

// ── Module mocks (hoisted) ───────────────────────────────────────────────────

vi.mock("@/lib/supabase/auth-api", () => ({
  getUserContext: vi.fn().mockResolvedValue(mockUserContext),
  verifyProposalAccess: vi.fn().mockResolvedValue(mockProposal),
  checkProposalAccess: vi.fn().mockResolvedValue(true),
  checkPlanLimit: vi.fn().mockResolvedValue({ allowed: true, limit: Infinity }),
}));

vi.mock("@/lib/features/check-feature", () => ({
  checkFeature: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/utils/logger", () => {
  const noop = vi.fn();
  const mockLogger = {
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
  };
  return {
    logger: mockLogger,
    createLogger: vi.fn(() => mockLogger),
  };
});

// Chainable Supabase mock factory
function createChain(
  resolveData: unknown = null,
  resolveError: unknown = null,
) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
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
    "order",
    "limit",
    "range",
    "match",
    "maybeSingle",
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  chain.single = vi.fn(() =>
    Promise.resolve({ data: resolveData, error: resolveError }),
  );
  // Default promise resolution for non-.single() chains
  chain.then = vi.fn((resolve: (v: unknown) => unknown) =>
    Promise.resolve(resolve({ data: resolveData, error: resolveError })),
  );
  return chain;
}

let mockFromFn: ReturnType<typeof vi.fn>;
let mockChains: Record<string, ReturnType<typeof createChain>>;

function setupMockSupabase(
  overrides: Record<string, { data?: unknown; error?: unknown }> = {},
) {
  mockChains = {};
  for (const [table, val] of Object.entries(overrides)) {
    mockChains[table] = createChain(val.data ?? null, val.error ?? null);
  }
  mockFromFn = vi.fn((table: string) => {
    if (mockChains[table]) return mockChains[table];
    return createChain();
  });
  return { from: mockFromFn, rpc: vi.fn() };
}

let mockSupabase: ReturnType<typeof setupMockSupabase>;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));

vi.mock("@/lib/ai/pipeline/context", () => ({
  buildPipelineContext: vi.fn(),
  fetchL1Context: vi.fn().mockResolvedValue({
    companyContext: [],
    productContexts: [],
    evidenceLibrary: [],
    teamMembers: [],
  }),
}));

vi.mock("@/lib/ai/pipeline/section-configs", () => ({
  buildSectionList: vi.fn(() => [
    {
      type: "executive_summary",
      title: "Executive Summary",
      order: 1,
      buildPrompt: () => "",
      searchQuery: () => "",
    },
    {
      type: "technical_approach",
      title: "Technical Approach",
      order: 2,
      buildPrompt: () => "",
      searchQuery: () => "",
    },
  ]),
}));

vi.mock("@/lib/ai/pipeline/preflight", () => ({
  runPreflightCheck: vi.fn(() => ({ status: "pass", gaps: [] })),
}));

vi.mock("@/lib/ai/pipeline/generate-single-section", () => ({
  generateSingleSection: vi.fn(),
}));

vi.mock("@/lib/ai/pipeline/differentiators", () => ({
  extractDifferentiators: vi.fn(() => ["diff-1", "diff-2"]),
}));

vi.mock("@/inngest/client", () => ({
  inngest: { send: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("@/lib/versioning/create-version", () => ({
  createProposalVersion: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/copilot/ingest-event", () => ({
  ingestCopilotEvent: mockIngestCopilotEvent,
}));

beforeEach(() => {
  mockIngestCopilotEvent.mockReset();
  mockIngestCopilotEvent.mockResolvedValue({ ok: true });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(url: string, body?: unknown): NextRequest {
  const init: RequestInit = { method: "POST" };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest(url, init);
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function parseResponse(res: Response) {
  return { status: res.status, body: await res.json() };
}

describe("POST /api/proposals/[id]/generate (deprecated)", () => {
  it("returns 410 Gone with migration guidance", async () => {
    const { POST } = await import("../route");

    const response = await POST();
    const data = await parseResponse(response);

    expect(data.status).toBe(410);
    expect(data.body).toEqual({
      error:
        "This endpoint has been replaced. Use /generate/setup, /generate/section, and /generate/finalize instead.",
      code: "DEPRECATED",
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP ROUTE
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/proposals/[id]/generate/setup", () => {
  let POST: (
    req: Request,
    ctx: { params: Promise<{ id: string }> },
  ) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default mock: claim succeeds, sections insert succeeds, metadata update succeeds
    mockSupabase = setupMockSupabase({
      proposals: { data: { id: "prop-1" } },
      proposal_sections: {
        data: [
          {
            id: "sec-1",
            section_type: "executive_summary",
            title: "Executive Summary",
          },
          {
            id: "sec-2",
            section_type: "technical_approach",
            title: "Technical Approach",
          },
        ],
      },
    });

    // buildPipelineContext returns mock context
    const { buildPipelineContext } = await import("@/lib/ai/pipeline/context");
    (buildPipelineContext as ReturnType<typeof vi.fn>).mockResolvedValue({
      proposal: mockProposal,
      intakeData: mockProposal.intake_data,
      rawL1Context: {
        companyContext: [],
        productContexts: [],
        evidenceLibrary: [],
        teamMembers: [],
      },
      l1ContextString: "",
      serviceLine: "cloud",
      industry: "Technology",
    });

    const mod = await import("../setup/route");
    POST = mod.POST;
  });

  it("returns sections on successful setup", async () => {
    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/setup",
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.sectionCount).toBe(2);
    expect(body.sections).toHaveLength(2);
    expect(body.sections[0].sectionType).toBe("executive_summary");
    expect(mockIngestCopilotEvent).not.toHaveBeenCalled();
  });

  it("returns 403 when feature gate is disabled", async () => {
    const { checkFeature } = await import("@/lib/features/check-feature");
    (checkFeature as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/setup",
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("returns 429 when token limit exceeded", async () => {
    const { checkPlanLimit } = await import("@/lib/supabase/auth-api");
    (checkPlanLimit as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      allowed: false,
      message: "Token limit reached",
    });

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/setup",
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(429);
    expect(body.error.toLowerCase()).toContain("token");
  });

  it("returns 500 and reverts to DRAFT when buildPipelineContext fails", async () => {
    const { buildPipelineContext } = await import("@/lib/ai/pipeline/context");
    (buildPipelineContext as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Gemini timeout"),
    );

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/setup",
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status } = await parseResponse(res);

    expect(status).toBe(500);
    // Verify revert to DRAFT was attempted
    expect(mockFromFn).toHaveBeenCalledWith("proposals");
    expect(mockIngestCopilotEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "proposal.generation.failed",
        organizationId: mockUserContext.organizationId,
        source: "intentwin",
        payload: expect.objectContaining({
          proposalId: "prop-1",
          retryable: false,
          stage: "setup",
          errorMessage: "Gemini timeout",
        }),
      }),
      {},
    );
  });

  it("returns 500 and emits a copilot event when section creation fails", async () => {
    mockChains["proposal_sections"] = createChain(null, {
      message: "section insert failed",
    });

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/setup",
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(500);
    expect(body.error).toContain("Failed to create sections");
    expect(mockIngestCopilotEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "proposal.generation.failed",
        organizationId: mockUserContext.organizationId,
        source: "intentwin",
        payload: expect.objectContaining({
          proposalId: "prop-1",
          retryable: false,
          stage: "setup",
          errorMessage: "section insert failed",
        }),
      }),
      {},
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION ROUTE
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/proposals/[id]/generate/section", () => {
  let POST: (
    req: Request,
    ctx: { params: Promise<{ id: string }> },
  ) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default: section exists and is pending, proposal has generation_metadata
    mockSupabase = setupMockSupabase({
      proposal_sections: {
        data: {
          section_type: "executive_summary",
          generation_status: "pending",
          generated_content: null,
        },
      },
      proposals: {
        data: {
          generation_metadata: {
            proposal: mockProposal,
            intakeData: mockProposal.intake_data,
            rawL1Context: {
              companyContext: [],
              productContexts: [],
              evidenceLibrary: [],
            },
            l1ContextString: "",
            serviceLine: "cloud",
            industry: "Technology",
          },
        },
      },
    });

    const { generateSingleSection } =
      await import("@/lib/ai/pipeline/generate-single-section");
    (generateSingleSection as ReturnType<typeof vi.fn>).mockResolvedValue({
      generatedContent: "# Executive Summary\nGenerated content here.",
      chunkCount: 3,
    });

    const mod = await import("../section/route");
    POST = mod.POST;
  });

  it("generates a section successfully", async () => {
    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/section",
      { sectionId: "sec-1" },
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.status).toBe("completed");
    expect(body.content).toContain("Executive Summary");
  });

  it("returns 400 when sectionId is missing", async () => {
    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/section",
      {},
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("returns cached content for already-completed sections (idempotency)", async () => {
    // Override section to be already completed
    mockChains["proposal_sections"] = createChain({
      section_type: "executive_summary",
      generation_status: "completed",
      generated_content: "Cached executive summary content.",
    });

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/section",
      { sectionId: "sec-1" },
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.status).toBe("completed");
    expect(body.content).toBe("Cached executive summary content.");
  });

  it("returns 500 when pipeline context is missing", async () => {
    // Override proposals to have no generation_metadata
    mockChains["proposals"] = createChain({ generation_metadata: null });

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/section",
      { sectionId: "sec-1" },
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(500);
    expect(body.error).toContain("Pipeline context");
  });

  it("returns failed status when generateSingleSection throws", async () => {
    const { generateSingleSection } =
      await import("@/lib/ai/pipeline/generate-single-section");
    // Must reject consistently — withRetry will retry up to 2 additional times
    (generateSingleSection as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Gemini rate limit"),
    );

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/section",
      { sectionId: "sec-1" },
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200); // Route returns 200 with status:"failed" in body
    expect(body.status).toBe("failed");
    expect(body.error).toContain("rate limit");
    expect(mockIngestCopilotEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "proposal.generation.failed",
        organizationId: mockUserContext.organizationId,
        source: "intentwin",
        payload: expect.objectContaining({
          proposalId: "prop-1",
          retryable: true,
          stage: "section",
          sectionId: "sec-1",
          sectionType: "executive_summary",
          attempts: 3,
          errorMessage: "Gemini rate limit",
        }),
      }),
      {},
    );
  });

  it("does not retry permanent validation errors", async () => {
    const { generateSingleSection } =
      await import("@/lib/ai/pipeline/generate-single-section");
    (generateSingleSection as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("validation error"),
    );

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/section",
      { sectionId: "sec-1" },
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.status).toBe("failed");
    expect(body.error).toContain("validation error");
    expect(generateSingleSection).toHaveBeenCalledTimes(1);
  });

  it("returns failed status with fallback content when manual completion is required", async () => {
    const { generateSingleSection } =
      await import("@/lib/ai/pipeline/generate-single-section");
    (generateSingleSection as ReturnType<typeof vi.fn>).mockResolvedValue({
      generatedContent: "## Executive Summary\n\nManual completion required.",
      chunkCount: 0,
      requiresManualCompletion: true,
      failureReason: "AI provider unavailable",
    });

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/section",
      { sectionId: "sec-1" },
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.status).toBe("failed");
    expect(body.content).toContain("Manual completion required");
    expect(body.error).toContain("AI provider unavailable");
  });

  it("retries transient failure and returns content on success (retry integration)", async () => {
    const { generateSingleSection } =
      await import("@/lib/ai/pipeline/generate-single-section");
    // First call fails, second succeeds
    (generateSingleSection as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("AI timeout"))
      .mockResolvedValueOnce({
        generatedContent: "# Recovered Content\nRetry succeeded.",
        chunkCount: 2,
      });

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/section",
      { sectionId: "sec-1" },
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.status).toBe("completed");
    expect(body.content).toContain("Recovered Content");
    expect(generateSingleSection).toHaveBeenCalledTimes(2);
    expect(mockIngestCopilotEvent).not.toHaveBeenCalled();
  });

  it("server logs full error but client response has sanitized message only", async () => {
    const { createLogger } = await import("@/lib/utils/logger");
    const mockLog = (createLogger as ReturnType<typeof vi.fn>)();

    const { generateSingleSection } =
      await import("@/lib/ai/pipeline/generate-single-section");
    (generateSingleSection as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error(
        "Internal: model=gemini-2.0-flash, endpoint=https://api.internal/v1",
      ),
    );

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/section",
      { sectionId: "sec-1" },
    );
    const res = await POST(req, makeParams("prop-1"));
    const { body } = await parseResponse(res);

    // Server-side log should have been called with full error details
    expect(mockLog.error).toHaveBeenCalled();
    // Logger receives: ("Section generation failed", { sectionId, sectionType, error, attempts })
    const logArgs = mockLog.error.mock.calls.find(
      (args: unknown[]) =>
        typeof args[0] === "string" && args[0].includes("failed"),
    );
    expect(logArgs).toBeDefined();

    // Client response should include the error message but no stack
    expect(body.status).toBe("failed");
    expect(body.error).toBeDefined();
    expect(body).not.toHaveProperty("stack");
    expect(body).not.toHaveProperty("internalStack");
  });

  it("retry metadata does not expose timing details", async () => {
    const { generateSingleSection } =
      await import("@/lib/ai/pipeline/generate-single-section");
    (generateSingleSection as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Service unavailable"),
    );

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/section",
      { sectionId: "sec-1" },
    );
    const res = await POST(req, makeParams("prop-1"));
    const { body } = await parseResponse(res);

    // Error response must not reveal backoff timing or infrastructure
    expect(body.error).not.toMatch(/delay|backoff|timeout.*ms|2000|4000/i);
    expect(body).not.toHaveProperty("retryDelay");
    expect(body).not.toHaveProperty("nextRetryAt");
  });

  it("retry of section generation does not create duplicate sections (idempotency)", async () => {
    // Simulate: section already completed from a previous attempt
    mockChains["proposal_sections"] = createChain({
      section_type: "executive_summary",
      generation_status: "completed",
      generated_content: "Already generated content.",
    });

    const { generateSingleSection } =
      await import("@/lib/ai/pipeline/generate-single-section");

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/section",
      { sectionId: "sec-1" },
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.status).toBe("completed");
    expect(body.content).toBe("Already generated content.");
    // generateSingleSection should NOT have been called — cached result returned
    expect(generateSingleSection).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FINALIZE ROUTE
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/proposals/[id]/generate/finalize", () => {
  let POST: (
    req: Request,
    ctx: { params: Promise<{ id: string }> },
  ) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("../finalize/route");
    POST = mod.POST;
  });

  it("finalizes with all sections completed → status REVIEW", async () => {
    mockSupabase = setupMockSupabase({
      proposal_sections: {
        data: [
          {
            id: "s1",
            section_type: "executive_summary",
            generation_status: "completed",
            generation_error: null,
          },
          {
            id: "s2",
            section_type: "technical_approach",
            generation_status: "completed",
            generation_error: null,
          },
        ],
      },
    });

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/finalize",
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.completedCount).toBe(2);
    expect(body.failedCount).toBe(0);
    expect(body.status).toBe("review");
    expect(mockIngestCopilotEvent).not.toHaveBeenCalled();
  });

  it("finalizes with all sections failed → status DRAFT", async () => {
    mockSupabase = setupMockSupabase({
      proposal_sections: {
        data: [
          {
            id: "s1",
            section_type: "executive_summary",
            generation_status: "failed",
            generation_error: "timeout",
          },
          {
            id: "s2",
            section_type: "technical_approach",
            generation_status: "failed",
            generation_error: "timeout",
          },
        ],
      },
    });

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/finalize",
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.completedCount).toBe(0);
    expect(body.failedCount).toBe(2);
    expect(body.status).toBe("draft");
    expect(mockIngestCopilotEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "proposal.generation.failed",
        organizationId: mockUserContext.organizationId,
        source: "intentwin",
        payload: expect.objectContaining({
          proposalId: "prop-1",
          retryable: false,
          stage: "finalize",
          errorMessage:
            "All 2 sections failed to generate. Check AI service connectivity and retry.",
        }),
      }),
      {},
    );
  });

  it("handles mixed completed and failed sections", async () => {
    mockSupabase = setupMockSupabase({
      proposal_sections: {
        data: [
          {
            id: "s1",
            section_type: "executive_summary",
            generation_status: "completed",
            generation_error: null,
          },
          {
            id: "s2",
            section_type: "technical_approach",
            generation_status: "failed",
            generation_error: "Timed out",
          },
        ],
      },
    });

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/finalize",
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.completedCount).toBe(1);
    expect(body.failedCount).toBe(1);
    expect(body.status).toBe("review"); // 1 completed = REVIEW
    expect(mockIngestCopilotEvent).not.toHaveBeenCalled();
  });

  it("returns 500 when section fetch fails", async () => {
    mockSupabase = setupMockSupabase({
      proposal_sections: { data: null, error: { message: "DB error" } },
    });

    const req = makeRequest(
      "http://localhost/api/proposals/prop-1/generate/finalize",
    );
    const res = await POST(req, makeParams("prop-1"));
    const { status } = await parseResponse(res);

    expect(status).toBe(500);
    expect(mockIngestCopilotEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "proposal.generation.failed",
        organizationId: mockUserContext.organizationId,
        source: "intentwin",
        payload: expect.objectContaining({
          proposalId: "prop-1",
          retryable: true,
          stage: "finalize",
          errorMessage: "Failed to finalize proposal",
        }),
      }),
      {},
    );
  });
});
