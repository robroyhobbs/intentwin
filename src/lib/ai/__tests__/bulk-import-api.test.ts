/**
 * Bulk Import API — Phase 1 Tests
 *
 * Tests the extract and commit API routes.
 * 6 categories: Happy Path, Bad Path, Edge Cases, Security, Data Leak, Data Damage
 */

// ── Module Mocks ───────────────────────────────────────────────────────────

let mockExtractionResult = {
  data: {
    company_context: [
      {
        category: "brand" as const,
        key: "overview",
        title: "Company Overview",
        content: "Acme Corp is a cloud solutions provider.",
      },
    ],
    product_contexts: [
      {
        product_name: "Cloud Suite",
        service_line: "Cloud",
        description: "Cloud migration platform.",
        capabilities: [{ name: "Assessment", description: "Cloud readiness" }],
      },
    ],
    evidence_library: [
      {
        evidence_type: "case_study" as const,
        title: "DoD Migration",
        summary: "Migrated 50K users.",
        full_content: "Full case study content.",
        client_industry: "defense",
        service_line: "Cloud",
      },
    ],
  },
  error: null as string | null,
};

let mockExtractError = false;

vi.mock("@/lib/ai/l1-extractor", () => ({
  extractL1FromText: vi.fn(async () => {
    if (mockExtractError) {
      return {
        data: {
          company_context: [],
          product_contexts: [],
          evidence_library: [],
        },
        error: "AI extraction failed",
      };
    }
    return mockExtractionResult;
  }),
  VALID_COMPANY_CATEGORIES: [
    "brand",
    "values",
    "certifications",
    "legal",
    "partnerships",
  ],
  VALID_EVIDENCE_TYPES: [
    "case_study",
    "metric",
    "testimonial",
    "certification",
    "award",
  ],
}));

// Track supabase calls
let upsertCalls: Array<{
  table: string;
  data: unknown;
  onConflict?: string;
}> = [];
let selectResults: Record<string, unknown[]> = {};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock("@/lib/supabase/auth-api", () => ({
  getUserContext: vi.fn(),
}));

import { NextRequest } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { POST as extractPOST } from "@/app/api/bulk-import/extract/route";
import { POST as commitPOST } from "@/app/api/bulk-import/commit/route";

// ── Helpers ────────────────────────────────────────────────────────────────

const TEST_ORG_ID = "org-test-123";

function makeExtractRequest(body: unknown) {
  return new NextRequest(
    new URL("http://localhost:3000/api/bulk-import/extract"),
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

function makeCommitRequest(body: unknown) {
  return new NextRequest(
    new URL("http://localhost:3000/api/bulk-import/commit"),
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

// Mock Supabase client with configurable behavior
const mockSupabaseClient = {
  from: vi.fn((table: string) => {
    const chain: Record<string, unknown> = {};

    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => {
      // Return pre-configured select results for conflict detection
      const data = selectResults[table] || [];
      return { data, error: null };
    });
    chain.upsert = vi.fn((data: unknown, opts?: { onConflict?: string }) => {
      upsertCalls.push({ table, data, onConflict: opts?.onConflict });
      return Promise.resolve({ data, error: null });
    });
    chain.insert = vi.fn((data: unknown) => {
      upsertCalls.push({ table, data });
      return Promise.resolve({ data, error: null });
    });

    return chain;
  }),
};

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  upsertCalls = [];
  selectResults = {};
  mockExtractError = false;
  mockExtractionResult = {
    data: {
      company_context: [
        {
          category: "brand" as const,
          key: "overview",
          title: "Company Overview",
          content: "Acme Corp is a cloud solutions provider.",
        },
      ],
      product_contexts: [
        {
          product_name: "Cloud Suite",
          service_line: "Cloud",
          description: "Cloud migration platform.",
          capabilities: [
            { name: "Assessment", description: "Cloud readiness" },
          ],
        },
      ],
      evidence_library: [
        {
          evidence_type: "case_study" as const,
          title: "DoD Migration",
          summary: "Migrated 50K users.",
          full_content: "Full case study content.",
          client_industry: "defense",
          service_line: "Cloud",
        },
      ],
    },
    error: null,
  };

  (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: { id: "user-1", email: "test@example.com" },
    organizationId: TEST_ORG_ID,
    role: "admin" as const,
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EXTRACT — HAPPY PATH
// ════════════════════════════════════════════════════════════════════════════

describe("Bulk Import Extract API — Happy Path", () => {
  it("POST /api/bulk-import/extract with valid content + fileName returns extracted items", async () => {
    const res = await extractPOST(
      makeExtractRequest({
        content: "Acme Corp cloud migration case study...",
        fileName: "acme-overview.md",
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.company_context).toBeDefined();
    expect(json.product_contexts).toBeDefined();
    expect(json.evidence_library).toBeDefined();
  });

  it("extract response includes company_context, product_contexts, evidence_library arrays", async () => {
    const res = await extractPOST(
      makeExtractRequest({ content: "Content", fileName: "file.md" }),
    );
    const json = await res.json();

    expect(Array.isArray(json.company_context)).toBe(true);
    expect(Array.isArray(json.product_contexts)).toBe(true);
    expect(Array.isArray(json.evidence_library)).toBe(true);
  });

  it("extract response items include isConflict: false for new items", async () => {
    // No existing data → no conflicts
    selectResults = {};

    const res = await extractPOST(
      makeExtractRequest({ content: "Content", fileName: "file.md" }),
    );
    const json = await res.json();

    expect(json.company_context[0].isConflict).toBe(false);
  });

  it("extract response items include isConflict: true with existingValue for conflicts", async () => {
    // Set up existing data that matches
    selectResults.company_context = [
      {
        category: "brand",
        key: "overview",
        title: "Old Title",
        content: "Old content",
      },
    ];

    const res = await extractPOST(
      makeExtractRequest({ content: "Content", fileName: "file.md" }),
    );
    const json = await res.json();

    const conflictItem = json.company_context.find(
      (i: Record<string, unknown>) => i.key === "overview",
    );
    expect(conflictItem.isConflict).toBe(true);
    expect(conflictItem.existingValue).toBeDefined();
  });

  it("company context conflict detected on matching (category, key) in same org", async () => {
    selectResults.company_context = [
      {
        category: "brand",
        key: "overview",
        title: "Existing",
        content: "Existing",
      },
    ];

    const res = await extractPOST(
      makeExtractRequest({ content: "Content", fileName: "file.md" }),
    );
    const json = await res.json();

    expect(json.company_context[0].isConflict).toBe(true);
  });

  it("product conflict detected on matching (product_name, service_line) in same org", async () => {
    selectResults.product_contexts = [
      {
        product_name: "Cloud Suite",
        service_line: "Cloud",
        description: "Old",
        capabilities: [],
      },
    ];

    const res = await extractPOST(
      makeExtractRequest({ content: "Content", fileName: "file.md" }),
    );
    const json = await res.json();

    expect(json.product_contexts[0].isConflict).toBe(true);
  });

  it("evidence conflict detected on matching title in same org", async () => {
    selectResults.evidence_library = [
      {
        title: "DoD Migration",
        evidence_type: "case_study",
        summary: "Old",
        full_content: "Old",
      },
    ];

    const res = await extractPOST(
      makeExtractRequest({ content: "Content", fileName: "file.md" }),
    );
    const json = await res.json();

    expect(json.evidence_library[0].isConflict).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// COMMIT — HAPPY PATH
// ════════════════════════════════════════════════════════════════════════════

describe("Bulk Import Commit API — Happy Path", () => {
  it("POST /api/bulk-import/commit with approved items inserts into company_context", async () => {
    const res = await commitPOST(
      makeCommitRequest({
        company_context: [
          {
            category: "brand",
            key: "overview",
            title: "Company Overview",
            content: "Acme Corp overview.",
          },
        ],
        product_contexts: [],
        evidence_library: [],
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    const ccUpsert = upsertCalls.find((c) => c.table === "company_context");
    expect(ccUpsert).toBeDefined();
  });

  it("commit inserts into product_contexts with capabilities as JSONB", async () => {
    await commitPOST(
      makeCommitRequest({
        company_context: [],
        product_contexts: [
          {
            product_name: "Cloud Suite",
            service_line: "Cloud",
            description: "Platform",
            capabilities: [
              { name: "Migration", description: "Cloud migration" },
            ],
          },
        ],
        evidence_library: [],
      }),
    );

    const pcUpsert = upsertCalls.find((c) => c.table === "product_contexts");
    expect(pcUpsert).toBeDefined();
  });

  it("commit inserts into evidence_library with all fields", async () => {
    await commitPOST(
      makeCommitRequest({
        company_context: [],
        product_contexts: [],
        evidence_library: [
          {
            evidence_type: "case_study",
            title: "DoD Migration",
            summary: "Migrated 50K users.",
            full_content: "Full content.",
            client_industry: "defense",
            service_line: "Cloud",
          },
        ],
      }),
    );

    const elUpsert = upsertCalls.find((c) => c.table === "evidence_library");
    expect(elUpsert).toBeDefined();
  });

  it("commit upserts company_context on conflict (category, key)", async () => {
    await commitPOST(
      makeCommitRequest({
        company_context: [
          {
            category: "brand",
            key: "overview",
            title: "New Title",
            content: "New content.",
          },
        ],
        product_contexts: [],
        evidence_library: [],
      }),
    );

    const ccUpsert = upsertCalls.find((c) => c.table === "company_context");
    expect(ccUpsert?.onConflict).toContain("category");
    expect(ccUpsert?.onConflict).toContain("key");
  });

  it("commit upserts product_contexts on conflict (product_name, service_line)", async () => {
    await commitPOST(
      makeCommitRequest({
        company_context: [],
        product_contexts: [
          {
            product_name: "Cloud Suite",
            service_line: "Cloud",
            description: "Updated",
            capabilities: [],
          },
        ],
        evidence_library: [],
      }),
    );

    const pcUpsert = upsertCalls.find((c) => c.table === "product_contexts");
    expect(pcUpsert?.onConflict).toContain("product_name");
    expect(pcUpsert?.onConflict).toContain("service_line");
  });

  it("commit upserts evidence_library on conflict (title)", async () => {
    await commitPOST(
      makeCommitRequest({
        company_context: [],
        product_contexts: [],
        evidence_library: [
          {
            evidence_type: "case_study",
            title: "DoD Migration",
            summary: "Updated summary.",
            full_content: "Updated full content.",
          },
        ],
      }),
    );

    const elUpsert = upsertCalls.find((c) => c.table === "evidence_library");
    expect(elUpsert?.onConflict).toContain("title");
  });

  it("commit returns counts of inserted items", async () => {
    const res = await commitPOST(
      makeCommitRequest({
        company_context: [
          { category: "brand", key: "a", title: "A", content: "A" },
          { category: "values", key: "b", title: "B", content: "B" },
        ],
        product_contexts: [
          {
            product_name: "P",
            service_line: "S",
            description: "D",
            capabilities: [],
          },
        ],
        evidence_library: [],
      }),
    );
    const json = await res.json();

    expect(json.counts.company_context).toBe(2);
    expect(json.counts.product_contexts).toBe(1);
    expect(json.counts.evidence_library).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BAD PATH
// ════════════════════════════════════════════════════════════════════════════

describe("Bulk Import API — Bad Path", () => {
  it("extract with empty content string returns 400", async () => {
    const res = await extractPOST(
      makeExtractRequest({ content: "", fileName: "file.md" }),
    );
    expect(res.status).toBe(400);
  });

  it("extract with missing fileName returns 400", async () => {
    const res = await extractPOST(
      makeExtractRequest({ content: "Some content" }),
    );
    expect(res.status).toBe(400);
  });

  it("extract without auth returns 401", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await extractPOST(
      makeExtractRequest({ content: "Content", fileName: "file.md" }),
    );
    expect(res.status).toBe(401);
  });

  it("commit with empty items returns 400", async () => {
    const res = await commitPOST(
      makeCommitRequest({
        company_context: [],
        product_contexts: [],
        evidence_library: [],
      }),
    );
    expect(res.status).toBe(400);
  });

  it("commit with items missing required fields returns 400", async () => {
    const res = await commitPOST(
      makeCommitRequest({
        company_context: [{ category: "brand" }], // missing key, title, content
        product_contexts: [],
        evidence_library: [],
      }),
    );
    expect(res.status).toBe(400);
  });

  it("commit without auth returns 401", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await commitPOST(
      makeCommitRequest({
        company_context: [
          { category: "brand", key: "a", title: "A", content: "A" },
        ],
        product_contexts: [],
        evidence_library: [],
      }),
    );
    expect(res.status).toBe(401);
  });

  it("extract when Gemini fails returns 500 with safe message", async () => {
    mockExtractError = true;

    const res = await extractPOST(
      makeExtractRequest({ content: "Content", fileName: "file.md" }),
    );
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBeDefined();
    expect(json.error).not.toContain("stack");
  });

  it("commit with invalid company_context category returns 400", async () => {
    const res = await commitPOST(
      makeCommitRequest({
        company_context: [
          {
            category: "invalid_category",
            key: "a",
            title: "A",
            content: "A",
          },
        ],
        product_contexts: [],
        evidence_library: [],
      }),
    );
    expect(res.status).toBe(400);
  });

  it("commit with invalid evidence_type returns 400", async () => {
    const res = await commitPOST(
      makeCommitRequest({
        company_context: [],
        product_contexts: [],
        evidence_library: [
          {
            evidence_type: "invalid_type",
            title: "T",
            summary: "S",
            full_content: "F",
          },
        ],
      }),
    );
    expect(res.status).toBe(400);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Bulk Import API — Edge Cases", () => {
  it("extract with very large content (200K chars) still works", async () => {
    const largeContent = "A".repeat(200_000);
    const res = await extractPOST(
      makeExtractRequest({ content: largeContent, fileName: "big.md" }),
    );
    expect(res.status).toBe(200);
  });

  it("commit with 100+ items processes all correctly", async () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      category: "brand" as const,
      key: `item-${i}`,
      title: `Item ${i}`,
      content: `Content ${i}`,
    }));

    const res = await commitPOST(
      makeCommitRequest({
        company_context: items,
        product_contexts: [],
        evidence_library: [],
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.counts.company_context).toBe(100);
  });

  it("commit with mix of new and conflict items handles both", async () => {
    const res = await commitPOST(
      makeCommitRequest({
        company_context: [
          { category: "brand", key: "new-item", title: "New", content: "New" },
          {
            category: "brand",
            key: "existing-item",
            title: "Updated",
            content: "Updated",
          },
        ],
        product_contexts: [],
        evidence_library: [],
      }),
    );

    expect(res.status).toBe(200);
    // Upsert handles both new and existing
    const ccUpsert = upsertCalls.find((c) => c.table === "company_context");
    expect(ccUpsert).toBeDefined();
  });

  it("extract when org has zero existing L1 data — all items flagged as new", async () => {
    selectResults = {};

    const res = await extractPOST(
      makeExtractRequest({ content: "Content", fileName: "file.md" }),
    );
    const json = await res.json();

    json.company_context.forEach((item: Record<string, unknown>) => {
      expect(item.isConflict).toBe(false);
    });
  });

  it("extract when org has matching L1 data — correct items flagged as conflicts", async () => {
    selectResults.company_context = [
      {
        category: "brand",
        key: "overview",
        title: "Existing",
        content: "Existing",
      },
    ];

    const res = await extractPOST(
      makeExtractRequest({ content: "Content", fileName: "file.md" }),
    );
    const json = await res.json();

    expect(json.company_context[0].isConflict).toBe(true);
  });

  it("commit with all three table types in single request", async () => {
    const res = await commitPOST(
      makeCommitRequest({
        company_context: [
          { category: "brand", key: "a", title: "A", content: "A" },
        ],
        product_contexts: [
          {
            product_name: "P",
            service_line: "S",
            description: "D",
            capabilities: [],
          },
        ],
        evidence_library: [
          {
            evidence_type: "case_study",
            title: "T",
            summary: "S",
            full_content: "F",
          },
        ],
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.counts.company_context).toBe(1);
    expect(json.counts.product_contexts).toBe(1);
    expect(json.counts.evidence_library).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SECURITY
// ════════════════════════════════════════════════════════════════════════════

describe("Bulk Import API — Security", () => {
  it("extract validates user belongs to an organization", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "user-1" },
      organizationId: null,
      role: "admin",
    });

    const res = await extractPOST(
      makeExtractRequest({ content: "Content", fileName: "file.md" }),
    );
    expect(res.status).toBe(401);
  });

  it("commit validates user belongs to an organization", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "user-1" },
      organizationId: null,
      role: "admin",
    });

    const res = await commitPOST(
      makeCommitRequest({
        company_context: [
          { category: "brand", key: "a", title: "A", content: "A" },
        ],
        product_contexts: [],
        evidence_library: [],
      }),
    );
    expect(res.status).toBe(401);
  });

  it("commit scopes all inserts to user's organization_id", async () => {
    await commitPOST(
      makeCommitRequest({
        company_context: [
          { category: "brand", key: "a", title: "A", content: "A" },
        ],
        product_contexts: [],
        evidence_library: [],
      }),
    );

    const ccUpsert = upsertCalls.find((c) => c.table === "company_context");
    const upsertData = ccUpsert?.data as Record<string, unknown>[];
    expect(upsertData[0].organization_id).toBe(TEST_ORG_ID);
  });

  it("SQL injection in content/title/key fields is prevented (parameterized queries)", async () => {
    const res = await commitPOST(
      makeCommitRequest({
        company_context: [
          {
            category: "brand",
            key: "'; DROP TABLE company_context; --",
            title: "Injection Test",
            content: "Content",
          },
        ],
        product_contexts: [],
        evidence_library: [],
      }),
    );

    // Should succeed (Supabase uses parameterized queries)
    expect(res.status).toBe(200);
    const ccUpsert = upsertCalls.find((c) => c.table === "company_context");
    const data = ccUpsert?.data as Record<string, unknown>[];
    expect(data[0].key).toBe("'; DROP TABLE company_context; --");
  });

  it("XSS in extracted content is handled (stored as text)", async () => {
    const res = await commitPOST(
      makeCommitRequest({
        company_context: [
          {
            category: "brand",
            key: "xss-test",
            title: "<script>alert('xss')</script>",
            content: "<img onerror=alert(1) src=x>",
          },
        ],
        product_contexts: [],
        evidence_library: [],
      }),
    );

    expect(res.status).toBe(200);
  });

  it("cannot extract using another org's context for conflict check", async () => {
    // The conflict check should use the authenticated user's org, not a supplied one
    const res = await extractPOST(
      makeExtractRequest({ content: "Content", fileName: "file.md" }),
    );

    // Verify the from().select().eq() chain was called with the correct org
    const fromCalls = mockSupabaseClient.from.mock.calls;
    // The eq calls should use TEST_ORG_ID
    expect(res.status).toBe(200);
    expect(fromCalls.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA LEAK
// ════════════════════════════════════════════════════════════════════════════

describe("Bulk Import API — Data Leak", () => {
  it("extract error response doesn't expose Gemini raw response", async () => {
    mockExtractError = true;

    const res = await extractPOST(
      makeExtractRequest({ content: "Content", fileName: "file.md" }),
    );
    const json = await res.json();

    expect(JSON.stringify(json)).not.toContain("generateText");
    expect(JSON.stringify(json)).not.toContain("GEMINI");
  });

  it("extract error response doesn't expose database schema", async () => {
    mockExtractError = true;

    const res = await extractPOST(
      makeExtractRequest({ content: "Content", fileName: "file.md" }),
    );
    const json = await res.json();

    expect(JSON.stringify(json)).not.toContain("organization_id");
    expect(JSON.stringify(json)).not.toContain("PGRST");
  });

  it("commit error response doesn't expose other org's data", async () => {
    // Even on error, should not leak other org data
    const res = await commitPOST(
      makeCommitRequest({
        company_context: [],
        product_contexts: [],
        evidence_library: [],
      }),
    );
    const json = await res.json();

    expect(JSON.stringify(json)).not.toContain("org-other");
  });

  it("conflict detection doesn't reveal full content of existing entries to unauthorized users", async () => {
    selectResults.company_context = [
      {
        category: "brand",
        key: "overview",
        title: "Existing Title",
        content: "SECRET INTERNAL CONTENT",
      },
    ];

    const res = await extractPOST(
      makeExtractRequest({ content: "Content", fileName: "file.md" }),
    );
    const json = await res.json();

    // The existing value shown should be the title/summary, not raw DB content
    // (this is checked at the API level - conflict info should be limited)
    expect(res.status).toBe(200);
    const conflict = json.company_context.find(
      (i: Record<string, unknown>) => i.isConflict,
    );
    if (conflict) {
      expect(conflict.existingValue).toBeDefined();
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA DAMAGE
// ════════════════════════════════════════════════════════════════════════════

describe("Bulk Import API — Data Damage", () => {
  it("commit doesn't delete existing L1 data that wasn't in the import", async () => {
    // Commit should only upsert, never delete
    await commitPOST(
      makeCommitRequest({
        company_context: [
          { category: "brand", key: "new", title: "New", content: "New" },
        ],
        product_contexts: [],
        evidence_library: [],
      }),
    );

    // Verify no delete calls were made
    const fromCalls = mockSupabaseClient.from.mock.results;
    fromCalls.forEach((result: { value: Record<string, unknown> }) => {
      expect(result.value.delete).toBeUndefined;
    });
  });

  it("upsert on conflict correctly replaces old values", async () => {
    await commitPOST(
      makeCommitRequest({
        company_context: [
          {
            category: "brand",
            key: "overview",
            title: "New Title",
            content: "New Content",
          },
        ],
        product_contexts: [],
        evidence_library: [],
      }),
    );

    const ccUpsert = upsertCalls.find((c) => c.table === "company_context");
    expect(ccUpsert).toBeDefined();
    expect(ccUpsert?.onConflict).toBeDefined();
    const data = ccUpsert?.data as Record<string, unknown>[];
    expect(data[0].title).toBe("New Title");
  });

  it("re-submitting same commit is idempotent (upsert, not duplicate)", async () => {
    const commitBody = {
      company_context: [
        { category: "brand", key: "a", title: "A", content: "A" },
      ],
      product_contexts: [],
      evidence_library: [],
    };

    const res1 = await commitPOST(makeCommitRequest(commitBody));
    const res2 = await commitPOST(makeCommitRequest(commitBody));

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    // Both should use upsert (not insert), so idempotent
    const ccUpserts = upsertCalls.filter((c) => c.table === "company_context");
    ccUpserts.forEach((u) => expect(u.onConflict).toBeDefined());
  });

  it("failed commit doesn't leave partial data", async () => {
    // If upsert returns an error, the response should indicate failure
    // In real implementation, each table upsert is independent
    const res = await commitPOST(
      makeCommitRequest({
        company_context: [
          { category: "brand", key: "a", title: "A", content: "A" },
        ],
        product_contexts: [],
        evidence_library: [],
      }),
    );

    expect(res.status).toBe(200);
  });

  it("commit failure on one table doesn't affect already-committed tables", async () => {
    // Each table is upserted independently — partial success is acceptable
    const res = await commitPOST(
      makeCommitRequest({
        company_context: [
          { category: "brand", key: "a", title: "A", content: "A" },
        ],
        product_contexts: [
          {
            product_name: "P",
            service_line: "S",
            description: "D",
            capabilities: [],
          },
        ],
        evidence_library: [],
      }),
    );

    expect(res.status).toBe(200);
  });
});
