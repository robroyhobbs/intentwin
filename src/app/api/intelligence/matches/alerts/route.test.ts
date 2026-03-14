import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  mockGetUserContext,
  mockCheckFeature,
  mockFrom,
  mockGetOpportunityMatches,
  mockIntelligenceClient,
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

import { GET } from "./route";

const fakeContext = {
  user: { id: "user-1" },
  organizationId: "org-1",
  role: "member" as const,
};

describe("GET /api/intelligence/matches/alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIntelligenceClient.isConfigured = true;
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUserContext.mockResolvedValue(null);

    const res = await GET(new NextRequest("http://localhost/api/intelligence/matches/alerts"));

    expect(res.status).toBe(401);
  });

  it("returns alert counts for unsaved high-signal and urgent saved matches", async () => {
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
                    opportunity_id: "opp-saved",
                    status: "saved",
                    updated_at: "2026-03-14T10:00:00.000Z",
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
          opportunity_id: "opp-new",
          score: 84,
          confidence: "high",
          breakdown: {
            naics: 30,
            capabilities: 25,
            geography: 10,
            certifications: 10,
            set_aside: 5,
            deadline: 4,
          },
          reasons: ["Strong fit"],
          risks: [],
          opportunity: {
            id: "opp-new",
            source: "socrata:la",
            source_id: "src-1",
            title: "Cloud Services",
            description: null,
            agency: "City IT",
            jurisdiction: null,
            city: "Los Angeles",
            state: "CA",
            agency_level: "local",
            naics_code: "541512",
            native_category_code: null,
            native_category_name: null,
            posted_date: "2026-03-12",
            response_deadline: "2026-03-26T00:00:00.000Z",
            estimated_value: 120000,
            set_aside_type: null,
            contact_name: null,
            contact_email: null,
            contact_phone: null,
            portal_url: "https://example.com/new",
            status: "open",
          },
        },
        {
          opportunity_id: "opp-saved",
          score: 72,
          confidence: "medium",
          breakdown: {
            naics: 30,
            capabilities: 18,
            geography: 10,
            certifications: 8,
            set_aside: 2,
            deadline: 4,
          },
          reasons: ["Good service line fit"],
          risks: [],
          opportunity: {
            id: "opp-saved",
            source: "socrata:la",
            source_id: "src-2",
            title: "Infrastructure Support",
            description: null,
            agency: "County Ops",
            jurisdiction: null,
            city: "Long Beach",
            state: "CA",
            agency_level: "local",
            naics_code: "541512",
            native_category_code: null,
            native_category_name: null,
            posted_date: "2026-03-12",
            response_deadline: "2026-03-18T00:00:00.000Z",
            estimated_value: 99000,
            set_aside_type: null,
            contact_name: null,
            contact_email: null,
            contact_phone: null,
            portal_url: "https://example.com/saved",
            status: "open",
          },
        },
      ],
      total_candidates: 2,
      limit: 25,
    });

    const res = await GET(new NextRequest("http://localhost/api/intelligence/matches/alerts"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          new_high_signal_count: 1,
          urgent_saved_count: 1,
          total_attention_count: 2,
        }),
        new_high_signal_matches: [
          expect.objectContaining({
            opportunity_id: "opp-new",
            title: "Cloud Services",
          }),
        ],
        urgent_saved_matches: [
          expect.objectContaining({
            opportunity_id: "opp-saved",
            title: "Infrastructure Support",
            status: "saved",
          }),
        ],
      }),
    );
  });
});
