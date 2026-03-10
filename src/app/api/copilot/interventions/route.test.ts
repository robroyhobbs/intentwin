import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-api", () => ({
  getUserContext: vi.fn(),
}));

const TEST_ORG_ID = "11111111-1111-4111-8111-111111111111";
const BASE_URL = "http://localhost/api/copilot/interventions";

function makeRequest(path = BASE_URL) {
  return new NextRequest(new URL(path), { method: "GET" });
}

function mockContext(role: "admin" | "manager" | "member" = "admin") {
  return {
    user: { id: "user-1", email: "admin@example.com" },
    organizationId: TEST_ORG_ID,
    role,
  };
}

function setupMockSupabase(opts?: {
  data?: unknown[];
  error?: { code?: string; message: string } | null;
  queries?: Array<{
    data?: unknown[] | null;
    error?: { code?: string; message: string } | null;
    count?: number | null;
  }>;
}) {
  if (opts?.queries) {
    const queries = opts.queries.map((query) => {
      const result = {
        data: query.data ?? null,
        error: query.error ?? null,
        count: query.count ?? null,
      };
      const select = vi.fn(() => chain);
      const eq = vi.fn(() => chain);
      const not = vi.fn(() => chain);
      const order = vi.fn(() => chain);
      const limit = vi.fn(() => Promise.resolve(result));
      const chain = {
        select,
        eq,
        not,
        order,
        limit,
        then: Promise.resolve(result).then.bind(Promise.resolve(result)),
      };

      return { chain, select, eq, not, order, limit };
    });

    let queryIndex = 0;
    const from = vi.fn(() => {
      const query = queries[queryIndex];
      queryIndex += 1;
      if (!query) {
        throw new Error("Unexpected query");
      }

      return query.chain;
    });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from });
    return { from, queries };
  }

  const eq = vi.fn(() => chain);
  const order = vi.fn(() => chain);
  const limit = vi.fn(() =>
    Promise.resolve({
      data: opts?.data ?? [],
      error: opts?.error ?? null,
    }),
  );
  const select = vi.fn(() => chain);
  const from = vi.fn(() => chain);
  const chain = {
    select,
    eq,
    order,
    limit,
  };

  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from });

  return { from, select, eq, order, limit };
}

async function loadRoute() {
  return import("./route");
}

describe("GET /api/copilot/interventions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { GET } = await loadRoute();
    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    });
  });

  it("rejects organization members without console access", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockContext("member"),
    );

    const { GET } = await loadRoute();
    const response = await GET(makeRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Only admins and managers can view copilot interventions",
      code: "FORBIDDEN",
    });
  });

  it("returns org-scoped interventions and applies status filters", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockContext("manager"),
    );
    const mockDb = setupMockSupabase({
      data: [
        {
          id: "intervention-1",
          assigned_agent: "reliability-overseer",
          action_mode: "auto",
          status: "open",
          user_safe_title: "Proposal issue detected",
          user_safe_message: "We queued a safe recovery step.",
          internal_reason: "Retryable proposal generation failure",
          proposal_id: "proposal-1",
          opportunity_id: null,
          created_at: "2026-03-09T05:03:07.775Z",
          updated_at: "2026-03-09T05:04:07.775Z",
        },
      ],
    });

    const { GET } = await loadRoute();
    const response = await GET(
      makeRequest(`${BASE_URL}?status=open&limit=10`),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      interventions: [
        {
          id: "intervention-1",
          assignedAgent: "reliability-overseer",
          actionMode: "auto",
          status: "open",
          userSafeTitle: "Proposal issue detected",
          userSafeMessage: "We queued a safe recovery step.",
          internalReason: "Retryable proposal generation failure",
          proposalId: "proposal-1",
          opportunityId: null,
          createdAt: "2026-03-09T05:03:07.775Z",
          updatedAt: "2026-03-09T05:04:07.775Z",
        },
      ],
    });
    expect(mockDb.from).toHaveBeenCalledWith("copilot_interventions");
    expect(mockDb.eq).toHaveBeenNthCalledWith(1, "organization_id", TEST_ORG_ID);
    expect(mockDb.eq).toHaveBeenNthCalledWith(2, "status", "open");
    expect(mockDb.limit).toHaveBeenCalledWith(10);
  });

  it("falls back to proposal failures when copilot tables are unavailable", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockContext("manager"),
    );
    const mockDb = setupMockSupabase({
      queries: [
        {
          error: {
            code: "PGRST205",
            message: "Could not find the table 'public.copilot_interventions' in the schema cache",
          },
        },
        {
          data: [
            {
              id: "proposal-compat-1",
              title: "Apex Federal Capture Plan",
              generation_error: "Timed out while generating sections",
              updated_at: "2026-03-09T09:03:07.775Z",
            },
          ],
        },
        {
          count: 1,
        },
      ],
    });

    const { GET } = await loadRoute();
    const response = await GET(makeRequest(`${BASE_URL}?limit=10`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      interventions: [
        {
          id: "compat-proposal-compat-1",
          assignedAgent: "reliability-overseer",
          actionMode: "automatic",
          status: "open",
          userSafeTitle: "Proposal generation issue detected",
          userSafeMessage:
            "Apex Federal Capture Plan hit a generation issue. Open the proposal to review the latest error and retry failed sections.",
          internalReason: "Timed out while generating sections",
          proposalId: "proposal-compat-1",
          opportunityId: null,
          createdAt: "2026-03-09T09:03:07.775Z",
          updatedAt: "2026-03-09T09:03:07.775Z",
        },
      ],
    });
    expect(mockDb.from).toHaveBeenNthCalledWith(2, "proposals");
    expect(mockDb.from).toHaveBeenNthCalledWith(3, "proposals");
  });
});
