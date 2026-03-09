import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
const mockGetUserContext = vi.fn();
const mockFrom = vi.fn();
const mockAdminClient = { from: mockFrom };

vi.mock("@/lib/supabase/auth-api", () => ({
  getUserContext: (...args: unknown[]) => mockGetUserContext(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminClient,
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { GET, PATCH } from "../route";

function makeRequest(method: string) {
  return new NextRequest("http://localhost/api/user/changelog-viewed", { method });
}

const fakeContext = {
  user: { id: "user-1" },
  organizationId: "org-1",
  role: "member" as const,
};

describe("GET /api/user/changelog-viewed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUserContext.mockResolvedValue(null);
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("returns last_viewed_changelog when set", async () => {
    mockGetUserContext.mockResolvedValue(fakeContext);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { last_viewed_changelog: "2026-03-01T00:00:00Z" },
              error: null,
            }),
          }),
        }),
      }),
    });

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.last_viewed_changelog).toBe("2026-03-01T00:00:00Z");
  });

  it("returns null when never viewed", async () => {
    mockGetUserContext.mockResolvedValue(fakeContext);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { last_viewed_changelog: null },
              error: null,
            }),
          }),
        }),
      }),
    });

    const res = await GET(makeRequest("GET"));
    const body = await res.json();
    expect(body.last_viewed_changelog).toBeNull();
  });

  it("returns 500 on database error", async () => {
    mockGetUserContext.mockResolvedValue(fakeContext);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "db error" },
            }),
          }),
        }),
      }),
    });

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/user/changelog-viewed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUserContext.mockResolvedValue(null);
    const res = await PATCH(makeRequest("PATCH"));
    expect(res.status).toBe(401);
  });

  it("updates last_viewed_changelog to current time", async () => {
    mockGetUserContext.mockResolvedValue(fakeContext);
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    mockFrom.mockReturnValue({ update: mockUpdate });

    const res = await PATCH(makeRequest("PATCH"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.last_viewed_changelog).toBeDefined();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ last_viewed_changelog: expect.any(String) }),
    );
  });

  it("returns 500 on database error", async () => {
    mockGetUserContext.mockResolvedValue(fakeContext);
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "db error" } }),
        }),
      }),
    });

    const res = await PATCH(makeRequest("PATCH"));
    expect(res.status).toBe(500);
  });

  it("scopes query by user id and organization id", async () => {
    mockGetUserContext.mockResolvedValue(fakeContext);
    const mockEq2 = vi.fn().mockResolvedValue({ error: null });
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: mockEq1 }),
    });

    await PATCH(makeRequest("PATCH"));
    expect(mockEq1).toHaveBeenCalledWith("id", "user-1");
    expect(mockEq2).toHaveBeenCalledWith("organization_id", "org-1");
  });
});
