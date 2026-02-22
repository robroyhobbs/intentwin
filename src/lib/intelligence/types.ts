/**
 * Intelligence Service API response types.
 *
 * These mirror the contract defined in intentbid-intelligence/src/types/api.ts.
 * If the service API evolves, update these types to match.
 */

// ── Agency Intelligence ──────────────────────────────────────────────────────

export interface AgencyProfileResponse {
  agency_name: string;
  agency_level: "federal" | "state" | "local";
  preferred_eval_method: string | null;
  typical_criteria_weights: Record<string, number> | null;
  avg_num_offers: number | null;
  total_awards_tracked: number;
  avg_award_amount: number | null;
  common_contract_types: string[] | null;
  protest_insights: string[] | null;
  recent_awards: {
    title: string;
    awardee: string;
    amount: number;
    date: string;
    naics: string;
  }[];
}

// ── Pricing Intelligence ─────────────────────────────────────────────────────

export interface RateBenchmark {
  category: string;
  gsa_median: number | null;
  gsa_range: [number, number] | null;
  bid_tab_median: number | null;
  competitive_range: [number, number] | null;
  data_points: number;
  effective_date: string | null;
}

export interface PricingLookupResponse {
  rate_benchmarks: RateBenchmark[];
  pricing_model_patterns: {
    model: string;
    frequency_pct: number;
  }[];
  cost_realism_notes: string[];
}

// ── Awards Search ────────────────────────────────────────────────────────────

export interface AwardsSearchResponse {
  awards: AwardRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface AwardRecord {
  id: string;
  source: string;
  source_id: string | null;
  title: string | null;
  awarding_agency: string | null;
  agency_level: string | null;
  awardee_name: string | null;
  award_amount: number | null;
  contract_type: string | null;
  pricing_type: string | null;
  award_date: string | null;
  naics_code: string | null;
  psc_code: string | null;
  competition_type: string | null;
  num_offers_received: number | null;
  set_aside_type: string | null;
}

// ── Composite: Proposal Intelligence Bundle ──────────────────────────────────

export interface ProposalIntelligence {
  agency: AgencyProfileResponse | null;
  pricing: PricingLookupResponse | null;
  recentAwards: AwardRecord[];
  totalMatchingAwards: number;
  fetchedAt: string;
  fetchDurationMs: number;
}
