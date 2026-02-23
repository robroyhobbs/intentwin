import { describe, it, expect } from "vitest";
import {
  buildIntelligenceContext,
  buildWinProbabilityContext,
  buildCompetitiveLandscapeContext,
  buildPricingSuggestionsContext,
  buildAgencySectionContext,
} from "../context-builder";
import type {
  AgencyProfileResponse,
  PricingLookupResponse,
  WinProbabilityResponse,
  CompetitiveLandscapeResponse,
} from "../types";

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

// ═══════════════════════════════════════════════════════════════════════════════
// Win Probability Context Builder Tests
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_WIN_PROB: WinProbabilityResponse = {
  probability: 0.35,
  confidence: "medium",
  matching_awards: 47,
  factors: [
    { name: "Full & open competition", impact: 0.12, description: "Historically increases win rate" },
    { name: "Small business set-aside", impact: 0.08, description: "Favorable for small businesses" },
    { name: "High competition", impact: -0.05, description: "Agency averages 5+ offers" },
  ],
  comparable_awards: [
    {
      title: "IT Support Services",
      agency: "VA",
      awardee: "Tech Solutions Inc",
      amount: 3000000,
      date: "2025-10-15",
      competition_type: "full",
    },
  ],
  meta: {
    agency_match: true,
    naics_match: true,
    data_freshness: "2026-02-01",
  },
};

describe("buildWinProbabilityContext", () => {
  describe("Happy Path", () => {
    it("includes probability percentage and confidence", () => {
      const result = buildWinProbabilityContext(MOCK_WIN_PROB);

      expect(result).toContain("35%");
      expect(result).toContain("medium");
      expect(result).toContain("47 similar historical awards");
    });

    it("includes helping factors with positive impact", () => {
      const result = buildWinProbabilityContext(MOCK_WIN_PROB);

      expect(result).toContain("Factors that help");
      expect(result).toContain("Full & open competition");
      expect(result).toContain("+12%");
      expect(result).toContain("Small business set-aside");
      expect(result).toContain("+8%");
    });

    it("includes hurting factors with negative impact", () => {
      const result = buildWinProbabilityContext(MOCK_WIN_PROB);

      expect(result).toContain("Factors that hurt");
      expect(result).toContain("High competition");
      expect(result).toContain("-5%");
    });

    it("includes comparable awards count", () => {
      const result = buildWinProbabilityContext(MOCK_WIN_PROB);

      expect(result).toContain("1 comparable awards found");
    });
  });

  describe("Edge Cases", () => {
    it("handles zero probability", () => {
      const prob: WinProbabilityResponse = {
        ...MOCK_WIN_PROB,
        probability: 0,
        matching_awards: 5,
      };
      const result = buildWinProbabilityContext(prob);

      expect(result).toContain("0%");
    });

    it("handles 100% probability", () => {
      const prob: WinProbabilityResponse = {
        ...MOCK_WIN_PROB,
        probability: 1.0,
      };
      const result = buildWinProbabilityContext(prob);

      expect(result).toContain("100%");
    });

    it("handles no factors", () => {
      const prob: WinProbabilityResponse = {
        ...MOCK_WIN_PROB,
        factors: [],
      };
      const result = buildWinProbabilityContext(prob);

      expect(result).not.toContain("Factors that help");
      expect(result).not.toContain("Factors that hurt");
    });

    it("handles no comparable awards", () => {
      const prob: WinProbabilityResponse = {
        ...MOCK_WIN_PROB,
        comparable_awards: [],
      };
      const result = buildWinProbabilityContext(prob);

      expect(result).not.toContain("comparable awards found");
    });

    it("handles only hurting factors", () => {
      const prob: WinProbabilityResponse = {
        ...MOCK_WIN_PROB,
        factors: [{ name: "High competition", impact: -0.1, description: "Too many bidders" }],
      };
      const result = buildWinProbabilityContext(prob);

      expect(result).not.toContain("Factors that help");
      expect(result).toContain("Factors that hurt");
    });
  });

  describe("Data Damage", () => {
    it("is a pure function — same inputs produce same output", () => {
      const r1 = buildWinProbabilityContext(MOCK_WIN_PROB);
      const r2 = buildWinProbabilityContext(MOCK_WIN_PROB);
      expect(r1).toBe(r2);
    });

    it("does not mutate input", () => {
      const copy = JSON.parse(JSON.stringify(MOCK_WIN_PROB));
      buildWinProbabilityContext(MOCK_WIN_PROB);
      expect(MOCK_WIN_PROB).toEqual(copy);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Competitive Landscape Context Builder Tests
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_LANDSCAPE: CompetitiveLandscapeResponse = {
  total_similar_awards: 42,
  top_competitors: [
    { name: "Acme Corp", wins: 8, total_value: 24000000, avg_value: 3000000, most_recent_win: "2025-12-01" },
    { name: "Beta Solutions", wins: 5, total_value: 15000000, avg_value: 3000000, most_recent_win: "2025-11-15" },
  ],
  avg_award_amount: 3500000,
  median_award_amount: 2800000,
  avg_offers: 4.5,
  competition_mix: { "Full and Open": 30, "Sole Source": 8 },
  set_aside_mix: { "Small Business": 10 },
  recent_winners: [],
  query: { agency: "VA", naics_code: "541511" },
};

describe("buildCompetitiveLandscapeContext", () => {
  describe("Happy Path", () => {
    it("includes total similar awards", () => {
      const result = buildCompetitiveLandscapeContext(MOCK_LANDSCAPE);

      expect(result).toContain("42");
      expect(result).toContain("## Competitive Landscape");
    });

    it("includes average award amount", () => {
      const result = buildCompetitiveLandscapeContext(MOCK_LANDSCAPE);

      expect(result).toContain("$3,500,000");
    });

    it("includes average offers", () => {
      const result = buildCompetitiveLandscapeContext(MOCK_LANDSCAPE);

      expect(result).toContain("4.5");
    });

    it("includes top competitors with wins and values", () => {
      const result = buildCompetitiveLandscapeContext(MOCK_LANDSCAPE);

      expect(result).toContain("Acme Corp");
      expect(result).toContain("8 wins");
      expect(result).toContain("Beta Solutions");
      expect(result).toContain("5 wins");
    });

    it("includes competition type breakdown", () => {
      const result = buildCompetitiveLandscapeContext(MOCK_LANDSCAPE);

      expect(result).toContain("Full and Open");
      expect(result).toContain("30 awards");
      expect(result).toContain("Sole Source");
      expect(result).toContain("8 awards");
    });
  });

  describe("Edge Cases", () => {
    it("handles null average award amount", () => {
      const landscape: CompetitiveLandscapeResponse = {
        ...MOCK_LANDSCAPE,
        avg_award_amount: null,
      };
      const result = buildCompetitiveLandscapeContext(landscape);

      expect(result).not.toContain("Average award amount");
    });

    it("handles null average offers", () => {
      const landscape: CompetitiveLandscapeResponse = {
        ...MOCK_LANDSCAPE,
        avg_offers: null,
      };
      const result = buildCompetitiveLandscapeContext(landscape);

      expect(result).not.toContain("Average competing offers");
    });

    it("handles no competitors", () => {
      const landscape: CompetitiveLandscapeResponse = {
        ...MOCK_LANDSCAPE,
        top_competitors: [],
      };
      const result = buildCompetitiveLandscapeContext(landscape);

      expect(result).not.toContain("Top competitors");
    });

    it("handles empty competition mix", () => {
      const landscape: CompetitiveLandscapeResponse = {
        ...MOCK_LANDSCAPE,
        competition_mix: {},
      };
      const result = buildCompetitiveLandscapeContext(landscape);

      expect(result).not.toContain("Competition type breakdown");
    });

    it("limits competitors to top 5", () => {
      const landscape: CompetitiveLandscapeResponse = {
        ...MOCK_LANDSCAPE,
        top_competitors: Array.from({ length: 10 }, (_, i) => ({
          name: `Company ${i}`,
          wins: 10 - i,
          total_value: 1000000 * (10 - i),
          avg_value: 1000000,
          most_recent_win: "2025-12-01",
        })),
      };
      const result = buildCompetitiveLandscapeContext(landscape);

      expect(result).toContain("Company 0");
      expect(result).toContain("Company 4");
      expect(result).not.toContain("Company 5");
    });
  });

  describe("Data Damage", () => {
    it("is a pure function — same inputs produce same output", () => {
      const r1 = buildCompetitiveLandscapeContext(MOCK_LANDSCAPE);
      const r2 = buildCompetitiveLandscapeContext(MOCK_LANDSCAPE);
      expect(r1).toBe(r2);
    });

    it("does not mutate input", () => {
      const copy = JSON.parse(JSON.stringify(MOCK_LANDSCAPE));
      buildCompetitiveLandscapeContext(MOCK_LANDSCAPE);
      expect(MOCK_LANDSCAPE).toEqual(copy);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Pricing Suggestions Context Builder Tests (Stream A: Deeper Pipeline)
// ═══════════════════════════════════════════════════════════════════════════════

describe("buildPricingSuggestionsContext", () => {
  describe("Happy Path", () => {
    it("formats rate benchmarks with Market Rate label for matching labor categories", () => {
      const result = buildPricingSuggestionsContext(MOCK_PRICING, [
        "Software Developer",
        "Project Manager",
      ]);

      expect(result).toContain("## Pricing Benchmarks (GSA CALC+ Data)");
      expect(result).toContain("Software Developer");
      expect(result).toContain("Market Rate: $158/hr");
      expect(result).toContain("Project Manager");
      expect(result).toContain("Market Rate: $142/hr");
    });

    it("includes GSA source attribution", () => {
      const result = buildPricingSuggestionsContext(MOCK_PRICING, [
        "Software Developer",
      ]);

      expect(result).toContain("GSA CALC+");
    });

    it("includes rate range when available", () => {
      const result = buildPricingSuggestionsContext(MOCK_PRICING, [
        "Software Developer",
      ]);

      expect(result).toContain("$98");
      expect(result).toContain("$245");
    });

    it("includes data points count", () => {
      const result = buildPricingSuggestionsContext(MOCK_PRICING, [
        "Software Developer",
      ]);

      expect(result).toContain("127 data points");
    });

    it("includes cost realism notes when available", () => {
      const result = buildPricingSuggestionsContext(MOCK_PRICING, [
        "Software Developer",
      ]);

      expect(result).toContain("GSA rates represent ceiling prices");
    });
  });

  describe("Bad Path", () => {
    it("returns empty string when pricing is null", () => {
      const result = buildPricingSuggestionsContext(null, ["Software Developer"]);
      expect(result).toBe("");
    });

    it("returns empty string when labor categories is empty", () => {
      const result = buildPricingSuggestionsContext(MOCK_PRICING, []);
      expect(result).toBe("");
    });

    it("returns empty string when no benchmarks have valid median", () => {
      const pricing: PricingLookupResponse = {
        ...MOCK_PRICING,
        rate_benchmarks: [
          {
            category: "Unknown Role",
            gsa_median: null,
            gsa_range: null,
            bid_tab_median: null,
            competitive_range: null,
            data_points: 0,
            effective_date: null,
          },
        ],
      };
      const result = buildPricingSuggestionsContext(pricing, ["Unknown Role"]);
      expect(result).toBe("");
    });
  });

  describe("Edge Cases", () => {
    it("only includes benchmarks for labor categories that exist in the pricing data", () => {
      const result = buildPricingSuggestionsContext(MOCK_PRICING, [
        "Software Developer",
        "Data Scientist", // not in MOCK_PRICING
      ]);

      expect(result).toContain("Software Developer");
      expect(result).not.toContain("Data Scientist");
    });

    it("handles case-insensitive category matching", () => {
      const result = buildPricingSuggestionsContext(MOCK_PRICING, [
        "software developer",
      ]);

      // Should still match "Software Developer" from pricing data
      expect(result).toContain("Software Developer");
      expect(result).toContain("Market Rate: $158/hr");
    });

    it("handles benchmark with no range", () => {
      const pricing: PricingLookupResponse = {
        ...MOCK_PRICING,
        rate_benchmarks: [
          {
            category: "Analyst",
            gsa_median: 100,
            gsa_range: null,
            bid_tab_median: null,
            competitive_range: null,
            data_points: 10,
            effective_date: null,
          },
        ],
      };
      const result = buildPricingSuggestionsContext(pricing, ["Analyst"]);

      expect(result).toContain("Market Rate: $100/hr");
      expect(result).not.toContain("Range:");
    });
  });

  describe("Data Damage", () => {
    it("is a pure function — same inputs produce same output", () => {
      const r1 = buildPricingSuggestionsContext(MOCK_PRICING, ["Software Developer"]);
      const r2 = buildPricingSuggestionsContext(MOCK_PRICING, ["Software Developer"]);
      expect(r1).toBe(r2);
    });

    it("does not mutate inputs", () => {
      const pricingCopy = JSON.parse(JSON.stringify(MOCK_PRICING));
      const categories = ["Software Developer"];
      const categoriesCopy = [...categories];

      buildPricingSuggestionsContext(MOCK_PRICING, categories);

      expect(MOCK_PRICING).toEqual(pricingCopy);
      expect(categories).toEqual(categoriesCopy);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Agency Section Context Builder Tests (Stream A: Deeper Pipeline)
// ═══════════════════════════════════════════════════════════════════════════════

describe("buildAgencySectionContext", () => {
  describe("Happy Path", () => {
    it("includes eval method guidance", () => {
      const result = buildAgencySectionContext(MOCK_AGENCY);

      expect(result).toContain("## Agency Evaluation Guidance");
      expect(result).toContain("tradeoff");
    });

    it("includes criteria weights as guidance", () => {
      const result = buildAgencySectionContext(MOCK_AGENCY);

      expect(result).toContain("technical");
      expect(result).toContain("45%");
      expect(result).toContain("past_performance");
      expect(result).toContain("30%");
    });

    it("includes common contract types", () => {
      const result = buildAgencySectionContext(MOCK_AGENCY);

      expect(result).toContain("FFP");
      expect(result).toContain("T&M");
    });

    it("includes competition level from avg_num_offers", () => {
      const result = buildAgencySectionContext(MOCK_AGENCY);

      expect(result).toContain("5.2");
    });

    it("frames information as guidance for LLM", () => {
      const result = buildAgencySectionContext(MOCK_AGENCY);

      expect(result).toContain("typically evaluates");
    });
  });

  describe("Bad Path", () => {
    it("returns empty string when agency is null", () => {
      const result = buildAgencySectionContext(null);
      expect(result).toBe("");
    });
  });

  describe("Edge Cases", () => {
    it("handles agency with no eval method", () => {
      const agency: AgencyProfileResponse = {
        ...MOCK_AGENCY,
        preferred_eval_method: null,
      };
      const result = buildAgencySectionContext(agency);

      expect(result).not.toContain("typically evaluates using");
    });

    it("handles agency with no criteria weights", () => {
      const agency: AgencyProfileResponse = {
        ...MOCK_AGENCY,
        typical_criteria_weights: null,
      };
      const result = buildAgencySectionContext(agency);

      expect(result).not.toContain("Evaluation criteria emphasis");
    });

    it("handles agency with no common contract types", () => {
      const agency: AgencyProfileResponse = {
        ...MOCK_AGENCY,
        common_contract_types: null,
      };
      const result = buildAgencySectionContext(agency);

      expect(result).not.toContain("Common contract types");
    });

    it("handles agency with no avg offers", () => {
      const agency: AgencyProfileResponse = {
        ...MOCK_AGENCY,
        avg_num_offers: null,
      };
      const result = buildAgencySectionContext(agency);

      expect(result).not.toContain("Average competing offers");
    });

    it("handles agency with all null optional fields", () => {
      const agency: AgencyProfileResponse = {
        agency_name: "Minimal Agency",
        agency_level: "federal",
        preferred_eval_method: null,
        typical_criteria_weights: null,
        avg_num_offers: null,
        total_awards_tracked: 0,
        avg_award_amount: null,
        common_contract_types: null,
        protest_insights: null,
        recent_awards: [],
      };
      const result = buildAgencySectionContext(agency);

      // Should still have the header with agency name
      expect(result).toContain("Minimal Agency");
      expect(result).toContain("## Agency Evaluation Guidance");
    });
  });

  describe("Data Damage", () => {
    it("is a pure function — same inputs produce same output", () => {
      const r1 = buildAgencySectionContext(MOCK_AGENCY);
      const r2 = buildAgencySectionContext(MOCK_AGENCY);
      expect(r1).toBe(r2);
    });

    it("does not mutate input", () => {
      const copy = JSON.parse(JSON.stringify(MOCK_AGENCY));
      buildAgencySectionContext(MOCK_AGENCY);
      expect(MOCK_AGENCY).toEqual(copy);
    });
  });
});
