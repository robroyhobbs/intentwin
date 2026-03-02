import type { ExtractedIntake } from "@/types/intake";
import type { BidEvaluation } from "@/lib/ai/bid-scoring";

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

export interface CoachContent {
  whyItMatters: string;
  signals: string[];
  riskFlags: RiskFlag[];
  citations: { id: string; label: string }[];
  actions: { label: string; actionType: string }[];
}

export interface CreateFlowState {
  phase: CreatePhase;
  completedPhases: Set<CreatePhase>;

  // Intake
  files: File[];
  uploadedDocIds: string[];
  isExtracting: boolean;
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
