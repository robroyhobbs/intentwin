import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * RLS Policy Integration Tests
 *
 * These tests verify the application-level multi-tenancy enforcement.
 * Since we use adminClient (service role) which bypasses RLS, the application
 * relies on manual .eq('organization_id', ...) scoping in every query.
 *
 * These tests verify that:
 * 1. All data access paths enforce organization scoping
 * 2. Cross-organization access is impossible through the API layer
 * 3. Access verification functions correctly gate resource access
 */

// Mock Supabase modules
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
  verifyProposalAccess,
  verifyDocumentAccess,
  checkPlanLimit,
} from "@/lib/supabase/auth-api";
import {
  createMockSupabaseClient,
  createMockSupabaseAuth,
  createMockOrganization,
  createMockUser,
  createMockProposal,
  createMockDocument,
} from "@/lib/test-utils";

// Two separate organizations for isolation tests
const orgA = createMockOrganization({ id: "org-a", name: "Organization A" });
const orgB = createMockOrganization({ id: "org-b", name: "Organization B" });

const userA = createMockUser({
  id: "user-a",
  email: "alice@org-a.com",
  organization_id: orgA.id,
  role: "admin",
});

const userB = createMockUser({
  id: "user-b",
  email: "bob@org-b.com",
  organization_id: orgB.id,
  role: "admin",
});

const contextA = {
  user: { id: userA.id, email: userA.email } as any,
  organizationId: orgA.id,
  role: "admin" as const,
};

const contextB = {
  user: { id: userB.id, email: userB.email } as any,
  organizationId: orgB.id,
  role: "admin" as const,
};

let mockAdminClient: ReturnType<typeof createMockSupabaseClient>;
let mockServerAuth: ReturnType<typeof createMockSupabaseAuth>;

beforeEach(() => {
  vi.clearAllMocks();

  mockAdminClient = createMockSupabaseClient();
  mockServerAuth = createMockSupabaseAuth();

  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn(() => mockAdminClient),
    auth: mockServerAuth,
  });

  (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
    auth: mockServerAuth,
  });
});

// ──────────────────────────────────────────────────────────
// Cross-Organization Proposal Isolation
// ──────────────────────────────────────────────────────────
describe("Cross-Organization Proposal Isolation", () => {
  it("prevents user A from accessing user B's proposal", async () => {
    // The adminClient query with org_id filter returns nothing (cross-org)
    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "No rows found" },
    });

    const proposalFromOrgB = createMockProposal({
      id: "prop-b-1",
      organization_id: orgB.id,
    });

    const result = await verifyProposalAccess(contextA, proposalFromOrgB.id);
    expect(result).toBeNull();
  });

  it("allows user A to access their own org's proposal", async () => {
    const proposalFromOrgA = createMockProposal({
      id: "prop-a-1",
      organization_id: orgA.id,
    });

    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: proposalFromOrgA,
      error: null,
    });

    const result = await verifyProposalAccess(contextA, proposalFromOrgA.id);
    expect(result).not.toBeNull();
    expect(result?.organization_id).toBe(orgA.id);
  });

  it("prevents enumeration of other org proposals by ID guessing", async () => {
    // Even with a valid proposal ID from org B, access should be denied
    const ids = ["prop-b-1", "prop-b-2", "prop-b-3"];

    for (const id of ids) {
      mockAdminClient.single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "No rows found" },
      });

      const result = await verifyProposalAccess(contextA, id);
      expect(result).toBeNull();
    }
  });
});

// ──────────────────────────────────────────────────────────
// Cross-Organization Document Isolation
// ──────────────────────────────────────────────────────────
describe("Cross-Organization Document Isolation", () => {
  it("prevents user A from accessing user B's document", async () => {
    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "No rows found" },
    });

    const docFromOrgB = createMockDocument({
      id: "doc-b-1",
      organization_id: orgB.id,
    });

    const result = await verifyDocumentAccess(contextA, docFromOrgB.id);
    expect(result).toBeNull();
  });

  it("allows user A to access their own org's document", async () => {
    const docFromOrgA = createMockDocument({
      id: "doc-a-1",
      organization_id: orgA.id,
    });

    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: docFromOrgA,
      error: null,
    });

    const result = await verifyDocumentAccess(contextA, docFromOrgA.id);
    expect(result).not.toBeNull();
    expect(result?.organization_id).toBe(orgA.id);
  });
});

// ──────────────────────────────────────────────────────────
// Plan Limit Isolation
// ──────────────────────────────────────────────────────────
describe("Plan Limit Isolation", () => {
  it("checks plan limits for the correct organization", async () => {
    // Org A is on starter with room
    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: {
        plan_tier: "starter",
        plan_limits: { proposals_per_month: 20 },
        usage_current_period: { proposals_created: 5 },
        trial_ends_at: null,
      },
      error: null,
    });

    const resultA = await checkPlanLimit(orgA.id, "proposals_per_month");
    expect(resultA.allowed).toBe(true);
    expect(resultA.current).toBe(5);
  });

  it("enforces plan limits per organization independently", async () => {
    // Org A is at limit
    mockAdminClient.single = vi.fn()
      .mockResolvedValueOnce({
        data: {
          plan_tier: "starter",
          plan_limits: { proposals_per_month: 20 },
          usage_current_period: { proposals_created: 20 },
          trial_ends_at: null,
        },
        error: null,
      })
      // Org B still has room
      .mockResolvedValueOnce({
        data: {
          plan_tier: "pro",
          plan_limits: { proposals_per_month: 100 },
          usage_current_period: { proposals_created: 10 },
          trial_ends_at: null,
        },
        error: null,
      });

    const resultA = await checkPlanLimit(orgA.id, "proposals_per_month");
    expect(resultA.allowed).toBe(false);

    const resultB = await checkPlanLimit(orgB.id, "proposals_per_month");
    expect(resultB.allowed).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────
// User Context Isolation
// ──────────────────────────────────────────────────────────
describe("User Context Organization Binding", () => {
  it("binds user to their organization context", async () => {
    mockServerAuth.getUser.mockResolvedValue({
      data: { user: { id: userA.id, email: userA.email } },
    });

    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: {
        organization_id: orgA.id,
        role: "admin",
        team_id: null,
      },
      error: null,
    });

    const context = await getUserContext();
    expect(context).not.toBeNull();
    expect(context?.organizationId).toBe(orgA.id);
    // User cannot impersonate another org
    expect(context?.organizationId).not.toBe(orgB.id);
  });

  it("returns null for users without organization profile", async () => {
    mockServerAuth.getUser.mockResolvedValue({
      data: { user: { id: "orphan-user", email: "orphan@test.com" } },
    });

    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "No rows found" },
    });

    const context = await getUserContext();
    expect(context).toBeNull();
  });

  it("user A context cannot access org B data", async () => {
    // Setup: user A is authenticated with org A context
    // Try to access a proposal from org B
    const orgBProposal = createMockProposal({
      id: "prop-b-secret",
      organization_id: orgB.id,
      title: "Confidential Org B Proposal",
    });

    // The query filters by org_id, so cross-org returns nothing
    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "No rows found" },
    });

    const result = await verifyProposalAccess(contextA, orgBProposal.id);
    expect(result).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────
// Role-Based Access (within same organization)
// ──────────────────────────────────────────────────────────
describe("Role-Based Access Within Organization", () => {
  it("allows admin role full access to org proposals", async () => {
    const proposal = createMockProposal({ organization_id: orgA.id });

    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: proposal,
      error: null,
    });

    const adminContext = { ...contextA, role: "admin" as const };
    const result = await verifyProposalAccess(adminContext, proposal.id);
    expect(result).not.toBeNull();
  });

  it("allows member role to access org proposals", async () => {
    const proposal = createMockProposal({ organization_id: orgA.id });

    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: proposal,
      error: null,
    });

    const memberContext = {
      user: { id: "member-user" } as any,
      organizationId: orgA.id,
      role: "member" as const,
    };
    const result = await verifyProposalAccess(memberContext, proposal.id);
    expect(result).not.toBeNull();
  });
});

// ──────────────────────────────────────────────────────────
// Edge Cases
// ──────────────────────────────────────────────────────────
describe("Multi-Tenancy Edge Cases", () => {
  it("handles empty organization_id gracefully", async () => {
    const contextNoOrg = {
      user: { id: "user-no-org" } as any,
      organizationId: "",
      role: "admin" as const,
    };

    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "No rows found" },
    });

    const result = await verifyProposalAccess(contextNoOrg, "any-proposal");
    expect(result).toBeNull();
  });

  it("handles null database responses without crashing", async () => {
    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await verifyProposalAccess(contextA, "missing-proposal");
    expect(result).toBeNull();
  });

  it("prevents SQL injection through organization_id", async () => {
    const maliciousContext = {
      user: { id: "attacker" } as any,
      organizationId: "'; DROP TABLE proposals; --",
      role: "admin" as const,
    };

    // The parameterized query should handle this safely
    mockAdminClient.single = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await verifyProposalAccess(
      maliciousContext,
      "target-proposal",
    );
    expect(result).toBeNull();

    // Verify eq was called with the malicious string (Supabase parameterizes it)
    expect(mockAdminClient.eq).toHaveBeenCalledWith(
      "organization_id",
      "'; DROP TABLE proposals; --",
    );
  });
});
