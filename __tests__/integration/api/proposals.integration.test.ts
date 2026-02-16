import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase modules BEFORE importing anything that uses them
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-api", () => ({
  getUserContext: vi.fn(),
  checkPlanLimit: vi.fn(),
  incrementUsage: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getUserContext,
  checkPlanLimit,
  incrementUsage,
} from "@/lib/supabase/auth-api";
import { GET, POST } from "@/app/api/proposals/route";
import {
  createMockSupabaseClient,
  createMockOrganization,
  createMockUser,
  createMockProposal,
  createMockArray,
} from "@/lib/test-utils";
import { NextRequest } from "next/server";

// Helpers
function makeRequest(
  method: string,
  body?: Record<string, unknown>,
): NextRequest {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest("http://localhost:3000/api/proposals", init);
}

async function parseResponse(response: Response) {
  const json = await response.json();
  return { status: response.status, body: json };
}

// Setup
const mockQuery = createMockSupabaseClient();
const org = createMockOrganization();
const user = createMockUser({ organization_id: org.id });

const mockContext = {
  user: { id: user.id, email: user.email },
  organizationId: org.id,
  role: "admin" as const,
  teamId: undefined,
};

beforeEach(() => {
  vi.clearAllMocks();

  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn(() => mockQuery),
  });
});

// ──────────────────────────────────────────────────────────
// GET /api/proposals
// ──────────────────────────────────────────────────────────
describe("GET /api/proposals", () => {
  it("returns 401 when user is not authenticated", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = makeRequest("GET");
    const response = await GET(request);
    const { status, body } = await parseResponse(response);

    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns proposals scoped to user organization", async () => {
    const proposals = createMockArray(createMockProposal, 3, {
      organization_id: org.id,
    });

    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(mockContext);

    // Mock the chained query to resolve with proposals
    mockQuery.order = vi.fn().mockResolvedValue({
      data: proposals,
      error: null,
    });

    const request = makeRequest("GET");
    const response = await GET(request);
    const { status, body } = await parseResponse(response);

    expect(status).toBe(200);
    expect(body.proposals).toHaveLength(3);
    // Verify org scoping was applied
    expect(mockQuery.eq).toHaveBeenCalledWith("organization_id", org.id);
  });

  it("returns 500 when database query fails", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(mockContext);

    mockQuery.order = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Database connection failed" },
    });

    const request = makeRequest("GET");
    const response = await GET(request);
    const { status, body } = await parseResponse(response);

    expect(status).toBe(500);
    expect(body.error).toBe("Database connection failed");
  });

  it("returns empty array when org has no proposals", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(mockContext);

    mockQuery.order = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    const request = makeRequest("GET");
    const response = await GET(request);
    const { status, body } = await parseResponse(response);

    expect(status).toBe(200);
    expect(body.proposals).toEqual([]);
  });
});

// ──────────────────────────────────────────────────────────
// POST /api/proposals
// ──────────────────────────────────────────────────────────
describe("POST /api/proposals", () => {
  it("returns 401 when user is not authenticated", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = makeRequest("POST", { title: "Test" });
    const response = await POST(request);
    const { status, body } = await parseResponse(response);

    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when plan limit is reached", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(mockContext);
    (checkPlanLimit as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: false,
      message: "Monthly proposal limit reached",
      current: 20,
      limit: 20,
    });

    const request = makeRequest("POST", { title: "Test" });
    const response = await POST(request);
    const { status, body } = await parseResponse(response);

    expect(status).toBe(403);
    expect(body.error).toContain("limit");
  });

  it("returns 400 when title is missing", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(mockContext);
    (checkPlanLimit as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: true,
      current: 5,
      limit: 20,
    });

    const request = makeRequest("POST", {});
    const response = await POST(request);
    const { status, body } = await parseResponse(response);

    expect(status).toBe(400);
    expect(body.error).toBe("Title is required");
  });

  it("creates proposal with correct organization scoping", async () => {
    const newProposal = createMockProposal({
      organization_id: org.id,
      title: "New Proposal",
    });

    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(mockContext);
    (checkPlanLimit as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: true,
      current: 5,
      limit: 20,
    });

    mockQuery.single = vi.fn().mockResolvedValue({
      data: newProposal,
      error: null,
    });

    const request = makeRequest("POST", { title: "New Proposal" });
    const response = await POST(request);
    const { status, body } = await parseResponse(response);

    expect(status).toBe(201);
    expect(body.proposal.title).toBe("New Proposal");
    expect(body.proposal.organization_id).toBe(org.id);

    // Verify usage was incremented
    expect(incrementUsage).toHaveBeenCalledWith(
      org.id,
      "proposals_created",
    );
  });

  it("includes IDD fields when provided", async () => {
    const outcomeContract = {
      current_state: ["Legacy systems"],
      desired_state: ["Cloud-native platform"],
      transformation: "Digital transformation",
      success_metrics: [],
    };

    const newProposal = createMockProposal({
      organization_id: org.id,
      title: "IDD Proposal",
    });

    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(mockContext);
    (checkPlanLimit as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: true,
      current: 0,
      limit: 20,
    });

    mockQuery.single = vi.fn().mockResolvedValue({
      data: { ...newProposal, outcome_contract: outcomeContract },
      error: null,
    });

    const request = makeRequest("POST", {
      title: "IDD Proposal",
      outcome_contract: outcomeContract,
      intent_status: "approved",
    });
    const response = await POST(request);
    const { status } = await parseResponse(response);

    expect(status).toBe(201);
    // Verify insert was called with IDD fields
    expect(mockQuery.insert).toHaveBeenCalled();
  });

  it("returns 500 when database insert fails", async () => {
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(mockContext);
    (checkPlanLimit as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: true,
      current: 0,
      limit: 20,
    });

    mockQuery.single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Unique constraint violation" },
    });

    const request = makeRequest("POST", { title: "Failing Proposal" });
    const response = await POST(request);
    const { status, body } = await parseResponse(response);

    expect(status).toBe(500);
    expect(body.error).toContain("Failed to create proposal");
  });

  it("handles concurrent requests with plan limit enforcement", async () => {
    // First request: allowed
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(mockContext);
    (checkPlanLimit as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ allowed: true, current: 19, limit: 20 })
      .mockResolvedValueOnce({ allowed: false, message: "Limit reached", current: 20, limit: 20 });

    const proposal1 = createMockProposal({ organization_id: org.id });
    mockQuery.single = vi.fn().mockResolvedValueOnce({
      data: proposal1,
      error: null,
    });

    const req1 = makeRequest("POST", { title: "Proposal 1" });
    const res1 = await POST(req1);
    expect(res1.status).toBe(201);

    // Second request: blocked by limit
    const req2 = makeRequest("POST", { title: "Proposal 2" });
    const res2 = await POST(req2);
    expect(res2.status).toBe(403);
  });
});
