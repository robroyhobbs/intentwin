/**
 * Shared types for the Proposal Creation Wizard.
 */

import type { ExtractedIntake, ClientResearch, IntakeMode } from "@/types/intake";
import type { WinStrategyData } from "@/types/outcomes";
import type { BidEvaluation } from "@/lib/ai/bid-scoring";

// ────────────────────────────────────────────────────────
// Wizard State
// ────────────────────────────────────────────────────────

export type WizardStep = 1 | 2 | 3 | 4;
export type MaxCompletedStep = 0 | 1 | 2 | 3;

export interface SectionProgress {
  type: string;
  title: string;
  status: "pending" | "generating" | "completed" | "failed";
}

export interface WizardState {
  currentStep: WizardStep;
  maxCompletedStep: MaxCompletedStep;

  // Step 1: Input
  intakeMode: IntakeMode | null;
  files: File[];
  uploadedDocIds: string[];
  pastedContent: string;
  verbalDescription: string;
  researchEnabled: boolean;
  isExtracting: boolean;
  extractionError: string | null;

  // Step 1 → Step 2 bridge
  extractedData: ExtractedIntake | null;
  researchData: ClientResearch | null;

  // Step 2: Review
  editedFields: Record<string, string | string[]>;
  bidEvaluation: BidEvaluation | null;
  bidPhase: "scoring" | "review" | "decided" | null;

  // Step 3: Configure
  selectedTemplate: string;
  tone: "professional" | "conversational" | "technical" | "executive";
  selectedSections: string[];
  showAdvanced: boolean;

  // Step 3 form fields (from extraction or manual entry)
  clientName: string;
  clientIndustry: string;
  clientSize: string;
  solicitationType: string;
  opportunityType: string;
  scopeDescription: string;
  currentStatePains: string[];
  desiredOutcomes: string[];
  budgetRange: string;
  timelineExpectation: string;
  technicalEnvironment: string;
  complianceRequirements: string;
  competitiveIntel: string;

  // Step 3 → Step 4 bridge
  winStrategy: WinStrategyData | null;

  // Step 4: Generate
  proposalId: string | null;
  generationStatus: "idle" | "creating" | "generating" | "complete" | "failed";
  sectionProgress: SectionProgress[];
}

// ────────────────────────────────────────────────────────
// Wizard Actions
// ────────────────────────────────────────────────────────

export type WizardAction =
  | { type: "GO_NEXT" }
  | { type: "GO_BACK" }
  | { type: "SET_STEP"; step: WizardStep }
  | { type: "UPDATE_INPUT"; payload: Partial<Pick<WizardState, "intakeMode" | "files" | "uploadedDocIds" | "pastedContent" | "verbalDescription" | "researchEnabled">> }
  | { type: "EXTRACTION_START" }
  | { type: "EXTRACTION_SUCCESS"; payload: { extracted: ExtractedIntake; research: ClientResearch | null } }
  | { type: "EXTRACTION_FAIL"; error: string }
  | { type: "UPDATE_EDITED_FIELDS"; payload: Record<string, string | string[]> }
  | { type: "BID_EVALUATION_UPDATE"; payload: Partial<Pick<WizardState, "bidEvaluation" | "bidPhase">> }
  | { type: "UPDATE_CONFIG"; payload: Partial<Pick<WizardState, "selectedTemplate" | "tone" | "selectedSections" | "showAdvanced">> }
  | { type: "UPDATE_FORM_FIELDS"; payload: Partial<Pick<WizardState, "clientName" | "clientIndustry" | "clientSize" | "solicitationType" | "opportunityType" | "scopeDescription" | "currentStatePains" | "desiredOutcomes" | "budgetRange" | "timelineExpectation" | "technicalEnvironment" | "complianceRequirements" | "competitiveIntel">> }
  | { type: "POPULATE_FROM_EXTRACTION" }
  | { type: "SET_WIN_STRATEGY"; winStrategy: WinStrategyData }
  | { type: "GENERATION_START"; proposalId: string }
  | { type: "SECTION_STATUS_UPDATE"; sections: SectionProgress[] }
  | { type: "GENERATION_COMPLETE" }
  | { type: "GENERATION_FAIL" }
  | { type: "RESTORE_DRAFT"; state: Partial<WizardState> }
  | { type: "RESET" };

// ────────────────────────────────────────────────────────
// Step Metadata
// ────────────────────────────────────────────────────────

export interface StepMeta {
  step: WizardStep;
  label: string;
  description: string;
}

export const WIZARD_STEPS: StepMeta[] = [
  { step: 1, label: "Provide Documents", description: "Upload or paste your source material" },
  { step: 2, label: "Review & Edit", description: "Verify extracted information" },
  { step: 3, label: "Configure Proposal", description: "Choose sections and tone" },
  { step: 4, label: "Generate Sections", description: "AI writes your proposal" },
];
