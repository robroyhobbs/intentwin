import type {
  AgencyProfileResponse,
  PricingLookupResponse,
  AwardsSearchResponse,
  ProposalIntelligence,
  WinProbabilityResponse,
  CompetitiveLandscapeResponse,
  OpportunityMatchesParams,
  OpportunityMatchesResponse,
} from "./types";

export interface AgencyProfileParams {
  agencyName: string;
}

export interface PricingRatesParams {
  categories: string[];
  businessSize?: "small" | "large";
  naicsCode?: string;
}

export interface AwardsSearchParams {
  agency?: string;
  naicsCode?: string;
  competitionType?: string;
  limit?: number;
}

export interface WinProbabilityParams {
  agency?: string;
  naicsCode?: string;
  awardAmount?: number;
  competitionType?: string;
  setAsideType?: string;
  businessSize?: "small" | "large";
}

export interface CompetitiveLandscapeParams {
  agency?: string;
  naicsCode?: string;
}

export interface ProposalIntelligenceParams {
  agencyName: string | null;
  naicsCode: string | null;
  laborCategories?: string[];
}

export interface IntelligenceService {
  readonly isConfigured: boolean;
  getAgencyProfile(agencyName: AgencyProfileParams["agencyName"]): Promise<AgencyProfileResponse | null>;
  getPricingRates(params: PricingRatesParams): Promise<PricingLookupResponse | null>;
  searchAwards(params: AwardsSearchParams): Promise<AwardsSearchResponse | null>;
  getOpportunityMatches(params: OpportunityMatchesParams): Promise<OpportunityMatchesResponse | null>;
  getWinProbability(params: WinProbabilityParams): Promise<WinProbabilityResponse | null>;
  getCompetitiveLandscape(params: CompetitiveLandscapeParams): Promise<CompetitiveLandscapeResponse | null>;
  getProposalIntelligence(params: ProposalIntelligenceParams): Promise<ProposalIntelligence | null>;
}
