import { vi } from "vitest";
import { NextRequest } from "next/server";
import { createTestContext } from "./test-data";

/**
 * Shared API test helpers for CRUD route tests.
 * Eliminates duplicated mock infrastructure across:
 * - company-truth-api.test.ts
 * - evidence-api.test.ts
 * - compliance-api.test.ts
 * - extract-requirements.test.ts
 * - bulk-import-api.test.ts
 */

/**
 * Create a NextRequest for API route testing
 */
export function makeApiRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    params?: Record<string, string>;
  } = {},
): NextRequest {
  const { method = "GET", body } = options;
  const init: RequestInit = { method };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }

  return new NextRequest(url, init);
}

/**
 * Parse a NextResponse into { status, body }
 */
export async function parseApiResponse(response: Response) {
  const body = await response.json();
  return { status: response.status, body };
}

/**
 * Creates a mock user context for API route tests.
 * Shorthand for tests that need getUserContext to return a valid context.
 */
export function createMockUserContext(overrides?: {
  userId?: string;
  email?: string;
  organizationId?: string;
  role?: "admin" | "manager" | "member";
  teamId?: string;
}) {
  const ctx = createTestContext();
  return {
    user: {
      id: overrides?.userId ?? ctx.user.id,
      email: overrides?.email ?? ctx.user.email,
    },
    organizationId: overrides?.organizationId ?? ctx.organization.id,
    role: overrides?.role ?? "admin",
    teamId: overrides?.teamId,
  };
}

/**
 * Creates a chainable Supabase mock with table-aware data tracking.
 * Replaces the 100+ line setupMockSupabase() functions duplicated across tests.
 *
 * Usage:
 * ```ts
 * const db = createCrudMockDb();
 * db.setTableData("proposals", [{ id: "1", title: "Test" }]);
 *
 * // In your vi.mock:
 * (createAdminClient as any).mockReturnValue({ from: db.from });
 * ```
 */
export function createCrudMockDb() {
  const tableData: Record<string, unknown[]> = {};
  const lastInserted: Record<string, unknown> = {};
  const lastUpdated: Record<string, unknown> = {};
  const lastDeleted: Record<string, unknown> = {};

  function setTableData(table: string, data: unknown[]) {
    tableData[table] = data;
  }

  function resetDb() {
    Object.keys(tableData).forEach((k) => delete tableData[k]);
    Object.keys(lastInserted).forEach((k) => delete lastInserted[k]);
    Object.keys(lastUpdated).forEach((k) => delete lastUpdated[k]);
    Object.keys(lastDeleted).forEach((k) => delete lastDeleted[k]);
  }

  function createChain(table: string) {
    let filterField: string | null = null;
    let filterValue: unknown = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {};

    const methods = [
      "select", "order", "limit", "range", "match",
      "neq", "gt", "gte", "lt", "lte", "in", "is",
      "like", "ilike", "contains", "containedBy", "overlaps",
      "or", "maybeSingle",
    ];
    for (const m of methods) {
      chain[m] = vi.fn(() => chain);
    }

    chain.eq = vi.fn((field: string, value: unknown) => {
      filterField = field;
      filterValue = value;
      return chain;
    });

    chain.single = vi.fn(() => {
      const rows = tableData[table] || [];
      const match = filterField
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? rows.find((r: any) => r[filterField!] === filterValue)
        : rows[0];
      return Promise.resolve({
        data: match || null,
        error: match ? null : { message: "No rows found" },
      });
    });

    chain.insert = vi.fn((data: unknown) => {
      lastInserted[table] = data;
      return chain;
    });

    chain.update = vi.fn((data: unknown) => {
      lastUpdated[table] = data;
      return chain;
    });

    chain.delete = vi.fn(() => {
      lastDeleted[table] = filterValue;
      return chain;
    });

    chain.upsert = vi.fn((data: unknown) => {
      lastInserted[table] = data;
      return chain;
    });

    // Default await behavior
    chain.then = vi.fn(
      (resolve: (v: { data: unknown; error: null }) => unknown) =>
        Promise.resolve(
          resolve({ data: tableData[table] || [], error: null }),
        ),
    );

    return chain;
  }

  const from = vi.fn((table: string) => createChain(table));

  return {
    from,
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    setTableData,
    resetDb,
    getLastInserted: (table: string) => lastInserted[table],
    getLastUpdated: (table: string) => lastUpdated[table],
    getLastDeleted: (table: string) => lastDeleted[table],
  };
}
