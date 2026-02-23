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
  description: string | null;
  awarding_agency: string | null;
  agency_level: string | null;
  awardee_name: string | null;
  awardee_id: string | null;
  award_amount: number | null;
  contract_type: string | null;
  pricing_type: string | null;
  award_date: string | null;
  period_of_performance_start: string | null;
  period_of_performance_end: string | null;
  naics_code: string | null;
  psc_code: string | null;
  competition_type: string | null;
  num_offers_received: number | null;
  set_aside_type: string | null;
  source_selection_method: string | null;
  solicitation_number: string | null;
  place_of_performance_state: string | null;
  place_of_performance_city: string | null;
}

// ── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStatsResponse {
  total_awards: number;
  total_labor_rates: number;
  total_agency_profiles: number;
  unique_naics_codes: number;
  top_agencies: { name: string; award_count: number; avg_amount: number | null }[];
  top_naics: { code: string; award_count: number; total_amount: number }[];
  competition_breakdown: Record<string, number>;
  set_aside_breakdown: Record<string, number>;
  awards_by_month: { month: string; count: number }[];
  last_updated: string;
}

// ── NAICS Intelligence ───────────────────────────────────────────────────────

export interface NaicsListItem {
  code: string;
  award_count: number;
  total_amount: number;
}

export interface NaicsListResponse {
  naics_codes: NaicsListItem[];
  total: number;
}

export interface NaicsIntelligenceResponse {
  naics_code: string;
  description: string | null;
  industry_config: {
    key: string;
    displayName: string;
    painPoints: string[];
    keywords: string[];
    priorities: string[];
    winThemes: string[];
    sectionGuidance: Record<string, string>;
  } | null;
  award_stats: {
    total_awards: number;
    avg_amount: number | null;
    common_agencies: string[];
    competition_breakdown: Record<string, number>;
  };
}

// ── Agency List ──────────────────────────────────────────────────────────────

export interface AgencyListItem {
  agency_name: string;
  agency_level: string;
  total_awards_tracked: number;
  avg_award_amount: number | null;
  preferred_eval_method: string | null;
  avg_num_offers: number | null;
  common_naics_codes: string[] | null;
}

export interface AgencyListResponse {
  agencies: AgencyListItem[];
  total: number;
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
