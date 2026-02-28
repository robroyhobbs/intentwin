import type { ExtractedIntake, ClientResearch, IntakeMode } from "@/types/intake";
import type { WinStrategyData } from "@/types/outcomes";
import type { BidEvaluation } from "@/lib/ai/bid-scoring";

export type WizardStep = 1 | 2 | 3 | 4 | 5;
export type MaxCompletedStep = 0 | 1 | 2 | 3 | 4;

export interface SectionProgress {
  type: string;
  title: string;
  status: "pending" | "generating" | "completed" | "failed";
}

export interface WizardState {
  currentStep: WizardStep;
  maxCompletedStep: MaxCompletedStep;
  intakeMode: IntakeMode | null;
  files: File[];
  uploadedDocIds: string[];
  pastedContent: string;
  verbalDescription: string;
  researchEnabled: boolean;
  isExtracting: boolean;
  extractionError: string | null;
  extractedData: ExtractedIntake | null;
  researchData: ClientResearch | null;
  editedFields: Record<string, string | string[]>;
  bidEvaluation: BidEvaluation | null;
  bidPhase: "scoring" | "review" | "decided" | null;
  selectedTemplate: string;
  tone: "professional" | "conversational" | "technical" | "executive";
  selectedSections: string[];
  showAdvanced: boolean;
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
  winStrategy: WinStrategyData | null;
  proposalId: string | null;
  generationStatus: "idle" | "creating" | "generating" | "complete" | "failed";
  sectionProgress: SectionProgress[];
}

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

export interface StepMeta {
  step: WizardStep;
  label: string;
  description: string;
}

export const WIZARD_STEPS: StepMeta[] = [
  { step: 1, label: "Upload", description: "Upload or paste your source material" },
  { step: 2, label: "Review", description: "Check gaps and AI-inferred data" },
  { step: 3, label: "Bid Decision", description: "Evaluate whether to bid" },
  { step: 4, label: "Configure", description: "Choose sections and tone" },
  { step: 5, label: "Generate", description: "AI writes your proposal" },
];

export const INITIAL_STATE: WizardState = {
  currentStep: 1,
  maxCompletedStep: 0,
  intakeMode: null,
  files: [],
  uploadedDocIds: [],
  pastedContent: "",
  verbalDescription: "",
  researchEnabled: false,
  isExtracting: false,
  extractionError: null,
  extractedData: null,
  researchData: null,
  editedFields: {},
  bidEvaluation: null,
  bidPhase: null,
  selectedTemplate: "",
  tone: "professional",
  selectedSections: [],
  showAdvanced: false,
  clientName: "",
  clientIndustry: "",
  clientSize: "",
  solicitationType: "RFP",
  opportunityType: "cloud_migration",
  scopeDescription: "",
  currentStatePains: [],
  desiredOutcomes: [],
  budgetRange: "",
  timelineExpectation: "",
  technicalEnvironment: "",
  complianceRequirements: "",
  competitiveIntel: "",
  winStrategy: null,
  proposalId: null,
  generationStatus: "idle",
  sectionProgress: [],
};

function clampStep(step: number): WizardStep {
  return Math.max(1, Math.min(5, step)) as WizardStep;
}

function maxCompleted(current: MaxCompletedStep, step: WizardStep): MaxCompletedStep {
  const completed = (step - 1) as MaxCompletedStep;
  return Math.max(current, completed) as MaxCompletedStep;
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "GO_NEXT": {
      if (state.currentStep >= 5) return state;
      const nextStep = clampStep(state.currentStep + 1);
      return {
        ...state,
        currentStep: nextStep,
        maxCompletedStep: maxCompleted(state.maxCompletedStep, nextStep),
      };
    }
    case "GO_BACK": {
      if (state.currentStep <= 1) return state;
      return { ...state, currentStep: clampStep(state.currentStep - 1) };
    }
    case "SET_STEP": {
      const step = clampStep(action.step);
      return {
        ...state,
        currentStep: step,
        maxCompletedStep: maxCompleted(state.maxCompletedStep, step),
      };
    }
    case "UPDATE_INPUT":
      return { ...state, ...action.payload };
    case "EXTRACTION_START":
      return { ...state, isExtracting: true, extractionError: null };
    case "EXTRACTION_SUCCESS":
      return {
        ...state,
        isExtracting: false,
        extractionError: null,
        extractedData: action.payload.extracted,
        researchData: action.payload.research,
        currentStep: 2,
        maxCompletedStep: maxCompleted(state.maxCompletedStep, 2),
      };
    case "EXTRACTION_FAIL":
      return { ...state, isExtracting: false, extractionError: action.error };
    case "UPDATE_EDITED_FIELDS":
      return { ...state, editedFields: { ...state.editedFields, ...action.payload } };
    case "BID_EVALUATION_UPDATE":
    case "UPDATE_CONFIG":
    case "UPDATE_FORM_FIELDS":
      return { ...state, ...action.payload };
    case "POPULATE_FROM_EXTRACTION": {
      if (!state.extractedData) return state;
      const ex = state.extractedData.extracted;
      const inf = state.extractedData.inferred;
      return {
        ...state,
        clientName: (state.editedFields.client_name as string) || ex.client_name?.value || state.clientName,
        clientIndustry: (state.editedFields.client_industry as string) || ex.client_industry?.value || inf?.industry?.value || state.clientIndustry,
        clientSize: (state.editedFields.client_size as string) || ex.client_size?.value || inf?.client_size?.value || state.clientSize,
        solicitationType: (state.editedFields.solicitation_type as string) || ex.solicitation_type?.value || inf?.solicitation_type?.value || state.solicitationType,
        opportunityType: (state.editedFields.opportunity_type as string) || ex.opportunity_type?.value || inf?.opportunity_type?.value || state.opportunityType,
        scopeDescription: (state.editedFields.scope_description as string) || ex.scope_description?.value || state.scopeDescription,
        budgetRange: (state.editedFields.budget_range as string) || ex.budget_range?.value || state.budgetRange,
        timelineExpectation: (state.editedFields.timeline as string) || ex.timeline?.value || state.timelineExpectation,
        technicalEnvironment: (state.editedFields.technical_environment as string) || ex.technical_environment?.value || state.technicalEnvironment,
        currentStatePains: (state.editedFields.current_state_pains as string[]) || ex.current_state_pains?.value || state.currentStatePains,
        desiredOutcomes: (state.editedFields.desired_outcomes as string[]) || ex.desired_outcomes?.value || state.desiredOutcomes,
        complianceRequirements: Array.isArray(state.editedFields.compliance_requirements)
          ? (state.editedFields.compliance_requirements as string[]).join(", ")
          : ex.compliance_requirements?.value?.join(", ") || state.complianceRequirements,
      };
    }
    case "SET_WIN_STRATEGY":
      return { ...state, winStrategy: action.winStrategy };
    case "GENERATION_START":
      return {
        ...state,
        proposalId: action.proposalId,
        generationStatus: "generating",
        currentStep: 5,
        maxCompletedStep: 4,
      };
    case "SECTION_STATUS_UPDATE":
      return { ...state, sectionProgress: action.sections };
    case "GENERATION_COMPLETE":
      return { ...state, generationStatus: "complete" };
    case "GENERATION_FAIL":
      return { ...state, generationStatus: "failed" };
    case "RESTORE_DRAFT": {
      const { files: _files, isExtracting: _ext, extractionError: _err, ...safeState } = action.state as WizardState;
      return {
        ...state,
        ...safeState,
        files: [],
        isExtracting: false,
        extractionError: null,
        generationStatus: "idle",
        sectionProgress: [],
      };
    }
    case "RESET":
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}
