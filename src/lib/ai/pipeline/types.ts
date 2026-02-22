import type { WinStrategyData } from "@/types/outcomes";
import type {
  OutcomeContract,
  CompanyContext,
  ProductContext,
  EvidenceLibraryEntry,
  CompanyInfo,
  TeamMember,
} from "@/types/idd";
import type { BrandVoice } from "../persuasion";
import type { getIndustryConfig } from "../industry-configs";

// L1 Context: Company Truth
export interface L1Context {
  companyContext: CompanyContext[];
  productContexts: ProductContext[];
  evidenceLibrary: EvidenceLibraryEntry[];
  teamMembers: TeamMember[];
}

export interface SectionConfig {
  type: string;
  title: string;
  order: number;
  buildPrompt: (
    intakeData: Record<string, unknown>,
    analysis: string,
    retrievedContext: string,
    winStrategy?: WinStrategyData | null,
    companyInfo?: CompanyInfo,
    l1Context?: string,
  ) => string;
  searchQuery: (
    intakeData: Record<string, unknown>,
    winStrategy?: WinStrategyData | null,
  ) => string;
}

// ── Shared Pipeline Context ──────────────────────────────────────────────────

/**
 * Everything needed by both generateProposal and regenerateSection.
 * Extracted to eliminate ~80 lines of duplication between the two functions.
 */
export interface PipelineContext {
  proposal: Record<string, unknown>;
  organizationId: string;
  intakeData: Record<string, unknown>;
  winStrategy: WinStrategyData | null;
  outcomeContract: OutcomeContract | null;
  companyInfo: CompanyInfo;
  brandVoice: BrandVoice | null;
  primaryBrandName: string | undefined;
  audienceProfile: { tech_level?: string; evaluator?: string; size?: string } | undefined;
  systemPrompt: string;
  enhancedAnalysis: string;
  l1ContextString: string;
  rawL1Context: L1Context;
  serviceLine: string | undefined;
  industry: string | undefined;
  industryConfig: ReturnType<typeof getIndustryConfig>;
}
