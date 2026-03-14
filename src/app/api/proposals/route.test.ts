import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  mockGetUserContext,
  mockCheckPlanLimit,
  mockIncrementUsage,
  mockSanitizeTitle,
  mockLoggerError,
  mockFrom,
} = vi.hoisted(() => ({
  mockGetUserContext: vi.fn(),
  mockCheckPlanLimit: vi.fn(),
  mockIncrementUsage: vi.fn(),
  mockSanitizeTitle: vi.fn(),
  mockLoggerError: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-api", () => ({
  getUserContext: (...args: unknown[]) => mockGetUserContext(...args),
  checkPlanLimit: (...args: unknown[]) => mockCheckPlanLimit(...args),
  incrementUsage: (...args: unknown[]) => mockIncrementUsage(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/security/sanitize", () => ({
  sanitizeTitle: (...args: unknown[]) => mockSanitizeTitle(...args),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

import { POST } from "./route";

const fakeContext = {
  user: { id: "user-1" },
  organizationId: "org-1",
  teamId: "team-1",
  role: "member" as const,
};

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/proposals", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("POST /api/proposals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserContext.mockResolvedValue(fakeContext);
    mockCheckPlanLimit.mockResolvedValue({ allowed: true });
    mockIncrementUsage.mockResolvedValue(undefined);
    mockSanitizeTitle.mockImplementation((value: string) => value);
  });

  it("links a created proposal back to its source saved match", async () => {
    const proposalInsertSingle = vi.fn().mockResolvedValue({
      data: {
        id: "proposal-123",
        title: "City IT Proposal",
      },
      error: null,
    });
    const proposalInsertSelect = vi.fn().mockReturnValue({ single: proposalInsertSingle });
    const proposalInsert = vi.fn().mockReturnValue({ select: proposalInsertSelect });
    const feedbackUpdateEqOpportunity = vi.fn().mockResolvedValue({ error: null });
    const feedbackUpdateEqOrg = vi.fn().mockReturnValue({
      eq: feedbackUpdateEqOpportunity,
    });
    const feedbackUpdate = vi.fn().mockReturnValue({
      eq: feedbackUpdateEqOrg,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "proposals") {
        return { insert: proposalInsert };
      }
      if (table === "opportunity_match_feedback") {
        return { update: feedbackUpdate };
      }
      if (table === "proposal_requirements") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const res = await POST(
      makeRequest({
        title: "City IT Proposal",
        intake_data: {
          opportunity_source: {
            id: "opp-1",
            title: "Managed IT Services",
          },
        },
      }),
    );

    expect(res.status).toBe(201);
    expect(feedbackUpdate).toHaveBeenCalledWith({
      proposal_id: "proposal-123",
      status: "proposal_started",
    });
    expect(feedbackUpdateEqOrg).toHaveBeenCalledWith("organization_id", "org-1");
    expect(feedbackUpdateEqOpportunity).toHaveBeenCalledWith("opportunity_id", "opp-1");
  });
});
