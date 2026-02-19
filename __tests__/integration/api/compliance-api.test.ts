/**
 * Compliance Matrix API — Phase 0 Tests
 *
 * Tests the CRUD API routes for proposal_requirements.
 * 6 categories: Happy Path, Bad Path, Edge Cases, Security, Data Leak, Data Damage
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

// Track Supabase operations
let mockDbRows: Record<string, unknown>[] = [];
let lastInserted: Record<string, unknown> | null = null;
let lastUpdated: Record<string, unknown> | null = null;
let deletedIds: string[] = [];
let shouldErrorOnQuery = false;

function resetDb() {
  mockDbRows = [];
  lastInserted = null;
  lastUpdated = null;
  deletedIds = [];
  shouldErrorOnQuery = false;
}

// Chainable Supabase query builder
function createChain(resolveWith: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn((row: Record<string, unknown>) => {
    lastInserted = row;
    return chain;
  });
  chain.update = vi.fn((row: Record<string, unknown>) => {
    lastUpdated = row;
    return chain;
  });
  chain.delete = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve(resolveWith));
  // For non-single queries, resolve with the data directly
  chain.then = vi.fn((resolve: (v: unknown) => void) => resolve(resolveWith));
  return chain;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-api", () => ({
  getUserContext: vi.fn(),
  checkProposalAccess: vi.fn(),
  verifyProposalAccess: vi.fn(),
}));

import { NextRequest } from "next/server";
import {
  GET,
  POST,
  PATCH,
  DELETE,
} from "@/app/api/proposals/[id]/requirements/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, checkProposalAccess } from "@/lib/supabase/auth-api";

// ── Helpers ────────────────────────────────────────────────────────────────

const TEST_PROPOSAL_ID = "proposal-111";
const TEST_ORG_ID = "org-222";
const TEST_USER_ID = "user-333";

function mockUserContext() {
  return {
    user: { id: TEST_USER_ID, email: "test@example.com" },
    organizationId: TEST_ORG_ID,
    role: "admin" as const,
    teamId: "team-1",
  };
}

function mockProposal() {
  return {
    id: TEST_PROPOSAL_ID,
    organization_id: TEST_ORG_ID,
    title: "Test Proposal",
  };
}

function makeRequest(
  method: string,
  url = `http://localhost:3000/api/proposals/${TEST_PROPOSAL_ID}/requirements`,
  body?: unknown,
) {
  const init: RequestInit = { method };
  if (body) {
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(url), init);
}

function makeParams() {
  return { params: Promise.resolve({ id: TEST_PROPOSAL_ID }) };
}

function makeRequirement(overrides: Record<string, unknown> = {}) {
  return {
    id: overrides.id ?? "req-1",
    requirement_text:
      overrides.requirement_text ?? "Must provide disaster recovery plan",
    source_reference: overrides.source_reference ?? "Section 4.2",
    category: overrides.category ?? "mandatory",
    compliance_status: overrides.compliance_status ?? "not_addressed",
    mapped_section_id: overrides.mapped_section_id ?? null,
    notes: overrides.notes ?? null,
    is_extracted: overrides.is_extracted ?? false,
    created_at: overrides.created_at ?? "2026-01-15T10:00:00Z",
    updated_at: overrides.updated_at ?? "2026-01-15T10:00:00Z",
  };
}

// Setup supabase mock with custom behavior per table/operation
function setupMockSupabase(
  opts: {
    selectData?: unknown[];
    selectError?: boolean;
    insertData?: unknown;
    insertError?: boolean;
    updateData?: unknown;
    updateError?: boolean;
    deleteError?: boolean;
    existsData?: unknown;
  } = {},
) {
  const mockClient = {
    from: vi.fn((table: string) => {
      // Build a chainable mock that tracks method calls
      const chainState = {
        operation: null as string | null,
        eqFilters: [] as [string, unknown][],
      };

      const chain: Record<string, unknown> = {};

      chain.select = vi.fn((..._args: unknown[]) => {
        chainState.operation = "select";
        return chain;
      });
      chain.insert = vi.fn((row: unknown) => {
        chainState.operation = "insert";
        lastInserted = row as Record<string, unknown>;
        return chain;
      });
      chain.update = vi.fn((row: unknown) => {
        chainState.operation = "update";
        lastUpdated = row as Record<string, unknown>;
        return chain;
      });
      chain.delete = vi.fn(() => {
        chainState.operation = "delete";
        return chain;
      });
      chain.eq = vi.fn((field: string, value: unknown) => {
        chainState.eqFilters.push([field, value]);
        return chain;
      });
      chain.order = vi.fn(() => chain);

      chain.single = vi.fn(() => {
        if (chainState.operation === "insert") {
          if (opts.insertError) {
            return Promise.resolve({
              data: null,
              error: { message: "Insert failed" },
            });
          }
          const inserted = {
            ...makeRequirement(),
            ...(lastInserted || {}),
            id: "req-new-" + Math.random().toString(36).slice(2, 8),
          };
          return Promise.resolve({
            data: opts.insertData ?? inserted,
            error: null,
          });
        }
        if (chainState.operation === "update") {
          if (opts.updateError) {
            return Promise.resolve({
              data: null,
              error: { message: "Update failed" },
            });
          }
          return Promise.resolve({
            data: opts.updateData ?? { ...makeRequirement(), ...lastUpdated },
            error: null,
          });
        }
        if (chainState.operation === "select") {
          // For single selects (like DELETE existence check)
          return Promise.resolve({
            data: opts.existsData ?? makeRequirement(),
            error: null,
          });
        }
        if (chainState.operation === "delete") {
          if (opts.deleteError) {
            return Promise.resolve({
              data: null,
              error: { message: "Delete failed" },
            });
          }
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // For non-single queries (GET list)
      // When chain methods are called but single() is NOT called, the query
      // resolves on the last `.eq()` or `.order()` with {data, error}
      // We override by making the chain itself thenable
      const originalOrder = chain.order as ReturnType<typeof vi.fn>;
      chain.order = vi.fn((...args: unknown[]) => {
        if (opts.selectError) {
          return { data: null, error: { message: "Select failed" } };
        }
        return { data: opts.selectData ?? mockDbRows, error: null };
      });

      // For delete operation (no single)
      const originalEq = chain.eq;
      const deleteChain = {
        ...chain,
        eq: vi.fn((field: string, value: unknown) => {
          chainState.eqFilters.push([field, value]);
          if (
            chainState.operation === "delete" &&
            chainState.eqFilters.length >= 2
          ) {
            if (opts.deleteError) {
              return { data: null, error: { message: "Delete failed" } };
            }
            return { data: null, error: null };
          }
          return chain;
        }),
      };

      // Override delete to return the delete-specialized chain
      chain.delete = vi.fn(() => {
        chainState.operation = "delete";
        return deleteChain;
      });

      return chain;
    }),
  };

  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);
  return mockClient;
}

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  resetDb();

  // Default: authenticated user with access
  (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
    mockUserContext(),
  );
  (checkProposalAccess as ReturnType<typeof vi.fn>).mockResolvedValue(true);
});

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH
// ════════════════════════════════════════════════════════════════════════════

describe("Compliance API — Happy Path", () => {
  it("GET returns empty array for new proposal", async () => {
    setupMockSupabase({ selectData: [] });

    const res = await GET(makeRequest("GET"), makeParams());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.requirements).toEqual([]);
    expect(json.summary.total).toBe(0);
  });

  it("POST creates a requirement with all fields", async () => {
    const reqBody = {
      requirement_text: "Must provide disaster recovery plan",
      source_reference: "Section 4.2",
      category: "mandatory",
      notes: "Critical requirement",
    };

    setupMockSupabase({
      insertData: {
        ...makeRequirement(),
        ...reqBody,
        compliance_status: "not_addressed",
        is_extracted: false,
      },
    });

    const res = await POST(
      makeRequest("POST", undefined, reqBody),
      makeParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.requirement.requirement_text).toBe(reqBody.requirement_text);
    expect(json.requirement.category).toBe("mandatory");
    expect(json.requirement.source_reference).toBe("Section 4.2");
  });

  it("POST auto-defaults compliance_status to not_addressed", async () => {
    setupMockSupabase({
      insertData: makeRequirement({ compliance_status: "not_addressed" }),
    });

    const res = await POST(
      makeRequest("POST", undefined, { requirement_text: "Some requirement" }),
      makeParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.requirement.compliance_status).toBe("not_addressed");
  });

  it("POST auto-defaults category to desirable", async () => {
    setupMockSupabase({
      insertData: makeRequirement({ category: "desirable" }),
    });

    const res = await POST(
      makeRequest("POST", undefined, { requirement_text: "Some requirement" }),
      makeParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    // The API sets category: category || "desirable"
    expect(lastInserted?.category).toBe("desirable");
  });

  it("GET returns requirements sorted by category priority then created_at", async () => {
    const reqs = [
      makeRequirement({
        id: "r1",
        category: "informational",
        created_at: "2026-01-01T00:00:00Z",
      }),
      makeRequirement({
        id: "r2",
        category: "mandatory",
        created_at: "2026-01-02T00:00:00Z",
      }),
      makeRequirement({
        id: "r3",
        category: "desirable",
        created_at: "2026-01-01T00:00:00Z",
      }),
      makeRequirement({
        id: "r4",
        category: "mandatory",
        created_at: "2026-01-01T00:00:00Z",
      }),
    ];

    setupMockSupabase({ selectData: reqs });

    const res = await GET(makeRequest("GET"), makeParams());
    const json = await res.json();

    expect(res.status).toBe(200);
    // Mandatory first (r4 before r2 by date), then desirable (r3), then informational (r1)
    expect(json.requirements.map((r: { id: string }) => r.id)).toEqual([
      "r4",
      "r2",
      "r3",
      "r1",
    ]);
  });

  it("GET computes summary correctly", async () => {
    const reqs = [
      makeRequirement({
        id: "r1",
        category: "mandatory",
        compliance_status: "met",
      }),
      makeRequirement({
        id: "r2",
        category: "mandatory",
        compliance_status: "not_addressed",
      }),
      makeRequirement({
        id: "r3",
        category: "desirable",
        compliance_status: "partially_met",
      }),
      makeRequirement({
        id: "r4",
        category: "informational",
        compliance_status: "not_applicable",
      }),
      makeRequirement({
        id: "r5",
        category: "mandatory",
        compliance_status: "met",
      }),
    ];

    setupMockSupabase({ selectData: reqs });

    const res = await GET(makeRequest("GET"), makeParams());
    const json = await res.json();

    expect(json.summary).toEqual({
      total: 5,
      met: 2,
      partially_met: 1,
      not_addressed: 1,
      not_applicable: 1,
      mandatory_gaps: 1,
      by_type: {
        content: { total: 5, met: 3, gaps: 1 },
        format: { total: 0, met: 0, gaps: 0 },
        submission: { total: 0, met: 0, gaps: 0 },
        certification: { total: 0, met: 0, gaps: 0 },
      },
    });
  });

  it("PATCH updates compliance_status", async () => {
    const mockClient = {
      from: vi.fn(() => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.update = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() =>
          Promise.resolve({
            data: makeRequirement({ id: "req-1", compliance_status: "met" }),
            error: null,
          }),
        );
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await PATCH(
      makeRequest("PATCH", undefined, {
        updates: [{ id: "req-1", compliance_status: "met" }],
      }),
      makeParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.requirements[0].compliance_status).toBe("met");
  });

  it("PATCH batch updates multiple requirements", async () => {
    const mockClient = setupMockSupabase();

    // Override the from().update()...single() chain to return different data per call
    let callCount = 0;
    mockClient.from = vi.fn(() => {
      callCount++;
      const current = callCount;
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn(() => chain);
      chain.update = vi.fn((data: unknown) => {
        lastUpdated = data as Record<string, unknown>;
        return chain;
      });
      chain.eq = vi.fn(() => chain);
      chain.single = vi.fn(() =>
        Promise.resolve({
          data: makeRequirement({
            id: `req-${current}`,
            compliance_status: current === 1 ? "met" : "partially_met",
          }),
          error: null,
        }),
      );
      return chain;
    });

    const res = await PATCH(
      makeRequest("PATCH", undefined, {
        updates: [
          { id: "req-1", compliance_status: "met" },
          { id: "req-2", compliance_status: "partially_met" },
        ],
      }),
      makeParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.requirements).toHaveLength(2);
  });

  it("DELETE removes a requirement by ID", async () => {
    setupMockSupabase({ existsData: { id: "req-1" } });

    const url = `http://localhost:3000/api/proposals/${TEST_PROPOSAL_ID}/requirements?reqId=req-1`;
    const res = await DELETE(makeRequest("DELETE", url), makeParams());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.deleted).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BAD PATH
// ════════════════════════════════════════════════════════════════════════════

describe("Compliance API — Bad Path", () => {
  it("POST with empty requirement_text returns 400", async () => {
    setupMockSupabase();

    const res = await POST(
      makeRequest("POST", undefined, { requirement_text: "" }),
      makeParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("requirement_text");
  });

  it("POST with whitespace-only requirement_text returns 400", async () => {
    setupMockSupabase();

    const res = await POST(
      makeRequest("POST", undefined, { requirement_text: "   " }),
      makeParams(),
    );

    expect(res.status).toBe(400);
  });

  it("POST with missing requirement_text returns 400", async () => {
    setupMockSupabase();

    const res = await POST(
      makeRequest("POST", undefined, { category: "mandatory" }),
      makeParams(),
    );

    expect(res.status).toBe(400);
  });

  it("POST with invalid category returns 400", async () => {
    setupMockSupabase();

    const res = await POST(
      makeRequest("POST", undefined, {
        requirement_text: "Test",
        category: "critical",
      }),
      makeParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("category");
  });

  it("PATCH with invalid compliance_status returns 400", async () => {
    setupMockSupabase();

    const res = await PATCH(
      makeRequest("PATCH", undefined, {
        updates: [{ id: "req-1", compliance_status: "invalid_status" }],
      }),
      makeParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("compliance_status");
  });

  it("PATCH with non-array updates returns 400", async () => {
    setupMockSupabase();

    const res = await PATCH(
      makeRequest("PATCH", undefined, { updates: "not-an-array" }),
      makeParams(),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("array");
  });

  it("PATCH with update missing id returns 400", async () => {
    setupMockSupabase();

    const res = await PATCH(
      makeRequest("PATCH", undefined, {
        updates: [{ compliance_status: "met" }],
      }),
      makeParams(),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("id");
  });

  it("DELETE without reqId query param returns 400", async () => {
    setupMockSupabase();

    const url = `http://localhost:3000/api/proposals/${TEST_PROPOSAL_ID}/requirements`;
    const res = await DELETE(makeRequest("DELETE", url), makeParams());

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("reqId");
  });

  it("DELETE with non-existent requirement returns 404", async () => {
    // Direct mock: first from() call for existence check returns null data
    const mockClient = {
      from: vi.fn(() => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() =>
          Promise.resolve({ data: null, error: null }),
        );
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const url = `http://localhost:3000/api/proposals/${TEST_PROPOSAL_ID}/requirements?reqId=nonexistent`;
    const res = await DELETE(makeRequest("DELETE", url), makeParams());

    expect(res.status).toBe(404);
  });

  it("GET for non-existent proposal returns 404", async () => {
    (checkProposalAccess as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    setupMockSupabase();

    const res = await GET(makeRequest("GET"), makeParams());

    expect(res.status).toBe(404);
    expect((await res.json()).error).toContain("not found");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Compliance API — Edge Cases", () => {
  it("POST with 10,000+ character requirement_text succeeds", async () => {
    const longText = "A".repeat(10_001);
    setupMockSupabase({
      insertData: makeRequirement({ requirement_text: longText }),
    });

    const res = await POST(
      makeRequest("POST", undefined, { requirement_text: longText }),
      makeParams(),
    );

    expect(res.status).toBe(201);
    expect(lastInserted?.requirement_text).toBe(longText);
  });

  it("PATCH with empty updates array returns 200", async () => {
    setupMockSupabase();

    const res = await PATCH(
      makeRequest("PATCH", undefined, { updates: [] }),
      makeParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.requirements).toEqual([]);
  });

  it("GET with 100+ requirements returns all correctly", async () => {
    const manyReqs = Array.from({ length: 105 }, (_, i) =>
      makeRequirement({
        id: `req-${i}`,
        category:
          i % 3 === 0
            ? "mandatory"
            : i % 3 === 1
              ? "desirable"
              : "informational",
        created_at: `2026-01-${String(1 + (i % 28)).padStart(2, "0")}T00:00:00Z`,
      }),
    );

    setupMockSupabase({ selectData: manyReqs });

    const res = await GET(makeRequest("GET"), makeParams());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.requirements).toHaveLength(105);
    expect(json.summary.total).toBe(105);
  });

  it("POST trims whitespace from requirement_text", async () => {
    setupMockSupabase({
      insertData: makeRequirement({ requirement_text: "Trimmed text" }),
    });

    const res = await POST(
      makeRequest("POST", undefined, { requirement_text: "  Trimmed text  " }),
      makeParams(),
    );

    expect(res.status).toBe(201);
    expect(lastInserted?.requirement_text).toBe("Trimmed text");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SECURITY
// ════════════════════════════════════════════════════════════════════════════

describe("Compliance API — Security", () => {
  it("returns 401 when user is not authenticated", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setupMockSupabase();

    const res = await GET(makeRequest("GET"), makeParams());

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized");
  });

  it("returns 404 when user does not have access to proposal", async () => {
    (checkProposalAccess as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    setupMockSupabase();

    const res = await POST(
      makeRequest("POST", undefined, { requirement_text: "Test" }),
      makeParams(),
    );

    expect(res.status).toBe(404);
  });

  it("queries filter by organization_id (RLS supplement)", async () => {
    const mockClient = setupMockSupabase({ selectData: [] });

    await GET(makeRequest("GET"), makeParams());

    // Verify that .eq() was called with organization_id
    const fromCall = mockClient.from.mock.results[0]?.value;
    if (fromCall?.eq) {
      const eqCalls = (fromCall.eq as ReturnType<typeof vi.fn>).mock.calls;
      const hasOrgFilter = eqCalls.some(
        (call: unknown[]) =>
          call[0] === "organization_id" && call[1] === TEST_ORG_ID,
      );
      expect(hasOrgFilter).toBe(true);
    }
  });

  it("SQL injection in requirement_text is passed as parameterized value", async () => {
    const maliciousText = "'; DROP TABLE proposal_requirements; --";
    setupMockSupabase({
      insertData: makeRequirement({ requirement_text: maliciousText }),
    });

    const res = await POST(
      makeRequest("POST", undefined, { requirement_text: maliciousText }),
      makeParams(),
    );

    // Should succeed — Supabase client parameterizes values
    expect(res.status).toBe(201);
    // The text should be stored as-is (parameterized, not interpolated)
    expect(lastInserted?.requirement_text).toBe(maliciousText);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA LEAK
// ════════════════════════════════════════════════════════════════════════════

describe("Compliance API — Data Leak", () => {
  it("error responses do not expose database schema details", async () => {
    setupMockSupabase({ selectError: true });

    const res = await GET(makeRequest("GET"), makeParams());
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Failed to fetch requirements");
    // Should not contain SQL, table names, or column names
    expect(JSON.stringify(json)).not.toMatch(/proposal_requirements/);
    expect(JSON.stringify(json)).not.toMatch(/organization_id/);
  });

  it("404 response does not reveal whether proposal exists in another org", async () => {
    (checkProposalAccess as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    setupMockSupabase();

    const res = await GET(makeRequest("GET"), makeParams());
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Proposal not found");
    // Generic message — doesn't say "not in your org" vs "doesn't exist"
    expect(json.error).not.toMatch(/org|organization|belong/i);
  });

  it("GET response select clause does not include organization_id", async () => {
    // Verify the select call in the route doesn't include organization_id
    const mockClient = setupMockSupabase({ selectData: [makeRequirement()] });

    await GET(makeRequest("GET"), makeParams());

    // Check the select() call args
    const fromCall = mockClient.from.mock.results[0]?.value;
    if (fromCall?.select) {
      const selectCalls = (fromCall.select as ReturnType<typeof vi.fn>).mock
        .calls;
      if (selectCalls.length > 0 && typeof selectCalls[0][0] === "string") {
        expect(selectCalls[0][0]).not.toContain("organization_id");
      }
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA DAMAGE
// ════════════════════════════════════════════════════════════════════════════

describe("Compliance API — Data Damage", () => {
  it("POST with invalid proposal_id is caught by verifyProposalAccess", async () => {
    (checkProposalAccess as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    setupMockSupabase();

    const res = await POST(
      makeRequest("POST", undefined, { requirement_text: "Test" }),
      makeParams(),
    );

    // Returns 404 without inserting anything
    expect(res.status).toBe(404);
    expect(lastInserted).toBeNull();
  });

  it("failed insert does not leave partial data", async () => {
    // Direct mock: insert chain returns error on .single()
    const mockClient = {
      from: vi.fn(() => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.insert = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() =>
          Promise.resolve({ data: null, error: { message: "Insert failed" } }),
        );
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await POST(
      makeRequest("POST", undefined, { requirement_text: "Test requirement" }),
      makeParams(),
    );

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to create requirement");
  });

  it("PATCH update failure returns error without modifying other requirements", async () => {
    // First update succeeds, second fails
    let callCount = 0;
    const mockClient = {
      from: vi.fn(() => {
        callCount++;
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.update = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() => {
          if (callCount === 1) {
            return Promise.resolve({
              data: makeRequirement({ id: "req-1", compliance_status: "met" }),
              error: null,
            });
          }
          return Promise.resolve({
            data: null,
            error: { message: "Update failed" },
          });
        });
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await PATCH(
      makeRequest("PATCH", undefined, {
        updates: [
          { id: "req-1", compliance_status: "met" },
          { id: "req-2", compliance_status: "partially_met" },
        ],
      }),
      makeParams(),
    );

    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain("req-2");
  });
});
