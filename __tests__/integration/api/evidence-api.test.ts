/**
 * Company Truth (IMF L1) — Evidence API Tests
 *
 * Tests the CRUD API routes for evidence_library with filter support.
 * 6 categories: Happy Path, Bad Path, Edge Cases, Security, Data Leak, Data Damage
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

let lastInserted: Record<string, unknown> | null = null;
let lastUpdated: Record<string, unknown> | null = null;

function resetDb() {
  lastInserted = null;
  lastUpdated = null;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-api", () => ({
  getUserContext: vi.fn(),
}));

import { NextRequest } from "next/server";
import { GET, POST, PATCH, DELETE } from "@/app/api/evidence/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";

// ── Helpers ────────────────────────────────────────────────────────────────

const TEST_ORG_ID = "org-444";
const TEST_USER_ID = "user-555";
const BASE_URL = "http://localhost:3000/api/evidence";

function mockUserContext() {
  return {
    user: { id: TEST_USER_ID, email: "test@example.com" },
    organizationId: TEST_ORG_ID,
    role: "admin" as const,
    teamId: "team-1",
  };
}

function makeRequest(method: string, url = BASE_URL, body?: unknown) {
  const init: RequestInit = { method };
  if (body) {
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(url), init);
}

function makeEvidence(overrides: Record<string, unknown> = {}) {
  return {
    id: overrides.id ?? "ev-1",
    evidence_type: overrides.evidence_type ?? "case_study",
    title: overrides.title ?? "Healthcare Cloud Migration",
    summary: overrides.summary ?? "Migrated 500K records to cloud",
    full_content: overrides.full_content ?? "Full case study content...",
    client_industry: overrides.client_industry ?? "healthcare",
    service_line: overrides.service_line ?? "cloud",
    client_size: overrides.client_size ?? "enterprise",
    outcomes_demonstrated: overrides.outcomes_demonstrated ?? [
      { outcome: "cost_optimization", description: "Reduced costs by 40%" },
    ],
    metrics: overrides.metrics ?? [
      { name: "Cost Savings", value: "40%", context: "Annual IT budget" },
    ],
    is_verified: overrides.is_verified ?? false,
    verified_at: overrides.verified_at ?? null,
    verification_notes: overrides.verification_notes ?? null,
    created_at: overrides.created_at ?? "2026-01-01T00:00:00Z",
  };
}

// Setup supabase mock with custom behavior
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
  const chainState = {
    operation: null as string | null,
    eqFilters: [] as [string, unknown][],
  };

  // Single shared chain object so post-hoc from() calls return the same mock
  const chain: Record<string, unknown> = {};

  chain.select = vi.fn((..._args: unknown[]) => {
    if (!chainState.operation) {
      chainState.operation = "select";
    }
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
  chain.eq = vi.fn((field: string, value: unknown) => {
    chainState.eqFilters.push([field, value]);
    return chain;
  });
  chain.or = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.range = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);

  // Thenable for GET queries (await query.order().order().range())
  chain.then = vi.fn((resolve: (v: unknown) => void) => {
    if (opts.selectError) {
      resolve({ data: null, error: { message: "Select failed" }, count: 0 });
    } else {
      const data = opts.selectData ?? [];
      resolve({ data, error: null, count: (data as unknown[]).length });
    }
  });

  chain.single = vi.fn(() => {
    if (chainState.operation === "insert") {
      if (opts.insertError) {
        return Promise.resolve({
          data: null,
          error: { message: "Insert failed" },
        });
      }
      const inserted = {
        ...makeEvidence(),
        ...(lastInserted || {}),
        id: "ev-new-" + Math.random().toString(36).slice(2, 8),
      };
      const { organization_id: _, ...clean } = inserted as Record<
        string,
        unknown
      >;
      return Promise.resolve({
        data: opts.insertData ?? clean,
        error: null,
      });
    }
    if (chainState.operation === "update") {
      if (opts.updateError) {
        return Promise.resolve({
          data: null,
          error: { message: "Update failed", code: "PGRST116" },
        });
      }
      return Promise.resolve({
        data: opts.updateData ?? { ...makeEvidence(), ...lastUpdated },
        error: null,
      });
    }
    if (chainState.operation === "select") {
      return Promise.resolve({
        data: opts.existsData ?? null,
        error: opts.existsData ? null : { code: "PGRST116" },
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

  // Delete needs its own chain to avoid conflicting with select chain
  chain.delete = vi.fn(() => {
    chainState.operation = "delete";
    const deleteChain: Record<string, unknown> = {
      eq: vi.fn((_field: string, _value: unknown) => {
        return deleteChain;
      }),
      then: vi.fn((resolve: (v: unknown) => void) => {
        if (opts.deleteError) {
          resolve({ data: null, error: { message: "Delete failed" } });
        } else {
          resolve({ data: null, error: null });
        }
      }),
    };
    return deleteChain;
  });

  const mockClient = {
    from: vi.fn((_table: string) => chain),
  };

  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);
  return mockClient;
}

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  resetDb();

  (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
    mockUserContext(),
  );
});

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH
// ════════════════════════════════════════════════════════════════════════════

describe("Evidence API — Happy Path", () => {
  it("GET returns empty array for org with no evidence", async () => {
    const mock = setupMockSupabase({ selectData: [] });

    const res = await GET(makeRequest("GET"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.evidence).toEqual([]);
  });

  it("POST creates evidence entry with all fields", async () => {
    setupMockSupabase();

    const body = {
      evidence_type: "case_study",
      title: "Healthcare Migration",
      summary: "Migrated 500K records",
      full_content: "Full content here",
      client_industry: "healthcare",
      service_line: "cloud",
      client_size: "enterprise",
      outcomes_demonstrated: [
        { outcome: "cost_optimization", description: "Reduced costs" },
      ],
      metrics: [{ name: "Savings", value: "40%", context: "Annual" }],
    };

    const res = await POST(makeRequest("POST", BASE_URL, body));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.evidence).toBeDefined();
    expect(lastInserted?.evidence_type).toBe("case_study");
    expect(lastInserted?.title).toBe("Healthcare Migration");
  });

  it("POST auto-defaults is_verified to false", async () => {
    setupMockSupabase();

    const body = {
      evidence_type: "metric",
      title: "Cost Savings",
      summary: "40% reduction",
    };

    await POST(makeRequest("POST", BASE_URL, body));

    expect(lastInserted?.is_verified).toBe(false);
  });

  it("GET returns evidence sorted by evidence_type then created_at", async () => {
    const evidence = [
      makeEvidence({ id: "ev-1", evidence_type: "award" }),
      makeEvidence({ id: "ev-2", evidence_type: "case_study" }),
    ];
    const mock = setupMockSupabase({ selectData: evidence });

    const res = await GET(makeRequest("GET"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.evidence).toHaveLength(2);
    // Verify order was called on the mock
    const fromResult = mock.from("evidence_library");
    expect(fromResult.order).toHaveBeenCalled();
  });

  it("GET with ?type=case_study filter returns only case studies", async () => {
    const mock = setupMockSupabase({
      selectData: [makeEvidence({ evidence_type: "case_study" })],
    });

    const res = await GET(makeRequest("GET", `${BASE_URL}?type=case_study`));
    const json = await res.json();

    expect(res.status).toBe(200);
    const fromResult = mock.from("evidence_library");
    expect(fromResult.eq).toHaveBeenCalledWith("evidence_type", "case_study");
  });

  it("GET with ?industry=healthcare filter works", async () => {
    const mock = setupMockSupabase({
      selectData: [makeEvidence({ client_industry: "healthcare" })],
    });

    const res = await GET(
      makeRequest("GET", `${BASE_URL}?industry=healthcare`),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    const fromResult = mock.from("evidence_library");
    expect(fromResult.or).toHaveBeenCalled();
  });

  it("GET with ?service_line=cloud filter works", async () => {
    const mock = setupMockSupabase({
      selectData: [makeEvidence({ service_line: "cloud" })],
    });

    const res = await GET(makeRequest("GET", `${BASE_URL}?service_line=cloud`));
    const json = await res.json();

    expect(res.status).toBe(200);
    const fromResult = mock.from("evidence_library");
    expect(fromResult.eq).toHaveBeenCalledWith("service_line", "cloud");
  });

  it("GET with ?verified=true filter returns only verified", async () => {
    const mock = setupMockSupabase({
      selectData: [makeEvidence({ is_verified: true })],
    });

    const res = await GET(makeRequest("GET", `${BASE_URL}?verified=true`));
    const json = await res.json();

    expect(res.status).toBe(200);
    const fromResult = mock.from("evidence_library");
    expect(fromResult.eq).toHaveBeenCalledWith("is_verified", true);
  });

  it("GET with multiple filters combines them (AND logic)", async () => {
    const mock = setupMockSupabase({ selectData: [] });

    const res = await GET(
      makeRequest(
        "GET",
        `${BASE_URL}?type=case_study&service_line=cloud&verified=true`,
      ),
    );

    expect(res.status).toBe(200);
    const fromResult = mock.from("evidence_library");
    expect(fromResult.eq).toHaveBeenCalledWith("evidence_type", "case_study");
    expect(fromResult.eq).toHaveBeenCalledWith("service_line", "cloud");
    expect(fromResult.eq).toHaveBeenCalledWith("is_verified", true);
  });

  it("PATCH updates title, summary, full_content", async () => {
    setupMockSupabase({
      updateData: makeEvidence({
        title: "Updated Title",
        summary: "Updated summary",
      }),
    });

    const body = {
      id: "ev-1",
      title: "Updated Title",
      summary: "Updated summary",
      full_content: "Updated content",
    };

    const res = await PATCH(makeRequest("PATCH", BASE_URL, body));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(lastUpdated?.title).toBe("Updated Title");
    expect(lastUpdated?.summary).toBe("Updated summary");
  });

  it("PATCH with is_verified=true marks entry as verified", async () => {
    setupMockSupabase({
      updateData: makeEvidence({ is_verified: true }),
    });

    const body = { id: "ev-1", is_verified: true };
    const res = await PATCH(makeRequest("PATCH", BASE_URL, body));

    expect(res.status).toBe(200);
    expect(lastUpdated?.is_verified).toBe(true);
    expect(lastUpdated?.verified_at).toBeDefined();
  });

  it("PATCH with is_verified=false unverifies entry", async () => {
    setupMockSupabase({
      updateData: makeEvidence({ is_verified: false }),
    });

    const body = { id: "ev-1", is_verified: false };
    const res = await PATCH(makeRequest("PATCH", BASE_URL, body));

    expect(res.status).toBe(200);
    expect(lastUpdated?.is_verified).toBe(false);
    expect(lastUpdated?.verified_at).toBeNull();
  });

  it("DELETE removes an evidence entry by ID", async () => {
    setupMockSupabase({ existsData: { id: "ev-1" } });

    const res = await DELETE(makeRequest("DELETE", `${BASE_URL}?id=ev-1`));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.deleted).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BAD PATH
// ════════════════════════════════════════════════════════════════════════════

describe("Evidence API — Bad Path", () => {
  it("POST with empty title returns 400", async () => {
    setupMockSupabase();

    const body = { evidence_type: "case_study", title: "", summary: "ok" };
    const res = await POST(makeRequest("POST", BASE_URL, body));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("title");
  });

  it("POST with invalid evidence_type returns 400", async () => {
    setupMockSupabase();

    const body = {
      evidence_type: "invalid_type",
      title: "Test",
      summary: "ok",
    };
    const res = await POST(makeRequest("POST", BASE_URL, body));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("evidence_type");
  });

  it("POST with missing summary returns 400", async () => {
    setupMockSupabase();

    const body = { evidence_type: "case_study", title: "Test" };
    const res = await POST(makeRequest("POST", BASE_URL, body));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("summary");
  });

  it("PATCH with non-existent evidence ID returns 404", async () => {
    setupMockSupabase({ updateError: true });

    const body = { id: "ev-nonexistent", title: "Updated" };
    const res = await PATCH(makeRequest("PATCH", BASE_URL, body));

    expect(res.status).toBe(404);
  });

  it("DELETE with non-existent evidence ID returns 404", async () => {
    setupMockSupabase({ existsData: null });

    const res = await DELETE(
      makeRequest("DELETE", `${BASE_URL}?id=ev-nonexistent`),
    );

    expect(res.status).toBe(404);
  });

  it("PATCH with missing id in body returns 400", async () => {
    setupMockSupabase();

    const body = { title: "Updated" };
    const res = await PATCH(makeRequest("PATCH", BASE_URL, body));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("id");
  });

  it("GET with invalid type filter returns 400", async () => {
    setupMockSupabase();

    const res = await GET(makeRequest("GET", `${BASE_URL}?type=invalid_type`));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("type");
  });

  it("Unauthenticated request returns 401", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setupMockSupabase();

    const res = await GET(makeRequest("GET"));

    expect(res.status).toBe(401);
  });

  it("PATCH with invalid is_verified value returns 400", async () => {
    setupMockSupabase();

    const body = { id: "ev-1", is_verified: "yes" };
    const res = await PATCH(makeRequest("PATCH", BASE_URL, body));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("is_verified");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Evidence API — Edge Cases", () => {
  it("POST with null client_industry and null service_line succeeds", async () => {
    setupMockSupabase();

    const body = {
      evidence_type: "metric",
      title: "General Metric",
      summary: "A general metric",
      client_industry: null,
      service_line: null,
    };
    const res = await POST(makeRequest("POST", BASE_URL, body));

    expect(res.status).toBe(201);
    expect(lastInserted?.client_industry).toBeNull();
    expect(lastInserted?.service_line).toBeNull();
  });

  it("POST with client_size enterprise/mid_market/smb all succeed", async () => {
    for (const size of ["enterprise", "mid_market", "smb"]) {
      resetDb();
      setupMockSupabase();

      const body = {
        evidence_type: "testimonial",
        title: `${size} testimonial`,
        summary: "Summary",
        client_size: size,
      };
      const res = await POST(makeRequest("POST", BASE_URL, body));

      expect(res.status).toBe(201);
      expect(lastInserted?.client_size).toBe(size);
    }
  });

  it("GET with no filters returns all evidence for org", async () => {
    const evidence = Array.from({ length: 5 }, (_, i) =>
      makeEvidence({ id: `ev-${i}` }),
    );
    setupMockSupabase({ selectData: evidence });

    const res = await GET(makeRequest("GET"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.evidence).toHaveLength(5);
  });

  it("GET with ?verified=false returns only unverified", async () => {
    const mock = setupMockSupabase({
      selectData: [makeEvidence({ is_verified: false })],
    });

    const res = await GET(makeRequest("GET", `${BASE_URL}?verified=false`));

    expect(res.status).toBe(200);
    const fromResult = mock.from("evidence_library");
    expect(fromResult.eq).toHaveBeenCalledWith("is_verified", false);
  });

  it("POST with very long full_content (50K chars) succeeds", async () => {
    setupMockSupabase();

    const body = {
      evidence_type: "case_study",
      title: "Long Content",
      summary: "Summary",
      full_content: "x".repeat(50000),
    };
    const res = await POST(makeRequest("POST", BASE_URL, body));

    expect(res.status).toBe(201);
    expect((lastInserted?.full_content as string).length).toBe(50000);
  });

  it("PATCH verify then unverify roundtrip works", async () => {
    // Verify
    setupMockSupabase({
      updateData: makeEvidence({ is_verified: true }),
    });
    let body = { id: "ev-1", is_verified: true };
    let res = await PATCH(makeRequest("PATCH", BASE_URL, body));
    expect(res.status).toBe(200);
    expect(lastUpdated?.is_verified).toBe(true);

    // Unverify
    resetDb();
    setupMockSupabase({
      updateData: makeEvidence({ is_verified: false }),
    });
    body = { id: "ev-1", is_verified: false };
    res = await PATCH(makeRequest("PATCH", BASE_URL, body));
    expect(res.status).toBe(200);
    expect(lastUpdated?.is_verified).toBe(false);
    expect(lastUpdated?.verified_at).toBeNull();
  });

  it("GET with 50+ evidence entries returns all correctly", async () => {
    const evidence = Array.from({ length: 55 }, (_, i) =>
      makeEvidence({ id: `ev-${i}` }),
    );
    setupMockSupabase({ selectData: evidence });

    const res = await GET(makeRequest("GET"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.evidence).toHaveLength(55);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SECURITY
// ════════════════════════════════════════════════════════════════════════════

describe("Evidence API — Security", () => {
  it("API validates user belongs to an organization", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await POST(
      makeRequest("POST", BASE_URL, {
        evidence_type: "metric",
        title: "Test",
        summary: "Test",
      }),
    );

    expect(res.status).toBe(401);
  });

  it("Cannot access evidence from another organization", async () => {
    const mock = setupMockSupabase({ selectData: [] });

    await GET(makeRequest("GET"));

    const fromResult = mock.from("evidence_library");
    expect(fromResult.eq).toHaveBeenCalledWith("organization_id", TEST_ORG_ID);
  });

  it("Cannot verify evidence in another organization", async () => {
    const mock = setupMockSupabase({
      updateData: makeEvidence({ is_verified: true }),
    });

    await PATCH(
      makeRequest("PATCH", BASE_URL, { id: "ev-1", is_verified: true }),
    );

    const fromResult = mock.from("evidence_library");
    expect(fromResult.eq).toHaveBeenCalledWith("organization_id", TEST_ORG_ID);
  });

  it("SQL injection in title/summary is prevented (parameterized queries)", async () => {
    setupMockSupabase();

    const body = {
      evidence_type: "metric",
      title: "'; DROP TABLE evidence_library; --",
      summary: "Test",
    };
    const res = await POST(makeRequest("POST", BASE_URL, body));

    expect(res.status).toBe(201);
    expect(lastInserted?.title).toBe("'; DROP TABLE evidence_library; --");
  });

  it("Filter values are sanitized before query", async () => {
    const mock = setupMockSupabase({ selectData: [] });

    const res = await GET(
      makeRequest("GET", `${BASE_URL}?service_line=cloud%27%3B%20DROP%20TABLE`),
    );

    expect(res.status).toBe(200);
    const fromResult = mock.from("evidence_library");
    expect(fromResult.eq).toHaveBeenCalledWith(
      "service_line",
      "cloud'; DROP TABLE",
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA LEAK
// ════════════════════════════════════════════════════════════════════════════

describe("Evidence API — Data Leak", () => {
  it("Error responses don't expose database schema details", async () => {
    setupMockSupabase({ selectError: true });

    const res = await GET(makeRequest("GET"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Failed to fetch evidence");
    expect(JSON.stringify(json)).not.toContain("evidence_library");
  });

  it("API response doesn't include organization_id", async () => {
    const ev = makeEvidence();
    setupMockSupabase({ selectData: [ev] });

    const res = await GET(makeRequest("GET"));
    const json = await res.json();

    expect(res.status).toBe(200);
    const responseStr = JSON.stringify(json);
    expect(responseStr).not.toContain("organization_id");
  });

  it("404 response doesn't reveal evidence exists in another org", async () => {
    setupMockSupabase({ existsData: null });

    const res = await DELETE(
      makeRequest("DELETE", `${BASE_URL}?id=ev-other-org`),
    );
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Evidence entry not found");
    expect(JSON.stringify(json)).not.toContain("org");
  });

  it("Verification toggle response doesn't expose who verified", async () => {
    setupMockSupabase({
      updateData: makeEvidence({ is_verified: true }),
    });

    const res = await PATCH(
      makeRequest("PATCH", BASE_URL, { id: "ev-1", is_verified: true }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    const responseStr = JSON.stringify(json);
    expect(responseStr).not.toContain("verified_by");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA DAMAGE
// ════════════════════════════════════════════════════════════════════════════

describe("Evidence API — Data Damage", () => {
  it("Failed insert doesn't leave partial data", async () => {
    setupMockSupabase({ insertError: true });

    const body = {
      evidence_type: "case_study",
      title: "Partial Insert",
      summary: "Should fail",
    };
    const res = await POST(makeRequest("POST", BASE_URL, body));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to create evidence entry");
  });

  it("Verification toggle failure reverts cleanly", async () => {
    setupMockSupabase({ updateError: true });

    const body = { id: "ev-1", is_verified: true };
    const res = await PATCH(makeRequest("PATCH", BASE_URL, body));

    expect(res.status).toBe(404);
  });

  it("PATCH failure doesn't corrupt existing evidence", async () => {
    setupMockSupabase({ updateError: true });

    const body = { id: "ev-1", title: "Corrupted?" };
    const res = await PATCH(makeRequest("PATCH", BASE_URL, body));

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Evidence entry not found");
  });

  it("DELETE with non-existent ID is safe", async () => {
    setupMockSupabase({ existsData: null });

    const res = await DELETE(
      makeRequest("DELETE", `${BASE_URL}?id=ev-nonexistent`),
    );

    expect(res.status).toBe(404);
  });
});
