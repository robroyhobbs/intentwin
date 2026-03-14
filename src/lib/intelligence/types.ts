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

// ── Win Probability ──────────────────────────────────────────────────────────

export interface WinProbabilityResponse {
  probability: number; // 0-1
  confidence: "high" | "medium" | "low";
  matching_awards: number;
  factors: {
    name: string;
    impact: number; // positive = helps, negative = hurts
    description: string;
  }[];
  comparable_awards: {
    title: string;
    agency: string;
    awardee: string;
    amount: number;
    date: string;
    competition_type: string;
  }[];
  meta: {
    agency_match: boolean;
    naics_match: boolean;
    data_freshness: string;
  };
}

// ── Competitive Landscape ────────────────────────────────────────────────────

export interface CompetitiveLandscapeResponse {
  total_similar_awards: number;
  top_competitors: {
    name: string;
    wins: number;
    total_value: number;
    avg_value: number;
    most_recent_win: string;
  }[];
  avg_award_amount: number | null;
  median_award_amount: number | null;
  avg_offers: number | null;
  competition_mix: Record<string, number>;
  set_aside_mix: Record<string, number>;
  recent_winners: {
    title: string;
    agency: string;
    awardee: string;
    amount: number;
    date: string;
    naics: string;
    competition_type: string;
  }[];
  query: {
    agency: string | null;
    naics_code: string | null;
  };
}

// ── Opportunity Search ───────────────────────────────────────────────────────

export interface OpportunitySearchResponse {
  opportunities: OpportunityRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface OpportunityRecord {
  id: string;
  source: string;
  source_id: string;
  title: string;
  description: string | null;
  agency: string;
  jurisdiction: string | null;
  city: string | null;
  state: string | null;
  agency_level: "federal" | "state" | "local";
  naics_code: string | null;
  native_category_code: string | null;
  native_category_name: string | null;
  posted_date: string | null;
  response_deadline: string | null;
  estimated_value: number | null;
  set_aside_type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  portal_url: string | null;
  status: "open" | "closed" | "awarded" | "cancelled";
}

export interface OpportunityStatsResponse {
  total_opportunities: number;
  by_status: Record<string, number>;
  by_source: Record<string, number>;
  by_state: Record<string, number>;
}

// ── Opportunity Matching ────────────────────────────────────────────────────

export interface OpportunityMatchProfile {
  naics_codes?: string[];
  service_lines?: string[];
  capability_keywords?: string[];
  certifications?: string[];
  preferred_states?: string[];
  preferred_cities?: string[];
  eligible_set_asides?: string[];
}

export interface OpportunityMatchesParams {
  profile: OpportunityMatchProfile;
  filters?: {
    source?: string;
    agency_level?: "local" | "state" | "federal";
    naics_codes?: string[];
    city?: string;
    state?: string;
    q?: string;
    deadline_after?: string;
    deadline_before?: string;
    posted_after?: string;
  };
  limit?: number;
}

export interface OpportunityMatchBreakdown {
  naics: number;
  capabilities: number;
  geography: number;
  certifications: number;
  set_aside: number;
  deadline: number;
}

export interface OpportunityMatch {
  opportunity_id: string;
  score: number;
  confidence: "high" | "medium" | "low";
  breakdown: OpportunityMatchBreakdown;
  reasons: string[];
  risks: string[];
  opportunity: OpportunityRecord;
}

export type OpportunityMatchFeedbackStatus = "saved" | "dismissed";

export interface OpportunityMatchFeedback {
  opportunity_id: string;
  status: OpportunityMatchFeedbackStatus;
  updated_at: string;
}

export interface OpportunityMatchesResponse {
  matches: OpportunityMatch[];
  total_candidates: number;
  limit: number;
}

// ── Composite: Proposal Intelligence Bundle ──────────────────────────────────

export interface ProposalIntelligence {
  agency: AgencyProfileResponse | null;
  pricing: PricingLookupResponse | null;
  recentAwards: AwardRecord[];
  totalMatchingAwards: number;
  competitiveLandscape: CompetitiveLandscapeResponse | null;
  fetchedAt: string;
  fetchDurationMs: number;
}
