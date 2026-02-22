/**
 * Intelligence Service integration.
 *
 * Public API for consuming procurement intelligence in the IntentWin pipeline.
 */

export { intelligenceClient } from "./client";
export { buildIntelligenceContext } from "./context-builder";
export type {
  AgencyProfileResponse,
  PricingLookupResponse,
  RateBenchmark,
  AwardsSearchResponse,
  AwardRecord,
  ProposalIntelligence,
} from "./types";
