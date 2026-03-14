import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  mockGetUserContext,
  mockCheckFeature,
  mockFrom,
  mockGetOpportunityMatches,
  mockIntelligenceClient,
  mockNotFound,
} = vi.hoisted(() => {
  const getOpportunityMatches = vi.fn();
  return {
    mockGetUserContext: vi.fn(),
    mockCheckFeature: vi.fn(),
    mockFrom: vi.fn(),
    mockGetOpportunityMatches: getOpportunityMatches,
    mockIntelligenceClient: {
      isConfigured: true,
      getOpportunityMatches: (...args: unknown[]) => getOpportunityMatches(...args),
    },
    mockNotFound: vi.fn(),
  };
});

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
  intelligenceClient: mockIntelligenceClient,
}));

import { GET, PATCH } from "../route";

function makeRequest(url = "http://localhost/api/intelligence/matches") {
  return new NextRequest(url);
}

function makePatchRequest(body: unknown) {
  return new NextRequest("http://localhost/api/intelligence/matches", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

const fakeContext = {
  user: { id: "user-1" },
  organizationId: "org-1",
  role: "member" as const,
};

describe("GET /api/intelligence/matches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIntelligenceClient.isConfigured = true;
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

  it("merges saved and dismissed feedback into the response payload", async () => {
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

      if (table === "product_contexts") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }

      if (table === "opportunity_match_feedback") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    opportunity_id: "opp-1",
                    status: "saved",
                    updated_at: "2026-03-14T12:00:00.000Z",
                    proposal_id: null,
                  },
                  {
                    opportunity_id: "opp-2",
                    status: "dismissed",
                    updated_at: "2026-03-14T12:01:00.000Z",
                    proposal_id: null,
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });
    mockGetOpportunityMatches.mockResolvedValue({
      matches: [
        {
          opportunity_id: "opp-1",
          score: 88,
          confidence: "high",
          breakdown: {
            naics: 30,
            capabilities: 30,
            geography: 10,
            certifications: 8,
            set_aside: 5,
            deadline: 5,
          },
          reasons: [],
          risks: [],
          opportunity: {
            id: "opp-1",
            source: "socrata:la",
            source_id: "src-1",
            title: "Managed IT Services",
            description: null,
            agency: "City IT",
            jurisdiction: null,
            city: "Los Angeles",
            state: "CA",
            agency_level: "local",
            naics_code: "541512",
            native_category_code: null,
            native_category_name: null,
            posted_date: null,
            response_deadline: null,
            estimated_value: null,
            set_aside_type: null,
            contact_name: null,
            contact_email: null,
            contact_phone: null,
            portal_url: null,
            status: "open",
          },
        },
        {
          opportunity_id: "opp-2",
          score: 61,
          confidence: "medium",
          breakdown: {
            naics: 20,
            capabilities: 20,
            geography: 10,
            certifications: 5,
            set_aside: 3,
            deadline: 3,
          },
          reasons: [],
          risks: [],
          opportunity: {
            id: "opp-2",
            source: "socrata:nyc",
            source_id: "src-2",
            title: "ERP Support",
            description: null,
            agency: "City Finance",
            jurisdiction: null,
            city: "New York",
            state: "NY",
            agency_level: "local",
            naics_code: "541511",
            native_category_code: null,
            native_category_name: null,
            posted_date: null,
            response_deadline: null,
            estimated_value: null,
            set_aside_type: null,
            contact_name: null,
            contact_email: null,
            contact_phone: null,
            portal_url: null,
            status: "open",
          },
        },
      ],
      total_candidates: 2,
      limit: 10,
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.feedback_by_opportunity_id).toEqual({
      "opp-1": {
        status: "saved",
        updated_at: "2026-03-14T12:00:00.000Z",
        proposal_id: null,
      },
      "opp-2": {
        status: "dismissed",
        updated_at: "2026-03-14T12:01:00.000Z",
        proposal_id: null,
      },
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

describe("PATCH /api/intelligence/matches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIntelligenceClient.isConfigured = true;
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUserContext.mockResolvedValue(null);

    const res = await PATCH(
      makePatchRequest({
        opportunity_id: "opp-1",
        status: "saved",
        opportunity: {
          id: "opp-1",
          source: "socrata:la",
          title: "Managed IT Services",
          agency: "City IT",
          portal_url: "https://example.com/opp-1",
        },
      }),
    );

    expect(res.status).toBe(401);
  });

  it("rejects invalid statuses", async () => {
    mockGetUserContext.mockResolvedValue(fakeContext);
    mockCheckFeature.mockResolvedValue(true);

    const res = await PATCH(
      makePatchRequest({
        opportunity_id: "opp-1",
        status: "archived",
      }),
    );

    expect(res.status).toBe(400);
  });

  it("upserts feedback for the authenticated organization", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        opportunity_id: "opp-1",
        status: "saved",
        updated_at: "2026-03-14T12:00:00.000Z",
        proposal_id: null,
      },
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });

    mockGetUserContext.mockResolvedValue(fakeContext);
    mockCheckFeature.mockResolvedValue(true);
    mockFrom.mockImplementation((table: string) => {
      if (table !== "opportunity_match_feedback") {
        throw new Error(`Unexpected table ${table}`);
      }
      return {
        upsert: mockUpsert,
      };
    });

    const res = await PATCH(
      makePatchRequest({
        opportunity_id: "opp-1",
        status: "saved",
        opportunity: {
          id: "opp-1",
          source: "socrata:la",
          title: "Managed IT Services",
          agency: "City IT",
          portal_url: "https://example.com/opp-1",
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        user_id: "user-1",
        opportunity_id: "opp-1",
        source: "socrata:la",
        title: "Managed IT Services",
        agency: "City IT",
        portal_url: "https://example.com/opp-1",
        status: "saved",
        proposal_id: null,
      }),
      { onConflict: "organization_id,opportunity_id" },
    );
  });

  it("accepts reviewing and proposal_started lifecycle statuses", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        opportunity_id: "opp-1",
        status: "proposal_started",
        updated_at: "2026-03-14T12:00:00.000Z",
        proposal_id: "proposal-123",
      },
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });

    mockGetUserContext.mockResolvedValue(fakeContext);
    mockCheckFeature.mockResolvedValue(true);
    mockFrom.mockImplementation((table: string) => {
      if (table !== "opportunity_match_feedback") {
        throw new Error(`Unexpected table ${table}`);
      }
      return {
        upsert: mockUpsert,
      };
    });

    const res = await PATCH(
      makePatchRequest({
        opportunity_id: "opp-1",
        status: "proposal_started",
        proposal_id: "proposal-123",
        opportunity: {
          id: "opp-1",
          source: "socrata:la",
          title: "Managed IT Services",
          agency: "City IT",
          portal_url: "https://example.com/opp-1",
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "proposal_started",
        proposal_id: "proposal-123",
      }),
      { onConflict: "organization_id,opportunity_id" },
    );
  });

  it("clears feedback when status is null", async () => {
    const mockDeleteEqOpportunity = vi.fn().mockResolvedValue({ error: null });
    const mockDeleteEqOrg = vi.fn().mockReturnValue({
      eq: mockDeleteEqOpportunity,
    });
    const mockDelete = vi.fn().mockReturnValue({
      eq: mockDeleteEqOrg,
    });

    mockGetUserContext.mockResolvedValue(fakeContext);
    mockCheckFeature.mockResolvedValue(true);
    mockFrom.mockImplementation((table: string) => {
      if (table !== "opportunity_match_feedback") {
        throw new Error(`Unexpected table ${table}`);
      }
      return {
        delete: mockDelete,
      };
    });

    const res = await PATCH(
      makePatchRequest({
        opportunity_id: "opp-1",
        status: null,
      }),
    );

    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDeleteEqOrg).toHaveBeenCalledWith("organization_id", "org-1");
    expect(mockDeleteEqOpportunity).toHaveBeenCalledWith("opportunity_id", "opp-1");
  });
});

describe("GET /api/intelligence/matches/saved", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns saved matches with linked proposal metadata", async () => {
    mockGetUserContext.mockResolvedValue(fakeContext);
    mockCheckFeature.mockResolvedValue(true);
    mockFrom.mockImplementation((table: string) => {
      if (table === "opportunity_match_feedback") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      opportunity_id: "opp-1",
                      source: "socrata:la",
                      title: "Managed IT Services",
                      agency: "City IT",
                      portal_url: "https://example.com/opp-1",
                      status: "saved",
                      updated_at: "2026-03-14T12:00:00.000Z",
                      proposal_id: "proposal-123",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }

      if (table === "proposals") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "proposal-123",
                    title: "City IT Proposal",
                    status: "drafting",
                    updated_at: "2026-03-14T12:05:00.000Z",
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const module = await import("../saved/route");
    const res = await module.GET(
      new NextRequest("http://localhost/api/intelligence/matches/saved"),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      saved_matches: [
        expect.objectContaining({
          opportunity_id: "opp-1",
          status: "saved",
          proposal: {
            id: "proposal-123",
            title: "City IT Proposal",
            status: "drafting",
            updated_at: "2026-03-14T12:05:00.000Z",
          },
        }),
      ],
    });
  });
});
