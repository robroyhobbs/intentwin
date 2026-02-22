import { describe, it, expect } from "vitest";
import { buildIntelligenceContext } from "../context-builder";
import type { AgencyProfileResponse, PricingLookupResponse } from "../types";

// ═══════════════════════════════════════════════════════════════════════════════
// Intelligence Context Builder Tests — TDD
//
// Tests the prompt-building logic that converts intelligence data into
// strings injected into LLM prompts. Pure functions, no mocking needed.
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_AGENCY: AgencyProfileResponse = {
  agency_name: "Department of Veterans Affairs",
  agency_level: "federal",
  preferred_eval_method: "tradeoff",
  typical_criteria_weights: { technical: 45, past_performance: 30, price: 25 },
  avg_num_offers: 5.2,
  total_awards_tracked: 23,
  avg_award_amount: 4200000,
  common_contract_types: ["FFP", "T&M"],
  protest_insights: ["Risk mitigation valued highly", "Evaluators cite specificity"],
  recent_awards: [],
};

const MOCK_PRICING: PricingLookupResponse = {
  rate_benchmarks: [
    {
      category: "Software Developer",
      gsa_median: 158,
      gsa_range: [98, 245],
      bid_tab_median: null,
      competitive_range: null,
      data_points: 127,
      effective_date: "2026-01-15",
    },
    {
      category: "Project Manager",
      gsa_median: 142,
      gsa_range: [89, 220],
      bid_tab_median: null,
      competitive_range: null,
      data_points: 95,
      effective_date: "2026-01-15",
    },
  ],
  pricing_model_patterns: [
    { model: "FFP", frequency_pct: 65 },
    { model: "T&M", frequency_pct: 25 },
  ],
  cost_realism_notes: [
    "GSA rates represent ceiling prices; actual rates may be lower.",
    "Rates vary significantly by geographic area.",
  ],
};

describe("buildIntelligenceContext", () => {
  // ── Happy Path ────────────────────────────────────────────────────────

  describe("Happy Path", () => {
    it("builds context with both agency and pricing data", () => {
      const result = buildIntelligenceContext(MOCK_AGENCY, MOCK_PRICING);

      expect(result).toContain("## Agency Intelligence");
      expect(result).toContain("Department of Veterans Affairs");
      expect(result).toContain("tradeoff");
      expect(result).toContain("technical: 45%");
      expect(result).toContain("past_performance: 30%");
      expect(result).toContain("5.2");
      expect(result).toContain("23 tracked awards");

      expect(result).toContain("## Pricing Intelligence");
      expect(result).toContain("Software Developer");
      expect(result).toContain("$158/hr");
      expect(result).toContain("$98-$245");
      expect(result).toContain("127 data points");
      expect(result).toContain("Project Manager");
      expect(result).toContain("$142/hr");
    });

    it("builds context with agency data only", () => {
      const result = buildIntelligenceContext(MOCK_AGENCY, null);

      expect(result).toContain("## Agency Intelligence");
      expect(result).toContain("Department of Veterans Affairs");
      expect(result).not.toContain("## Pricing Intelligence");
    });

    it("builds context with pricing data only", () => {
      const result = buildIntelligenceContext(null, MOCK_PRICING);

      expect(result).not.toContain("## Agency Intelligence");
      expect(result).toContain("## Pricing Intelligence");
      expect(result).toContain("Software Developer");
    });

    it("includes protest insights when available", () => {
      const result = buildIntelligenceContext(MOCK_AGENCY, null);

      expect(result).toContain("Risk mitigation valued highly");
      expect(result).toContain("Evaluators cite specificity");
    });

    it("includes cost realism notes", () => {
      const result = buildIntelligenceContext(null, MOCK_PRICING);

      expect(result).toContain("GSA rates represent ceiling prices");
      expect(result).toContain("Rates vary significantly");
    });

    it("includes average award amount", () => {
      const result = buildIntelligenceContext(MOCK_AGENCY, null);

      expect(result).toContain("$4,200,000");
    });
  });

  // ── Bad Path ──────────────────────────────────────────────────────────

  describe("Bad Path", () => {
    it("returns empty string when both inputs are null", () => {
      const result = buildIntelligenceContext(null, null);
      expect(result).toBe("");
    });

    it("handles agency with no criteria weights", () => {
      const agency: AgencyProfileResponse = {
        ...MOCK_AGENCY,
        typical_criteria_weights: null,
      };
      const result = buildIntelligenceContext(agency, null);

      expect(result).toContain("Department of Veterans Affairs");
      expect(result).not.toContain("Typical evaluation weights");
    });

    it("handles agency with no eval method", () => {
      const agency: AgencyProfileResponse = {
        ...MOCK_AGENCY,
        preferred_eval_method: null,
      };
      const result = buildIntelligenceContext(agency, null);

      expect(result).not.toContain("Preferred evaluation method");
    });

    it("handles pricing with no rate data", () => {
      const pricing: PricingLookupResponse = {
        rate_benchmarks: [],
        pricing_model_patterns: [],
        cost_realism_notes: [],
      };
      const result = buildIntelligenceContext(null, pricing);

      // Should not include pricing section if there are no benchmarks
      expect(result).toBe("");
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────

  describe("Edge Cases", () => {
    it("handles rate benchmark with null median", () => {
      const pricing: PricingLookupResponse = {
        ...MOCK_PRICING,
        rate_benchmarks: [
          {
            category: "Data Scientist",
            gsa_median: null,
            gsa_range: null,
            bid_tab_median: null,
            competitive_range: null,
            data_points: 0,
            effective_date: null,
          },
        ],
      };
      const result = buildIntelligenceContext(null, pricing);

      // Should not include benchmarks with no data
      expect(result).not.toContain("Data Scientist");
    });

    it("handles agency with zero awards tracked", () => {
      const agency: AgencyProfileResponse = {
        ...MOCK_AGENCY,
        total_awards_tracked: 0,
      };
      const result = buildIntelligenceContext(agency, null);

      expect(result).not.toContain("tracked awards");
    });

    it("handles agency with no protest insights", () => {
      const agency: AgencyProfileResponse = {
        ...MOCK_AGENCY,
        protest_insights: null,
      };
      const result = buildIntelligenceContext(agency, null);

      expect(result).not.toContain("protest");
    });

    it("handles rate with range but no median", () => {
      const pricing: PricingLookupResponse = {
        ...MOCK_PRICING,
        rate_benchmarks: [
          {
            category: "Engineer",
            gsa_median: null,
            gsa_range: [100, 200],
            bid_tab_median: null,
            competitive_range: null,
            data_points: 50,
            effective_date: null,
          },
        ],
      };
      const result = buildIntelligenceContext(null, pricing);

      // No median → skip this benchmark
      expect(result).not.toContain("Engineer");
    });
  });

  // ── Security ──────────────────────────────────────────────────────────

  describe("Security", () => {
    it("does not include raw data or internal IDs in the context string", () => {
      const result = buildIntelligenceContext(MOCK_AGENCY, MOCK_PRICING);

      // Should not contain database IDs or internal references
      expect(result).not.toContain("uuid");
      expect(result).not.toContain("supabase");
      expect(result).not.toContain("api_key");
    });
  });

  // ── Data Leak ─────────────────────────────────────────────────────────

  describe("Data Leak", () => {
    it("does not include awardee names in scoring context", () => {
      // Awardee names from recent awards should NOT be in the scoring context
      // (to avoid the LLM recommending specific companies)
      const agency: AgencyProfileResponse = {
        ...MOCK_AGENCY,
        recent_awards: [
          {
            title: "Cloud Migration",
            awardee: "Competitor Corp",
            amount: 5000000,
            date: "2025-12-01",
            naics: "541511",
          },
        ],
      };
      const result = buildIntelligenceContext(agency, null);

      expect(result).not.toContain("Competitor Corp");
    });
  });

  // ── Data Damage ───────────────────────────────────────────────────────

  describe("Data Damage", () => {
    it("is a pure function — same inputs always produce same output", () => {
      const result1 = buildIntelligenceContext(MOCK_AGENCY, MOCK_PRICING);
      const result2 = buildIntelligenceContext(MOCK_AGENCY, MOCK_PRICING);

      expect(result1).toBe(result2);
    });

    it("does not mutate input objects", () => {
      const agencyCopy = JSON.parse(JSON.stringify(MOCK_AGENCY));
      const pricingCopy = JSON.parse(JSON.stringify(MOCK_PRICING));

      buildIntelligenceContext(MOCK_AGENCY, MOCK_PRICING);

      expect(MOCK_AGENCY).toEqual(agencyCopy);
      expect(MOCK_PRICING).toEqual(pricingCopy);
    });
  });
});
