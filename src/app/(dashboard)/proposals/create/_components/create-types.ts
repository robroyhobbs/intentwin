import type { ExtractedIntake } from "@/types/intake";
import type { BidEvaluation } from "@/lib/ai/bid-scoring";
import type { ReadinessItem } from "./shared/readiness-checklist";

export type CreatePhase = "intake" | "strategy" | "draft" | "finalize";

export interface WinTheme {
  id: string;
  label: string;
  description: string;
  confirmed: boolean;
}

export interface SectionDraft {
  id: string;
  sectionType: string;
  title: string;
  content: string;
  generationStatus: "pending" | "generating" | "complete" | "failed";
  reviewed: boolean;
  order: number;
}

export interface Blocker {
  id: string;
  label: string;
  resolved: boolean;
  phase: CreatePhase;
}

export interface RiskFlag {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
}

/** A labeled key-value insight for the coach panel (e.g., confidence scores). */
export interface CoachInsight {
  id: string;
  label: string;
  value: string;
  detail?: string;
  severity?: "low" | "medium" | "high";
}

/** A suggested question or action prompt for the user. */
export interface CoachPrompt {
  id: string;
  question: string;
  importance: "critical" | "helpful" | "nice_to_have";
}

/** A specific capability gap identified from bid evaluation. */
export interface GapItem {
  id: string;
  factor: string;
  rationale: string;
  score: number;
}

/** A specific strength identified from bid evaluation. */
export interface StrengthItem {
  id: string;
  factor: string;
  rationale: string;
  score: number;
}

export interface CoachContent {
  whyItMatters: string;
  riskFlags: RiskFlag[];
  /** Detailed insights grouped by topic. */
  insights?: CoachInsight[];
  /** Gap-filling prompts suggesting what info the user should add. */
  prompts?: CoachPrompt[];
  /** Contextual directive text for the "Next Step" card. */
  nextStep?: string;
  /** Readiness checklist items (finalize phase only). */
  readinessItems?: ReadinessItem[];
  /** Go/no-go verdict from bid evaluation (strategy + finalize). */
  verdict?: "bid" | "evaluate" | "pass";
  /** Specific capability gaps (strategy + finalize). */
  gaps?: GapItem[];
  /** Specific strengths (strategy + finalize). */
  strengths?: StrengthItem[];
}

export type ExtractionStep = "uploading" | "processing" | "extracting";

export interface CreateFlowState {
  phase: CreatePhase;
  completedPhases: Set<CreatePhase>;

  // Intake
  files: File[];
  uploadedDocIds: string[];
  isExtracting: boolean;
  extractionStep: ExtractionStep | null;
  extractionError: string | null;
  extractedData: ExtractedIntake | null;
  buyerGoal: string;

  // Strategy
  bidEvaluation: BidEvaluation | null;
  bidDecision: "proceed" | "skip" | null;
  winThemes: WinTheme[];
  strategyConfirmed: boolean;

  // Draft
  proposalId: string | null;
  sections: SectionDraft[];
  generationStatus: "idle" | "generating" | "complete" | "failed";

  // Finalize
  blockers: Blocker[];
  confidence: number;
  finalApproved: boolean;
  exportedUrl: string | null;
}

export type CreateAction =
  | { type: "SET_PHASE"; phase: CreatePhase }
  | { type: "COMPLETE_PHASE"; phase: CreatePhase }
  // Intake
  | { type: "SET_FILES"; files: File[] }
  | { type: "SET_UPLOADED_DOC_IDS"; ids: string[] }
  | { type: "EXTRACTION_START" }
  | { type: "SET_EXTRACTION_STEP"; step: ExtractionStep }
  | { type: "EXTRACTION_SUCCESS"; payload: { extracted: ExtractedIntake } }
  | { type: "EXTRACTION_FAIL"; error: string }
  | { type: "SET_BUYER_GOAL"; goal: string }
  // Strategy
  | { type: "SET_BID_EVALUATION"; evaluation: BidEvaluation }
  | { type: "SET_BID_DECISION"; decision: "proceed" | "skip" }
  | { type: "SET_WIN_THEMES"; themes: WinTheme[] }
  | { type: "TOGGLE_WIN_THEME"; themeId: string }
  | { type: "CONFIRM_STRATEGY" }
  // Draft
  | { type: "SET_PROPOSAL_ID"; id: string }
  | { type: "GENERATION_START" }
  | {
      type: "UPDATE_SECTION";
      sectionId: string;
      updates: Partial<SectionDraft>;
    }
  | { type: "SET_SECTIONS"; sections: SectionDraft[] }
  | { type: "GENERATION_COMPLETE" }
  | { type: "GENERATION_FAIL" }
  | { type: "MARK_SECTION_REVIEWED"; sectionId: string }
  | { type: "REVIEW_ALL_SECTIONS" }
  // Finalize
  | { type: "SET_BLOCKERS"; blockers: Blocker[] }
  | { type: "RESOLVE_BLOCKER"; blockerId: string }
  | { type: "APPROVE_FINAL" }
  | { type: "SET_EXPORTED_URL"; url: string }
  | { type: "RESET" };
