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
const BASE_URL =
  "http://localhost/api/copilot/interventions/intervention-1/approve";

function makeRequest(body?: unknown) {
  return new NextRequest(new URL(BASE_URL), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function mockContext(role: "admin" | "manager" | "member" = "admin") {
  return {
    user: { id: "user-1", email: "admin@example.com" },
    organizationId: TEST_ORG_ID,
    role,
  };
}

function setupMockSupabase(opts?: {
  data?: Record<string, unknown> | null;
  error?: { message?: string; code?: string } | null;
}) {
  const single = vi.fn(() =>
    Promise.resolve({
      data: opts?.data ?? null,
      error: opts?.error ?? null,
    }),
  );
  const select = vi.fn(() => ({ single }));
  const eqThird = vi.fn(() => ({ select }));
  const eqSecond = vi.fn(() => ({ eq: eqThird }));
  const eqFirst = vi.fn(() => ({ eq: eqSecond }));
  const update = vi.fn(() => ({ eq: eqFirst }));
  const from = vi.fn(() => ({ update }));

  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from });

  return { from, update, eqFirst, eqSecond, eqThird, select, single };
}

async function loadRoute() {
  return import("./route");
}

describe("POST /api/copilot/interventions/[id]/approve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { POST } = await loadRoute();
    const response = await POST(makeRequest({ action: "approve" }), {
      params: Promise.resolve({ id: "intervention-1" }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    });
  });

  it("rejects members without approval access", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockContext("member"),
    );

    const { POST } = await loadRoute();
    const response = await POST(makeRequest({ action: "approve" }), {
      params: Promise.resolve({ id: "intervention-1" }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Only admins and managers can resolve copilot interventions",
      code: "FORBIDDEN",
    });
  });

  it("rejects invalid approval actions", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockContext("manager"),
    );

    const { POST } = await loadRoute();
    const response = await POST(makeRequest({ action: "archive" }), {
      params: Promise.resolve({ id: "intervention-1" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Action must be 'approve' or 'reject'",
      code: "BAD_REQUEST",
    });
  });

  it("returns not found when the intervention is outside org scope or not awaiting approval", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockContext("admin"),
    );
    setupMockSupabase({
      data: null,
      error: { code: "PGRST116", message: "No rows found" },
    });

    const { POST } = await loadRoute();
    const response = await POST(makeRequest({ action: "approve" }), {
      params: Promise.resolve({ id: "intervention-1" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Copilot intervention not found",
      code: "NOT_FOUND",
    });
  });

  it("resolves the intervention and records the decision", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockContext("manager"),
    );
    const mockDb = setupMockSupabase({
      data: {
        id: "intervention-1",
        assigned_agent: "compliance-guardian",
        action_mode: "approval_required",
        status: "resolved",
        user_safe_title: "Proposal review required",
        user_safe_message: "IntentBid Copilot recorded a proposal issue that requires review before further action.",
        internal_reason: "Proposal quality or compliance review required",
        proposal_id: "proposal-1",
        opportunity_id: null,
        resolution_decision: "approve",
        resolution_notes: "Looks good now",
        resolved_by: "user-1",
        resolved_at: "2026-03-09T17:00:12.752Z",
        created_at: "2026-03-09T05:00:00.000Z",
        updated_at: "2026-03-09T17:00:12.752Z",
      },
      error: null,
    });

    const { POST } = await loadRoute();
    const response = await POST(
      makeRequest({ action: "approve", notes: "Looks good now" }),
      {
        params: Promise.resolve({ id: "intervention-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      intervention: {
        id: "intervention-1",
        assignedAgent: "compliance-guardian",
        actionMode: "approval_required",
        status: "resolved",
        userSafeTitle: "Proposal review required",
        userSafeMessage:
          "IntentBid Copilot recorded a proposal issue that requires review before further action.",
        internalReason: "Proposal quality or compliance review required",
        proposalId: "proposal-1",
        opportunityId: null,
        resolutionDecision: "approve",
        resolutionNotes: "Looks good now",
        resolvedBy: "user-1",
        resolvedAt: "2026-03-09T17:00:12.752Z",
        createdAt: "2026-03-09T05:00:00.000Z",
        updatedAt: "2026-03-09T17:00:12.752Z",
      },
    });
    expect(mockDb.from).toHaveBeenCalledWith("copilot_interventions");
    expect(mockDb.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "resolved",
        resolution_decision: "approve",
        resolution_notes: "Looks good now",
        resolved_by: "user-1",
      }),
    );
    expect(mockDb.eqFirst).toHaveBeenNthCalledWith(1, "id", "intervention-1");
    expect(mockDb.eqSecond).toHaveBeenNthCalledWith(
      1,
      "organization_id",
      TEST_ORG_ID,
    );
    expect(mockDb.eqThird).toHaveBeenNthCalledWith(
      1,
      "status",
      "awaiting_approval",
    );
  });
});
