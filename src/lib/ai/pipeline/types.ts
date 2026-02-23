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
import type { ProposalIntelligence } from "@/lib/intelligence";
import type { BidEvaluation } from "../bid-scoring";

// ── RFP Task Structure Types ─────────────────────────────────────────────────

export const TASK_CATEGORIES = [
  "technical",
  "staffing",
  "management",
  "support-operations",
  "compliance-security",
  "transition-onboarding",
  "training",
  "reporting-analytics",
  "quality-assurance",
  "infrastructure",
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export interface RfpTask {
  task_number: string;
  title: string;
  description: string;
  category: TaskCategory;
  parent_task_number: string | null;
}

export interface RfpTaskStructure {
  tasks: RfpTask[];
  extracted_at: string; // ISO timestamp
}

const taskCategorySet = new Set<string>(TASK_CATEGORIES);

/** Runtime validator for RfpTask objects (e.g., from AI JSON output) */
export function isValidRfpTask(obj: unknown): obj is RfpTask {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.task_number === "string" &&
    typeof o.title === "string" &&
    typeof o.description === "string" &&
    typeof o.category === "string" &&
    taskCategorySet.has(o.category) &&
    (o.parent_task_number === null || typeof o.parent_task_number === "string")
  );
}

/** Runtime validator for RfpTaskStructure objects */
export function isValidRfpTaskStructure(obj: unknown): obj is RfpTaskStructure {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  if (typeof o.extracted_at !== "string") return false;
  if (!Array.isArray(o.tasks)) return false;
  return o.tasks.every((t: unknown) => isValidRfpTask(t));
}

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
  /** Present only on rfp_task sections — carries per-task metadata */
  taskMeta?: {
    task_number: string;
    title: string;
    description: string;
    category: TaskCategory;
    parent_task_number: string | null;
  };
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
  /** External procurement intelligence (null if service unavailable or unconfigured) */
  intelligence: ProposalIntelligence | null;
  /** Bid evaluation scores from intake (null if not scored) */
  bidEvaluation: BidEvaluation | null;
  /** Agency evaluation guidance for section generation (empty string if no intelligence) */
  agencyContext: string;
  /** Pricing benchmark suggestions for cost/pricing sections (empty string if no intelligence) */
  pricingContext: string;
}
