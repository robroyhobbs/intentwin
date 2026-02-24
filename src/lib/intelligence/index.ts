/**
 * Intelligence Service integration.
 *
 * Public API for consuming procurement intelligence in the IntentBid pipeline.
 */

export { intelligenceClient } from "./client";
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
  DashboardStatsResponse,
  NaicsListItem,
  NaicsListResponse,
  NaicsIntelligenceResponse,
  AgencyListItem,
  AgencyListResponse,
} from "./types";
