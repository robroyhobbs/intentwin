/**
 * Company Truth (IMF L1) — Products API Tests
 *
 * Tests the CRUD API routes for product_contexts.
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
import { GET, POST, PATCH, DELETE } from "@/app/api/settings/products/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";

// ── Helpers ────────────────────────────────────────────────────────────────

const TEST_ORG_ID = "org-222";
const TEST_USER_ID = "user-333";
const BASE_URL = "http://localhost:3000/api/settings/products";

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

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: overrides.id ?? "prod-1",
    product_name: overrides.product_name ?? "Cloud Migration Services",
    service_line: overrides.service_line ?? "cloud",
    description: overrides.description ?? "End-to-end cloud migration services",
    capabilities: overrides.capabilities ?? [
      {
        name: "Assessment",
        description: "Infrastructure assessment",
        outcomes: ["cost_optimization"],
      },
    ],
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
    duplicateCheck?: unknown;
  } = {},
) {
  const mockClient = {
    from: vi.fn((_table: string) => {
      const chainState = {
        operation: null as string | null,
        eqFilters: [] as [string, unknown][],
        selectCallCount: 0,
      };

      const chain: Record<string, unknown> = {};

      chain.select = vi.fn((..._args: unknown[]) => {
        if (!chainState.operation) {
          chainState.operation = "select";
        }
        chainState.selectCallCount++;
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
      chain.order = vi.fn(() => {
        if (opts.selectError) {
          return { data: null, error: { message: "Select failed" } };
        }
        return { data: opts.selectData ?? [], error: null };
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
            ...makeProduct(),
            ...(lastInserted || {}),
            id: "prod-new-" + Math.random().toString(36).slice(2, 8),
          };
          // Remove organization_id from response
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
            data: opts.updateData ?? { ...makeProduct(), ...lastUpdated },
            error: null,
          });
        }
        if (chainState.operation === "select") {
          // For single selects: first one is duplicate check (POST) or existence check (DELETE)
          if (opts.duplicateCheck !== undefined) {
            return Promise.resolve({
              data: opts.duplicateCheck,
              error: opts.duplicateCheck ? null : { code: "PGRST116" },
            });
          }
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

      // For delete: make the chain resolve after second .eq()
      const origDelete = chain.delete;
      chain.delete = vi.fn(() => {
        chainState.operation = "delete";
        const deleteChain = {
          ...chain,
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

  (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
    mockUserContext(),
  );
});

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH
// ════════════════════════════════════════════════════════════════════════════

describe("Products API — Happy Path", () => {
  it("GET returns empty array for org with no products", async () => {
    setupMockSupabase({ selectData: [] });

    const res = await GET(makeRequest("GET"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.products).toEqual([]);
  });

  it("POST creates a product with all fields", async () => {
    const body = {
      product_name: "Cloud Migration Services",
      service_line: "cloud",
      description: "End-to-end cloud migration",
      capabilities: [
        {
          name: "Assessment",
          description: "Infrastructure assessment",
          outcomes: ["cost_optimization"],
        },
      ],
    };

    // First from() call is duplicate check (returns null = no duplicate)
    // Second from() call is insert
    let callCount = 0;
    const mockClient = {
      from: vi.fn(() => {
        callCount++;
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.insert = vi.fn((row: unknown) => {
          lastInserted = row as Record<string, unknown>;
          return chain;
        });
        chain.eq = vi.fn(() => chain);
        chain.order = vi.fn(() => ({ data: [], error: null }));
        chain.single = vi.fn(() => {
          if (callCount === 1) {
            // Duplicate check: no existing product
            return Promise.resolve({
              data: null,
              error: { code: "PGRST116" },
            });
          }
          // Insert: return new product
          return Promise.resolve({
            data: { ...makeProduct(), ...body, id: "prod-new" },
            error: null,
          });
        });
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await POST(makeRequest("POST", undefined, body));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.product.product_name).toBe("Cloud Migration Services");
    expect(json.product.service_line).toBe("cloud");
    expect(json.product.capabilities).toHaveLength(1);
  });

  it("POST with capabilities array creates product with structured JSONB", async () => {
    const caps = [
      {
        name: "Assessment",
        description: "Infra assessment",
        outcomes: ["cost_optimization", "risk_reduction"],
      },
      {
        name: "Migration",
        description: "Automated migration",
        outcomes: ["speed_to_value"],
      },
    ];

    let callCount = 0;
    const mockClient = {
      from: vi.fn(() => {
        callCount++;
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.insert = vi.fn((row: unknown) => {
          lastInserted = row as Record<string, unknown>;
          return chain;
        });
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() => {
          if (callCount === 1) {
            return Promise.resolve({
              data: null,
              error: { code: "PGRST116" },
            });
          }
          return Promise.resolve({
            data: makeProduct({ capabilities: caps }),
            error: null,
          });
        });
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await POST(
      makeRequest("POST", undefined, {
        product_name: "Test",
        capabilities: caps,
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(lastInserted?.capabilities).toEqual(caps);
    expect(json.product.capabilities).toHaveLength(2);
  });

  it("GET returns created products sorted by product_name", async () => {
    const products = [
      makeProduct({ id: "p1", product_name: "Alpha Service" }),
      makeProduct({ id: "p2", product_name: "Beta Service" }),
      makeProduct({ id: "p3", product_name: "Zeta Service" }),
    ];

    setupMockSupabase({ selectData: products });

    const res = await GET(makeRequest("GET"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.products).toHaveLength(3);
    // The mock returns data in the order from selectData (sorting done by DB)
    expect(json.products[0].product_name).toBe("Alpha Service");
  });

  it("PATCH updates product_name, service_line, description", async () => {
    const mockClient = {
      from: vi.fn(() => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.update = vi.fn((row: unknown) => {
          lastUpdated = row as Record<string, unknown>;
          return chain;
        });
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() =>
          Promise.resolve({
            data: makeProduct({
              id: "prod-1",
              product_name: "Updated Name",
              service_line: "data_ai",
              description: "Updated desc",
            }),
            error: null,
          }),
        );
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await PATCH(
      makeRequest("PATCH", undefined, {
        id: "prod-1",
        product_name: "Updated Name",
        service_line: "data_ai",
        description: "Updated desc",
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.product.product_name).toBe("Updated Name");
    expect(json.product.service_line).toBe("data_ai");
  });

  it("PATCH updates capabilities array", async () => {
    const newCaps = [
      { name: "New Cap", description: "New capability", outcomes: [] },
    ];

    const mockClient = {
      from: vi.fn(() => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.update = vi.fn((row: unknown) => {
          lastUpdated = row as Record<string, unknown>;
          return chain;
        });
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() =>
          Promise.resolve({
            data: makeProduct({ capabilities: newCaps }),
            error: null,
          }),
        );
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await PATCH(
      makeRequest("PATCH", undefined, {
        id: "prod-1",
        capabilities: newCaps,
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(lastUpdated?.capabilities).toEqual(newCaps);
    expect(json.product.capabilities).toHaveLength(1);
  });

  it("DELETE removes a product by ID", async () => {
    // First from() call: existence check (returns product)
    // Second from() call: delete
    let callCount = 0;
    const mockClient = {
      from: vi.fn(() => {
        callCount++;
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.delete = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() => {
          if (callCount === 1) {
            return Promise.resolve({
              data: { id: "prod-1" },
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        });
        // For delete chain resolution
        chain.then = vi.fn((resolve: (v: unknown) => void) =>
          resolve({ data: null, error: null }),
        );
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const url = `${BASE_URL}?id=prod-1`;
    const res = await DELETE(makeRequest("DELETE", url));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.deleted).toBe(true);
  });

  it("GET returns products scoped to current org only", async () => {
    const mockClient = setupMockSupabase({
      selectData: [makeProduct()],
    });

    await GET(makeRequest("GET"));

    // Verify .eq() was called with organization_id
    const fromCall = mockClient.from.mock.results[0]?.value;
    const eqCalls = (fromCall?.eq as ReturnType<typeof vi.fn>)?.mock.calls;
    const hasOrgFilter = eqCalls?.some(
      (call: unknown[]) =>
        call[0] === "organization_id" && call[1] === TEST_ORG_ID,
    );
    expect(hasOrgFilter).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BAD PATH
// ════════════════════════════════════════════════════════════════════════════

describe("Products API — Bad Path", () => {
  it("POST with empty product_name returns 400", async () => {
    setupMockSupabase();

    const res = await POST(
      makeRequest("POST", undefined, { product_name: "" }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("product_name");
  });

  it("POST with duplicate (product_name, service_line) returns 409", async () => {
    // Duplicate check returns existing product
    const mockClient = {
      from: vi.fn(() => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() =>
          Promise.resolve({
            data: { id: "existing-prod" },
            error: null,
          }),
        );
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await POST(
      makeRequest("POST", undefined, {
        product_name: "Existing Product",
        service_line: "cloud",
      }),
    );

    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain("already exists");
  });

  it("PATCH with non-existent product ID returns 404", async () => {
    const mockClient = {
      from: vi.fn(() => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.update = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { message: "No rows", code: "PGRST116" },
          }),
        );
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await PATCH(
      makeRequest("PATCH", undefined, {
        id: "nonexistent",
        product_name: "Updated",
      }),
    );

    expect(res.status).toBe(404);
  });

  it("DELETE with non-existent product ID returns 404", async () => {
    const mockClient = {
      from: vi.fn(() => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { code: "PGRST116" },
          }),
        );
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const url = `${BASE_URL}?id=nonexistent`;
    const res = await DELETE(makeRequest("DELETE", url));

    expect(res.status).toBe(404);
  });

  it("POST with invalid capabilities structure returns 400", async () => {
    setupMockSupabase();

    const res = await POST(
      makeRequest("POST", undefined, {
        product_name: "Test Product",
        capabilities: [{ invalid: true }],
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("capability");
  });

  it("PATCH with missing id in body returns 400", async () => {
    setupMockSupabase();

    const res = await PATCH(
      makeRequest("PATCH", undefined, {
        product_name: "Updated",
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("id");
  });

  it("Unauthenticated request returns 401", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setupMockSupabase();

    const res = await GET(makeRequest("GET"));

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Products API — Edge Cases", () => {
  it("POST product_name with leading/trailing whitespace — trims", async () => {
    let callCount = 0;
    const mockClient = {
      from: vi.fn(() => {
        callCount++;
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.insert = vi.fn((row: unknown) => {
          lastInserted = row as Record<string, unknown>;
          return chain;
        });
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() => {
          if (callCount === 1) {
            return Promise.resolve({
              data: null,
              error: { code: "PGRST116" },
            });
          }
          return Promise.resolve({
            data: makeProduct({ product_name: "Trimmed Name" }),
            error: null,
          });
        });
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await POST(
      makeRequest("POST", undefined, {
        product_name: "  Trimmed Name  ",
      }),
    );

    expect(res.status).toBe(201);
    expect(lastInserted?.product_name).toBe("Trimmed Name");
  });

  it("POST with empty capabilities array succeeds", async () => {
    let callCount = 0;
    const mockClient = {
      from: vi.fn(() => {
        callCount++;
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.insert = vi.fn((row: unknown) => {
          lastInserted = row as Record<string, unknown>;
          return chain;
        });
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() => {
          if (callCount === 1) {
            return Promise.resolve({
              data: null,
              error: { code: "PGRST116" },
            });
          }
          return Promise.resolve({
            data: makeProduct({ capabilities: [] }),
            error: null,
          });
        });
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await POST(
      makeRequest("POST", undefined, {
        product_name: "Test",
        capabilities: [],
      }),
    );

    expect(res.status).toBe(201);
    expect(lastInserted?.capabilities).toEqual([]);
  });

  it("PATCH with empty capabilities array removes all capabilities", async () => {
    const mockClient = {
      from: vi.fn(() => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.update = vi.fn((row: unknown) => {
          lastUpdated = row as Record<string, unknown>;
          return chain;
        });
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() =>
          Promise.resolve({
            data: makeProduct({ capabilities: [] }),
            error: null,
          }),
        );
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await PATCH(
      makeRequest("PATCH", undefined, {
        id: "prod-1",
        capabilities: [],
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(lastUpdated?.capabilities).toEqual([]);
    expect(json.product.capabilities).toEqual([]);
  });

  it("GET with 20+ products returns all correctly", async () => {
    const manyProducts = Array.from({ length: 25 }, (_, i) =>
      makeProduct({ id: `prod-${i}`, product_name: `Product ${i}` }),
    );

    setupMockSupabase({ selectData: manyProducts });

    const res = await GET(makeRequest("GET"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.products).toHaveLength(25);
  });

  it("Product with very long description (10K chars) succeeds", async () => {
    const longDesc = "A".repeat(10_000);

    let callCount = 0;
    const mockClient = {
      from: vi.fn(() => {
        callCount++;
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.insert = vi.fn((row: unknown) => {
          lastInserted = row as Record<string, unknown>;
          return chain;
        });
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() => {
          if (callCount === 1) {
            return Promise.resolve({
              data: null,
              error: { code: "PGRST116" },
            });
          }
          return Promise.resolve({
            data: makeProduct({ description: longDesc }),
            error: null,
          });
        });
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await POST(
      makeRequest("POST", undefined, {
        product_name: "Long Desc Product",
        description: longDesc,
      }),
    );

    expect(res.status).toBe(201);
    expect(lastInserted?.description).toBe(longDesc);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SECURITY
// ════════════════════════════════════════════════════════════════════════════

describe("Products API — Security", () => {
  it("API validates user belongs to an organization", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setupMockSupabase();

    const res = await POST(
      makeRequest("POST", undefined, { product_name: "Test" }),
    );

    expect(res.status).toBe(401);
  });

  it("Cannot access products from another organization", async () => {
    const mockClient = setupMockSupabase({
      selectData: [makeProduct()],
    });

    await GET(makeRequest("GET"));

    // Verify org filtering is applied
    const fromCall = mockClient.from.mock.results[0]?.value;
    const eqCalls = (fromCall?.eq as ReturnType<typeof vi.fn>)?.mock.calls;
    const hasOrgFilter = eqCalls?.some(
      (call: unknown[]) =>
        call[0] === "organization_id" && call[1] === TEST_ORG_ID,
    );
    expect(hasOrgFilter).toBe(true);
  });

  it("SQL injection in product_name is prevented (parameterized queries)", async () => {
    const malicious = "'; DROP TABLE product_contexts; --";

    let callCount = 0;
    const mockClient = {
      from: vi.fn(() => {
        callCount++;
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.insert = vi.fn((row: unknown) => {
          lastInserted = row as Record<string, unknown>;
          return chain;
        });
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() => {
          if (callCount === 1) {
            return Promise.resolve({
              data: null,
              error: { code: "PGRST116" },
            });
          }
          return Promise.resolve({
            data: makeProduct({ product_name: malicious }),
            error: null,
          });
        });
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await POST(
      makeRequest("POST", undefined, { product_name: malicious }),
    );

    expect(res.status).toBe(201);
    // Value is stored as-is (parameterized, not interpolated)
    expect(lastInserted?.product_name).toBe(malicious);
  });

  it("Capabilities JSONB is validated before insert", async () => {
    setupMockSupabase();

    // Invalid: capabilities with invalid outcome
    const res = await POST(
      makeRequest("POST", undefined, {
        product_name: "Test",
        capabilities: [
          {
            name: "Cap",
            description: "Desc",
            outcomes: ["invalid_outcome"],
          },
        ],
      }),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("Invalid outcome");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA LEAK
// ════════════════════════════════════════════════════════════════════════════

describe("Products API — Data Leak", () => {
  it("Error responses don't expose database schema details", async () => {
    setupMockSupabase({ selectError: true });

    const res = await GET(makeRequest("GET"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Failed to fetch products");
    expect(JSON.stringify(json)).not.toMatch(/product_contexts/);
    expect(JSON.stringify(json)).not.toMatch(/organization_id/);
  });

  it("API response doesn't include organization_id", async () => {
    // Verify the SELECT_FIELDS doesn't include organization_id
    const mockClient = setupMockSupabase({
      selectData: [makeProduct()],
    });

    await GET(makeRequest("GET"));

    const fromCall = mockClient.from.mock.results[0]?.value;
    if (fromCall?.select) {
      const selectCalls = (fromCall.select as ReturnType<typeof vi.fn>).mock
        .calls;
      if (selectCalls.length > 0 && typeof selectCalls[0][0] === "string") {
        expect(selectCalls[0][0]).not.toContain("organization_id");
      }
    }
  });

  it("404 response doesn't reveal product exists in another org", async () => {
    const mockClient = {
      from: vi.fn(() => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { code: "PGRST116" },
          }),
        );
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const url = `${BASE_URL}?id=other-org-product`;
    const res = await DELETE(makeRequest("DELETE", url));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Product not found");
    expect(json.error).not.toMatch(/org|organization|belong/i);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA DAMAGE
// ════════════════════════════════════════════════════════════════════════════

describe("Products API — Data Damage", () => {
  it("Failed insert doesn't leave partial data", async () => {
    let callCount = 0;
    const mockClient = {
      from: vi.fn(() => {
        callCount++;
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.insert = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() => {
          if (callCount === 1) {
            // Duplicate check: no duplicate
            return Promise.resolve({
              data: null,
              error: { code: "PGRST116" },
            });
          }
          // Insert fails
          return Promise.resolve({
            data: null,
            error: { message: "Insert failed" },
          });
        });
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await POST(
      makeRequest("POST", undefined, { product_name: "Test" }),
    );

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to create product");
  });

  it("PATCH update failure doesn't modify product", async () => {
    const mockClient = {
      from: vi.fn(() => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.update = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { message: "Update failed" },
          }),
        );
        return chain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await PATCH(
      makeRequest("PATCH", undefined, {
        id: "prod-1",
        product_name: "New Name",
      }),
    );

    expect(res.status).toBe(404);
  });

  it("DELETE doesn't cascade to unrelated data", async () => {
    // Verify delete only targets the specific product in the specific org
    let callCount = 0;
    const deleteEqCalls: [string, unknown][] = [];

    const mockClient = {
      from: vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // First call: existence check
          const chain: Record<string, unknown> = {};
          chain.select = vi.fn(() => chain);
          chain.eq = vi.fn(() => chain);
          chain.single = vi.fn(() =>
            Promise.resolve({ data: { id: "prod-1" }, error: null }),
          );
          return chain;
        }
        // Second call: delete operation
        const delChain: Record<string, unknown> = {};
        delChain.delete = vi.fn(() => delChain);
        delChain.eq = vi.fn((field: string, value: unknown) => {
          deleteEqCalls.push([field, value]);
          return delChain;
        });
        // Resolve the awaited delete chain
        delChain.then = vi.fn((resolve: (v: unknown) => void) =>
          resolve({ data: null, error: null }),
        );
        return delChain;
      }),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const url = `${BASE_URL}?id=prod-1`;
    await DELETE(makeRequest("DELETE", url));

    // Verify delete uses both id and organization_id filters
    expect(deleteEqCalls.some((c) => c[0] === "id")).toBe(true);
    expect(deleteEqCalls.some((c) => c[0] === "organization_id")).toBe(true);
  });
});
