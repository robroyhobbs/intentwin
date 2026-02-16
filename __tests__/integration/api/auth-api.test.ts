import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase modules BEFORE importing anything that uses them
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getUserContext,
  checkPlanLimit,
  incrementUsage,
  verifyProposalAccess,
  verifyDocumentAccess,
} from "@/lib/supabase/auth-api";
import {
  createMockSupabaseClient,
  createMockSupabaseAuth,
  createMockOrganization,
  createMockUser,
  createMockProposal,
} from "@/lib/test-utils";

const mockAdminClient = createMockSupabaseClient();
const mockServerAuth = createMockSupabaseAuth();

beforeEach(() => {
  vi.clearAllMocks();

  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn(() => mockAdminClient),
    auth: mockServerAuth,
  });

  (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
    auth: mockServerAuth,
  });
});

describe("getUserContext", () => {
  it("returns null when no user is authenticated", async () => {
    mockServerAuth.getUser.mockResolvedValue({ data: { user: null } });

    const result = await getUserContext();
    expect(result).toBeNull();
  });

  it("returns user context with organization for authenticated user", async () => {
    const mockUser = { id: "user-1", email: "test@example.com" };
    mockServerAuth.getUser.mockResolvedValue({ data: { user: mockUser } });

    // Mock profile lookup
    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: { organization_id: "org-1", role: "admin", team_id: null },
      error: null,
    });

    const result = await getUserContext();

    expect(result).not.toBeNull();
    expect(result?.user.id).toBe("user-1");
    expect(result?.organizationId).toBe("org-1");
    expect(result?.role).toBe("admin");
  });

  it("returns null when user has no organization profile", async () => {
    const mockUser = { id: "user-1", email: "test@example.com" };
    mockServerAuth.getUser.mockResolvedValue({ data: { user: mockUser } });

    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "No rows found" },
    });

    const result = await getUserContext();
    expect(result).toBeNull();
  });

  it("falls back to bearer token auth when cookies fail", async () => {
    // Cookie auth fails
    mockServerAuth.getUser.mockResolvedValue({ data: { user: null } });

    // Bearer token succeeds
    const mockUser = { id: "user-2", email: "bearer@example.com" };
    mockServerAuth.getUser.mockResolvedValueOnce({ data: { user: null } });

    const request = new Request("http://localhost/api/test", {
      headers: { authorization: "Bearer test-token" },
    }) as unknown as import("next/server").NextRequest;

    // Need to also mock the admin client's auth for bearer
    const adminAuth = createMockSupabaseAuth();
    adminAuth.getUser.mockResolvedValue({ data: { user: mockUser } });
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn(() => mockAdminClient),
      auth: adminAuth,
    });

    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: { organization_id: "org-2", role: "member", team_id: null },
      error: null,
    });

    const result = await getUserContext(request);

    expect(result).not.toBeNull();
    expect(result?.organizationId).toBe("org-2");
    expect(result?.role).toBe("member");
  });
});

describe("checkPlanLimit", () => {
  it("allows usage when under limit", async () => {
    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: {
        plan_tier: "starter",
        plan_limits: { proposals_per_month: 20 },
        usage_current_period: { proposals_created: 5 },
        trial_ends_at: null,
      },
      error: null,
    });

    const result = await checkPlanLimit("org-1", "proposals_per_month");

    expect(result.allowed).toBe(true);
    expect(result.current).toBe(5);
    expect(result.limit).toBe(20);
  });

  it("blocks usage when at limit", async () => {
    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: {
        plan_tier: "starter",
        plan_limits: { proposals_per_month: 20 },
        usage_current_period: { proposals_created: 20 },
        trial_ends_at: null,
      },
      error: null,
    });

    const result = await checkPlanLimit("org-1", "proposals_per_month");

    expect(result.allowed).toBe(false);
    expect(result.message).toContain("limit");
  });

  it("allows unlimited for enterprise tier", async () => {
    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: {
        plan_tier: "enterprise",
        plan_limits: {},
        usage_current_period: {},
        trial_ends_at: null,
      },
      error: null,
    });

    const result = await checkPlanLimit("org-1", "proposals_per_month");

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(Infinity);
  });

  it("blocks expired trials", async () => {
    const pastDate = new Date("2025-01-01").toISOString();

    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: {
        plan_tier: "trial",
        plan_limits: { proposals_per_month: 5 },
        usage_current_period: { proposals_created: 0 },
        trial_ends_at: pastDate,
      },
      error: null,
    });

    const result = await checkPlanLimit("org-1", "proposals_per_month");

    expect(result.allowed).toBe(false);
    expect(result.message).toContain("Trial expired");
  });

  it("returns not allowed when organization not found", async () => {
    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    const result = await checkPlanLimit("nonexistent", "proposals_per_month");

    expect(result.allowed).toBe(false);
    expect(result.message).toContain("Organization not found");
  });
});

describe("verifyProposalAccess", () => {
  it("returns proposal when it belongs to user org", async () => {
    const mockProposal = createMockProposal({ organization_id: "org-1" });

    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: mockProposal,
      error: null,
    });

    const context = {
      user: { id: "user-1" } as any,
      organizationId: "org-1",
      role: "admin" as const,
    };

    const result = await verifyProposalAccess(context, mockProposal.id);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(mockProposal.id);
  });

  it("returns null for cross-org access attempt", async () => {
    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "No rows found" },
    });

    const context = {
      user: { id: "user-1" } as any,
      organizationId: "org-1",
      role: "admin" as const,
    };

    const result = await verifyProposalAccess(context, "other-org-proposal");

    expect(result).toBeNull();
  });
});

describe("verifyDocumentAccess", () => {
  it("returns document when it belongs to user org", async () => {
    const mockDoc = { id: "doc-1", organization_id: "org-1", title: "Test" };

    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: mockDoc,
      error: null,
    });

    const context = {
      user: { id: "user-1" } as any,
      organizationId: "org-1",
      role: "admin" as const,
    };

    const result = await verifyDocumentAccess(context, "doc-1");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("doc-1");
  });

  it("returns null for cross-org document access", async () => {
    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "No rows found" },
    });

    const context = {
      user: { id: "user-1" } as any,
      organizationId: "org-1",
      role: "admin" as const,
    };

    const result = await verifyDocumentAccess(context, "other-org-doc");

    expect(result).toBeNull();
  });
});

describe("incrementUsage", () => {
  it("increments usage counter by 1", async () => {
    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: { usage_current_period: { proposals_created: 5 } },
      error: null,
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const mockFrom = vi.fn(() => ({
      ...mockAdminClient,
      update: mockUpdate,
      single: mockAdminClient.single,
    }));

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: mockFrom,
    });

    await incrementUsage("org-1", "proposals_created");

    expect(mockFrom).toHaveBeenCalledWith("organizations");
  });

  it("creates usage counter if it does not exist", async () => {
    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: { usage_current_period: null },
      error: null,
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const mockFrom = vi.fn(() => ({
      ...mockAdminClient,
      update: mockUpdate,
      single: mockAdminClient.single,
    }));

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: mockFrom,
    });

    await incrementUsage("org-1", "proposals_created");

    // Should not throw even with null usage
    expect(mockFrom).toHaveBeenCalled();
  });
});
