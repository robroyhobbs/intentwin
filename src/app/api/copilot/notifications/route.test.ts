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
const BASE_URL = "http://localhost/api/copilot/notifications";

function makeRequest(path = BASE_URL) {
  return new NextRequest(new URL(path), { method: "GET" });
}

function mockContext(role: "admin" | "manager" | "member" = "member") {
  return {
    user: { id: "user-1", email: "user@example.com" },
    organizationId: TEST_ORG_ID,
    role,
  };
}

function setupMockSupabase(opts?: {
  queries: Array<{
    data?: unknown[] | null;
    error?: { code?: string; message: string } | null;
    count?: number | null;
  }>;
}) {
  const queries = opts?.queries.map((query) => {
    const result = {
      data: query.data ?? null,
      error: query.error ?? null,
      count: query.count ?? null,
    };
    const select = vi.fn(() => chain);
    const eq = vi.fn(() => chain);
    const inFilter = vi.fn(() => chain);
    const not = vi.fn(() => chain);
    const order = vi.fn(() => chain);
    const limit = vi.fn(() => Promise.resolve(result));
    const chain = {
      select,
      eq,
      in: inFilter,
      not,
      order,
      limit,
      then: Promise.resolve(result).then.bind(Promise.resolve(result)),
    };

    return { chain, select, eq, inFilter, not, order, limit };
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

async function loadRoute() {
  return import("./route");
}

describe("GET /api/copilot/notifications", () => {
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

  it("rejects invalid status filters", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockContext("member"),
    );

    const { GET } = await loadRoute();
    const response = await GET(makeRequest(`${BASE_URL}?status=bad-status`));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid notification status filter",
      code: "BAD_REQUEST",
    });
  });

  it("returns org-scoped active notifications for any authenticated member", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockContext("member"),
    );
    const mockDb = setupMockSupabase({
      queries: [
        {
          data: [
            {
              id: "intervention-1",
              assigned_agent: "reliability-overseer",
              action_mode: "automatic",
              status: "open",
              user_safe_title: "Proposal issue detected",
              user_safe_message: "We queued a safe recovery step.",
              proposal_id: "proposal-1",
              opportunity_id: null,
              created_at: "2026-03-09T05:03:07.775Z",
            },
            {
              id: "intervention-2",
              assigned_agent: "compliance-guardian",
              action_mode: "approval_required",
              status: "awaiting_approval",
              user_safe_title: "Compliance approval required",
              user_safe_message: "A compliance fix is ready for review.",
              proposal_id: "proposal-2",
              opportunity_id: null,
              created_at: "2026-03-09T06:03:07.775Z",
            },
          ],
        },
        {
          count: 2,
        },
      ],
    });

    const { GET } = await loadRoute();
    const response = await GET(makeRequest(`${BASE_URL}?limit=5`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      notifications: [
        {
          id: "intervention-1",
          title: "Proposal issue detected",
          message: "We queued a safe recovery step.",
          status: "open",
          assignedAgent: "reliability-overseer",
          actionMode: "automatic",
          createdAt: "2026-03-09T05:03:07.775Z",
          href: "/proposals/proposal-1",
          hrefLabel: "View proposal",
          requiresApproval: false,
        },
        {
          id: "intervention-2",
          title: "Compliance approval required",
          message: "A compliance fix is ready for review.",
          status: "awaiting_approval",
          assignedAgent: "compliance-guardian",
          actionMode: "approval_required",
          createdAt: "2026-03-09T06:03:07.775Z",
          href: "/proposals/proposal-2",
          hrefLabel: "View proposal",
          requiresApproval: true,
        },
      ],
      activeCount: 2,
      canManageInterventions: false,
    });
    expect(mockDb.from).toHaveBeenNthCalledWith(1, "copilot_interventions");
    expect(mockDb.from).toHaveBeenNthCalledWith(2, "copilot_interventions");
    expect(mockDb.queries[0]?.eq).toHaveBeenCalledWith(
      "organization_id",
      TEST_ORG_ID,
    );
    expect(mockDb.queries[0]?.inFilter).toHaveBeenCalledWith("status", [
      "open",
      "awaiting_approval",
    ]);
    expect(mockDb.queries[1]?.select).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
    expect(mockDb.queries[1]?.inFilter).toHaveBeenCalledWith("status", [
      "open",
      "awaiting_approval",
    ]);
    expect(mockDb.queries[0]?.limit).toHaveBeenCalledWith(5);
  });

  it("keeps activeCount accurate when viewing resolved notifications", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockContext("manager"),
    );
    const mockDb = setupMockSupabase({
      queries: [
        {
          data: [
            {
              id: "intervention-3",
              assigned_agent: "reliability-overseer",
              action_mode: "automatic",
              status: "resolved",
              user_safe_title: "Incident resolved",
              user_safe_message: "The proposal retry completed successfully.",
              proposal_id: "proposal-3",
              opportunity_id: null,
              created_at: "2026-03-09T07:03:07.775Z",
            },
          ],
        },
        {
          count: 4,
        },
      ],
    });

    const { GET } = await loadRoute();
    const response = await GET(makeRequest(`${BASE_URL}?status=resolved&limit=5`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      notifications: [
        {
          id: "intervention-3",
          title: "Incident resolved",
          message: "The proposal retry completed successfully.",
          status: "resolved",
          assignedAgent: "reliability-overseer",
          actionMode: "automatic",
          createdAt: "2026-03-09T07:03:07.775Z",
          href: "/proposals/proposal-3",
          hrefLabel: "View proposal",
          requiresApproval: false,
        },
      ],
      activeCount: 4,
      canManageInterventions: true,
    });
    expect(mockDb.queries[0]?.eq).toHaveBeenNthCalledWith(
      1,
      "organization_id",
      TEST_ORG_ID,
    );
    expect(mockDb.queries[0]?.eq).toHaveBeenNthCalledWith(
      2,
      "status",
      "resolved",
    );
    expect(mockDb.queries[1]?.inFilter).toHaveBeenCalledWith("status", [
      "open",
      "awaiting_approval",
    ]);
  });

  it("falls back to proposal failures when copilot tables are unavailable", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockContext("admin"),
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
          error: {
            code: "PGRST205",
            message: "Could not find the table 'public.copilot_interventions' in the schema cache",
          },
          count: 0,
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
    const response = await GET(makeRequest(`${BASE_URL}?limit=5`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      notifications: [
        {
          id: "compat-proposal-compat-1",
          title: "Proposal generation issue detected",
          message:
            "Apex Federal Capture Plan hit a generation issue. Open the proposal to review the latest error and retry failed sections.",
          status: "open",
          assignedAgent: "reliability-overseer",
          actionMode: "automatic",
          createdAt: "2026-03-09T09:03:07.775Z",
          href: "/proposals/proposal-compat-1",
          hrefLabel: "View proposal",
          requiresApproval: false,
        },
      ],
      activeCount: 1,
      canManageInterventions: true,
    });
    expect(mockDb.from).toHaveBeenNthCalledWith(3, "proposals");
    expect(mockDb.from).toHaveBeenNthCalledWith(4, "proposals");
    expect(mockDb.queries[2]?.not).toHaveBeenCalledWith(
      "generation_error",
      "is",
      null,
    );
  });
});
