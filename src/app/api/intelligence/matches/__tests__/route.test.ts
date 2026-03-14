import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetUserContext = vi.fn();
const mockCheckFeature = vi.fn();
const mockFrom = vi.fn();
const mockGetOpportunityMatches = vi.fn();

vi.mock("@/lib/supabase/auth-api", () => ({
  getUserContext: (...args: unknown[]) => mockGetUserContext(...args),
}));

vi.mock("@/lib/features/check-feature", () => ({
  checkFeature: (...args: unknown[]) => mockCheckFeature(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/intelligence", () => ({
  intelligenceClient: {
    isConfigured: true,
    getOpportunityMatches: (...args: unknown[]) =>
      mockGetOpportunityMatches(...args),
  },
}));

import { GET } from "../route";

function makeRequest(url = "http://localhost/api/intelligence/matches") {
  return new NextRequest(url);
}

const fakeContext = {
  user: { id: "user-1" },
  organizationId: "org-1",
  role: "member" as const,
};

describe("GET /api/intelligence/matches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUserContext.mockResolvedValue(null);

    const res = await GET(makeRequest());

    expect(res.status).toBe(401);
  });

  it("returns 403 when the intelligence feature is gated", async () => {
    mockGetUserContext.mockResolvedValue(fakeContext);
    mockCheckFeature.mockResolvedValue(false);

    const res = await GET(makeRequest());

    expect(res.status).toBe(403);
  });

  it("builds a profile from L1 data and forwards filters to intelligence", async () => {
    mockGetUserContext.mockResolvedValue(fakeContext);
    mockCheckFeature.mockResolvedValue(true);
    mockFrom.mockImplementation((table: string) => {
      if (table === "company_context") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    category: "certifications",
                    key: "iso-27001",
                    title: "ISO 27001",
                    content: "InfoSec certification",
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "prod-1",
                    product_name: "Cloud Modernization",
                    service_line: "Managed IT",
                    description: "Cloud ops",
                    capabilities: [
                      {
                        name: "Cloud Migration",
                        description: "Moves workloads",
                        outcomes: [],
                      },
                    ],
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      };
    });
    mockGetOpportunityMatches.mockResolvedValue({
      matches: [],
      total_candidates: 0,
      limit: 5,
    });

    const res = await GET(
      makeRequest(
        "http://localhost/api/intelligence/matches?state=CA&city=Los%20Angeles&naics=541512&limit=5&q=cloud",
      ),
    );

    expect(res.status).toBe(200);
    expect(mockGetOpportunityMatches).toHaveBeenCalledWith({
      profile: expect.objectContaining({
        naics_codes: ["541512"],
        service_lines: ["Managed IT"],
        capability_keywords: expect.arrayContaining([
          "Cloud Modernization",
          "Cloud Migration",
        ]),
        certifications: ["ISO 27001"],
        preferred_states: ["CA"],
        preferred_cities: ["Los Angeles"],
      }),
      filters: expect.objectContaining({
        naics_codes: ["541512"],
        state: "CA",
        city: "Los Angeles",
        q: "cloud",
      }),
      limit: 5,
    });

    const body = await res.json();
    expect(body.profile_summary).toEqual({
      productCount: 1,
      serviceLineCount: 1,
      capabilityCount: 2,
      certificationCount: 1,
      naicsCount: 1,
    });
  });

  it("returns 502 when the intelligence service call fails", async () => {
    mockGetUserContext.mockResolvedValue(fakeContext);
    mockCheckFeature.mockResolvedValue(true);
    mockFrom.mockImplementation((table: string) => {
      if (table === "company_context") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      };
    });
    mockGetOpportunityMatches.mockResolvedValue(null);

    const res = await GET(makeRequest());

    expect(res.status).toBe(502);
  });
});
