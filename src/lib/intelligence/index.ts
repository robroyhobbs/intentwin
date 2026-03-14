/**
 * Intelligence Service integration.
 *
 * Public API for consuming procurement intelligence in the IntentBid pipeline.
 */

export { intelligenceClient, getIntelligenceClient } from "./client";
export { buildOpportunityProposalPrefill } from "./opportunity-prefill";
export {
  buildIntelligenceContext,
  buildWinProbabilityContext,
  buildCompetitiveLandscapeContext,
  buildPricingSuggestionsContext,
  buildAgencySectionContext,
} from "./context-builder";
export type {
  AgencyProfileResponse,
  PricingLookupResponse,
  RateBenchmark,
  AwardsSearchResponse,
  AwardRecord,
  ProposalIntelligence,
  WinProbabilityResponse,
  CompetitiveLandscapeResponse,
  OpportunityMatchProfile,
  OpportunityMatchesParams,
  OpportunityMatchBreakdown,
  OpportunityMatch,
  OpportunityMatchFeedbackStatus,
  OpportunityMatchFeedback,
  OpportunityMatchesResponse,
  DashboardStatsResponse,
  NaicsListItem,
  NaicsListResponse,
  NaicsIntelligenceResponse,
  AgencyListItem,
  AgencyListResponse,
} from "./types";
export type {
  IntelligenceService,
  PricingRatesParams,
  AwardsSearchParams,
  WinProbabilityParams,
  CompetitiveLandscapeParams,
  ProposalIntelligenceParams,
} from "./contracts";
