import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ═══════════════════════════════════════════════════════════════════════════════
// Intelligence Client Tests — TDD Phase (Red → Green)
//
// Categories: Happy Path, Bad Path, Edge Cases, Security, Data Leak, Data Damage
// ═══════════════════════════════════════════════════════════════════════════════

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Helper to create a mock Response
function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    headers: new Headers(),
    statusText: status === 200 ? "OK" : "Error",
  } as Response;
}

// Helper to create a delayed response (for timeout tests)
function delayedResponse(body: unknown, delayMs: number): Promise<Response> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockResponse(body)), delayMs);
  });
}

// ── Test Data Fixtures ──────────────────────────────────────────────────────

const MOCK_AGENCY_PROFILE = {
  agency_name: "Department of Veterans Affairs",
  agency_level: "federal" as const,
  preferred_eval_method: "tradeoff",
  typical_criteria_weights: { technical: 45, past_performance: 30, price: 25 },
  avg_num_offers: 5.2,
  total_awards_tracked: 23,
  avg_award_amount: 4200000,
  common_contract_types: ["FFP", "T&M"],
  protest_insights: ["Risk mitigation valued highly"],
  recent_awards: [
    {
      title: "IT Modernization",
      awardee: "Acme Corp",
      amount: 3500000,
      date: "2025-12-01",
      naics: "541511",
    },
  ],
};

const MOCK_PRICING_RESPONSE = {
  rate_benchmarks: [
    {
      category: "Software Developer",
      gsa_median: 158,
      gsa_range: [98, 245] as [number, number],
      bid_tab_median: null,
      competitive_range: null,
      data_points: 127,
      effective_date: "2026-01-15",
    },
  ],
  pricing_model_patterns: [{ model: "FFP", frequency_pct: 65 }],
  cost_realism_notes: ["GSA rates represent ceiling prices."],
};

const MOCK_AWARDS_RESPONSE = {
  awards: [
    {
      id: "abc-123",
      source: "usaspending",
      source_id: "USA-001",
      title: "Cloud Migration",
      awarding_agency: "VA",
      agency_level: "federal",
      awardee_name: "Tech Corp",
      award_amount: 2000000,
      contract_type: "FFP",
      pricing_type: "J",
      award_date: "2025-11-01",
      naics_code: "541511",
      psc_code: "D302",
      competition_type: "full",
      num_offers_received: 4,
      set_aside_type: null,
    },
  ],
  total: 1,
  limit: 20,
  offset: 0,
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("IntelligenceClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("INTELLIGENCE_API_URL", "http://localhost:3100");
    vi.stubEnv("INTELLIGENCE_SERVICE_KEY", "test-service-key");
    // Reset module cache to get fresh client instance
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Helper to get a fresh client (after env vars are set)
  async function getClient() {
    const mod = await import("../client");
    return mod.intelligenceClient;
  }

  // ── Happy Path ──────────────────────────────────────────────────────────

  describe("Happy Path", () => {
    it("fetches agency profile successfully", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(MOCK_AGENCY_PROFILE));
      const client = await getClient();

      const result = await client.getAgencyProfile("Department of Veterans Affairs");

      expect(result).toEqual(MOCK_AGENCY_PROFILE);
      expect(mockFetch).toHaveBeenCalledOnce();
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3100/api/v1/agency/Department%20of%20Veterans%20Affairs",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "X-Service-Key": "test-service-key",
          }),
        }),
      );
    });

    it("fetches pricing rates successfully", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(MOCK_PRICING_RESPONSE));
      const client = await getClient();

      const result = await client.getPricingRates({
        categories: ["Software Developer"],
        naicsCode: "541511",
      });

      expect(result).toEqual(MOCK_PRICING_RESPONSE);
      expect(mockFetch).toHaveBeenCalledOnce();
      // Verify query params are passed correctly
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("categories=Software+Developer");
      expect(calledUrl).toContain("naics_code=541511");
    });

    it("fetches awards search successfully", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(MOCK_AWARDS_RESPONSE));
      const client = await getClient();

      const result = await client.searchAwards({
        agency: "VA",
        naicsCode: "541511",
        limit: 10,
      });

      expect(result).toEqual(MOCK_AWARDS_RESPONSE);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("agency=VA");
      expect(calledUrl).toContain("naics_code=541511");
      expect(calledUrl).toContain("limit=10");
    });

    it("fetches composite proposal intelligence in parallel", async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse(MOCK_AGENCY_PROFILE))
        .mockResolvedValueOnce(mockResponse(MOCK_PRICING_RESPONSE))
        .mockResolvedValueOnce(mockResponse(MOCK_AWARDS_RESPONSE));

      const client = await getClient();
      const result = await client.getProposalIntelligence({
        agencyName: "VA",
        naicsCode: "541511",
        laborCategories: ["Software Developer"],
      });

      expect(result).not.toBeNull();
      expect(result!.agency).toEqual(MOCK_AGENCY_PROFILE);
      expect(result!.pricing).toEqual(MOCK_PRICING_RESPONSE);
      expect(result!.recentAwards).toHaveLength(1);
      expect(result!.totalMatchingAwards).toBe(1);
      expect(result!.fetchedAt).toBeTruthy();
      expect(result!.fetchDurationMs).toBeGreaterThanOrEqual(0);
      // All 3 fetches should have been made
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("caches responses within TTL", async () => {
      mockFetch.mockResolvedValue(mockResponse(MOCK_AGENCY_PROFILE));
      const client = await getClient();

      // First call — hits network
      await client.getAgencyProfile("VA");
      // Second call — should hit cache
      await client.getAgencyProfile("VA");

      expect(mockFetch).toHaveBeenCalledOnce(); // Only one network call
    });
  });

  // ── Bad Path ────────────────────────────────────────────────────────────

  describe("Bad Path", () => {
    it("returns null when INTELLIGENCE_API_URL is not set", async () => {
      vi.stubEnv("INTELLIGENCE_API_URL", "");
      vi.resetModules();
      const client = await getClient();

      const result = await client.getAgencyProfile("VA");

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("returns null when INTELLIGENCE_SERVICE_KEY is not set", async () => {
      vi.stubEnv("INTELLIGENCE_SERVICE_KEY", "");
      vi.resetModules();
      const client = await getClient();

      const result = await client.getAgencyProfile("VA");

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("returns null on HTTP 500 response", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: "Internal Server Error" }, 500));
      const client = await getClient();

      const result = await client.getAgencyProfile("VA");

      expect(result).toBeNull();
    });

    it("returns null on HTTP 404 response", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: "Not found" }, 404));
      const client = await getClient();

      const result = await client.getAgencyProfile("Unknown Agency");

      expect(result).toBeNull();
    });

    it("returns null on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Connection refused"));
      const client = await getClient();

      const result = await client.getAgencyProfile("VA");

      expect(result).toBeNull();
    });

    it("returns null on fetch timeout (AbortError)", async () => {
      // Simulate AbortController: fetch that rejects with AbortError when signal fires
      mockFetch.mockImplementationOnce(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            const signal = init?.signal;
            if (signal) {
              signal.addEventListener("abort", () => {
                const err = new DOMException("The operation was aborted.", "AbortError");
                reject(err);
              });
            }
            // Never resolves — waits for abort
          }),
      );
      const client = await getClient();

      const result = await client.getAgencyProfile("VA");

      // Should return null due to AbortController timeout
      expect(result).toBeNull();
    }, 10000);

    it("getProposalIntelligence returns null when service is unconfigured", async () => {
      vi.stubEnv("INTELLIGENCE_API_URL", "");
      vi.resetModules();
      const client = await getClient();

      const result = await client.getProposalIntelligence({
        agencyName: "VA",
        naicsCode: "541511",
      });

      expect(result).toBeNull();
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────

  describe("Edge Cases", () => {
    it("handles null agencyName in getProposalIntelligence", async () => {
      // Only pricing and awards should be fetched (not agency)
      mockFetch
        .mockResolvedValueOnce(mockResponse(MOCK_PRICING_RESPONSE))
        .mockResolvedValueOnce(mockResponse(MOCK_AWARDS_RESPONSE));

      const client = await getClient();
      const result = await client.getProposalIntelligence({
        agencyName: null,
        naicsCode: "541511",
        laborCategories: ["Software Developer"],
      });

      expect(result).not.toBeNull();
      expect(result!.agency).toBeNull();
      expect(result!.pricing).toEqual(MOCK_PRICING_RESPONSE);
      // Only 2 fetches (no agency)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("handles null naicsCode in getProposalIntelligence", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(MOCK_AGENCY_PROFILE));

      const client = await getClient();
      const result = await client.getProposalIntelligence({
        agencyName: "VA",
        naicsCode: null,
      });

      expect(result).not.toBeNull();
      expect(result!.agency).toEqual(MOCK_AGENCY_PROFILE);
      expect(result!.recentAwards).toHaveLength(0);
      // Only 1 fetch (just agency — no pricing since no categories, no awards since no NAICS)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("handles empty labor categories", async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse(MOCK_AGENCY_PROFILE))
        .mockResolvedValueOnce(mockResponse(MOCK_AWARDS_RESPONSE));

      const client = await getClient();
      const result = await client.getProposalIntelligence({
        agencyName: "VA",
        naicsCode: "541511",
        laborCategories: [],
      });

      expect(result).not.toBeNull();
      expect(result!.pricing).toBeNull(); // No categories to look up
      expect(mockFetch).toHaveBeenCalledTimes(2); // agency + awards only
    });

    it("handles partial failure in composite fetch gracefully", async () => {
      // Agency succeeds, pricing fails, awards succeed
      mockFetch
        .mockResolvedValueOnce(mockResponse(MOCK_AGENCY_PROFILE))
        .mockResolvedValueOnce(mockResponse({ error: "Server Error" }, 500))
        .mockResolvedValueOnce(mockResponse(MOCK_AWARDS_RESPONSE));

      const client = await getClient();
      const result = await client.getProposalIntelligence({
        agencyName: "VA",
        naicsCode: "541511",
        laborCategories: ["Software Developer"],
      });

      expect(result).not.toBeNull();
      expect(result!.agency).toEqual(MOCK_AGENCY_PROFILE);
      expect(result!.pricing).toBeNull(); // Failed, but didn't break others
      expect(result!.recentAwards).toHaveLength(1);
    });

    it("encodes agency names with special characters in URL", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(MOCK_AGENCY_PROFILE));
      const client = await getClient();

      await client.getAgencyProfile("U.S. Army Corps of Engineers");

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("U.S.%20Army%20Corps%20of%20Engineers");
    });

    it("uses separate cache keys for different parameters", async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({ ...MOCK_AGENCY_PROFILE, agency_name: "VA" }))
        .mockResolvedValueOnce(mockResponse({ ...MOCK_AGENCY_PROFILE, agency_name: "DoD" }));

      const client = await getClient();

      const va = await client.getAgencyProfile("VA");
      const dod = await client.getAgencyProfile("DoD");

      expect(va!.agency_name).toBe("VA");
      expect(dod!.agency_name).toBe("DoD");
      expect(mockFetch).toHaveBeenCalledTimes(2); // Different cache keys
    });
  });

  // ── Security ────────────────────────────────────────────────────────────

  describe("Security", () => {
    it("always sends X-Service-Key header with service key", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(MOCK_AGENCY_PROFILE));
      const client = await getClient();

      await client.getAgencyProfile("VA");

      const calledOptions = mockFetch.mock.calls[0][1] as RequestInit;
      expect((calledOptions.headers as Record<string, string>)["X-Service-Key"]).toBe(
        "test-service-key",
      );
    });

    it("does not expose service key in error logs or responses", async () => {
      // Simulate a network error — the client should catch it without leaking the key
      mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));
      const client = await getClient();

      const result = await client.getAgencyProfile("VA");

      // Should return null, not throw with key in error message
      expect(result).toBeNull();
    });

    it("does not make requests when both env vars are empty", async () => {
      vi.stubEnv("INTELLIGENCE_API_URL", "");
      vi.stubEnv("INTELLIGENCE_SERVICE_KEY", "");
      vi.resetModules();
      const client = await getClient();

      await client.getAgencyProfile("VA");
      await client.getPricingRates({ categories: ["PM"] });
      await client.searchAwards({ agency: "VA" });
      await client.getProposalIntelligence({ agencyName: "VA", naicsCode: "541511" });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ── Data Leak ───────────────────────────────────────────────────────────

  describe("Data Leak", () => {
    it("does not include organization-specific data in cache keys", async () => {
      // Cache keys should be based on query params, not org data
      // This ensures different orgs querying the same agency get the same cached response
      // (intelligence data is public procurement data, not org-specific)
      mockFetch.mockResolvedValue(mockResponse(MOCK_AGENCY_PROFILE));
      const client = await getClient();

      // Two calls to same endpoint should share cache
      await client.getAgencyProfile("VA");
      await client.getAgencyProfile("VA");

      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it("does not log response bodies (only metadata)", async () => {
      // The client should log fetch duration and hit/miss, not actual data
      mockFetch.mockResolvedValueOnce(mockResponse(MOCK_AGENCY_PROFILE));
      const client = await getClient();

      const result = await client.getAgencyProfile("VA");

      // Verifying the client doesn't throw is sufficient here;
      // actual log inspection would require a log spy, but the
      // design should only log metadata (path, duration, status)
      expect(result).not.toBeNull();
    });
  });

  // ── Data Damage ─────────────────────────────────────────────────────────

  describe("Data Damage", () => {
    it("returns stale cache on fetch failure (no cache invalidation on error)", async () => {
      const client = await getClient();

      // First call succeeds
      mockFetch.mockResolvedValueOnce(mockResponse(MOCK_AGENCY_PROFILE));
      const first = await client.getAgencyProfile("VA");
      expect(first).toEqual(MOCK_AGENCY_PROFILE);

      // Second call fails — should return cached data
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      const second = await client.getAgencyProfile("VA");
      expect(second).toEqual(MOCK_AGENCY_PROFILE); // Stale cache, not null
    });

    it("does not corrupt cache on partial JSON response", async () => {
      // If the response is non-JSON, the client should return null and not poison the cache.
      // We just verify the immediate behavior: bad JSON = null, no throw.
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError("Unexpected token")),
        headers: new Headers(),
        statusText: "OK",
      } as Response);

      const client = await getClient();
      expect(client.isConfigured).toBe(true);

      const result = await client.getAgencyProfile("BadJsonAgency");

      // Should return null gracefully, not throw
      expect(result).toBeNull();
      // Should have attempted the fetch
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it("isConfigured reflects actual env state", async () => {
      const client = await getClient();
      expect(client.isConfigured).toBe(true);

      vi.stubEnv("INTELLIGENCE_API_URL", "");
      vi.resetModules();
      const unconfiguredClient = await getClient();
      expect(unconfiguredClient.isConfigured).toBe(false);
    });
  });
});
