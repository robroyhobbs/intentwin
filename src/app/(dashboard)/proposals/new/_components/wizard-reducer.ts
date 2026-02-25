/**
 * Wizard state reducer — single source of truth for the proposal creation wizard.
 *
 * All step transitions, extraction results, form data, and generation progress
 * flow through this reducer. Child components dispatch actions via useWizard().
 */

import type { WizardState, WizardAction, WizardStep, MaxCompletedStep } from "./wizard-types";

// ────────────────────────────────────────────────────────
// Initial State
// ────────────────────────────────────────────────────────

export const INITIAL_STATE: WizardState = {
  currentStep: 1,
  maxCompletedStep: 0,

  // Step 1
  intakeMode: null,
  files: [],
  uploadedDocIds: [],
  pastedContent: "",
  verbalDescription: "",
  researchEnabled: false,
  isExtracting: false,
  extractionError: null,

  // Step 1→2 bridge
  extractedData: null,
  researchData: null,

  // Step 2
  editedFields: {},
  bidEvaluation: null,
  bidPhase: null,

  // Step 3
  selectedTemplate: "",
  tone: "professional",
  selectedSections: [],
  showAdvanced: false,

  // Form fields
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

  // Step 3→4 bridge
  winStrategy: null,

  // Step 4
  proposalId: null,
  generationStatus: "idle",
  sectionProgress: [],
};

// ────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────

function clampStep(step: number): WizardStep {
  return Math.max(1, Math.min(4, step)) as WizardStep;
}

function maxCompleted(current: MaxCompletedStep, step: WizardStep): MaxCompletedStep {
  const completed = (step - 1) as MaxCompletedStep;
  return Math.max(current, completed) as MaxCompletedStep;
}

// ────────────────────────────────────────────────────────
// Reducer
// ────────────────────────────────────────────────────────

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "GO_NEXT": {
      if (state.currentStep >= 4) return state;
      const nextStep = clampStep(state.currentStep + 1);
      return {
        ...state,
        currentStep: nextStep,
        maxCompletedStep: maxCompleted(state.maxCompletedStep, nextStep),
      };
    }

    case "GO_BACK": {
      if (state.currentStep <= 1) return state;
      return {
        ...state,
        currentStep: clampStep(state.currentStep - 1),
        // maxCompletedStep is NOT decremented — preserves progress
      };
    }

    case "SET_STEP": {
      const step = clampStep(action.step);
      return {
        ...state,
        currentStep: step,
        maxCompletedStep: maxCompleted(state.maxCompletedStep, step),
      };
    }

    case "UPDATE_INPUT": {
      return { ...state, ...action.payload };
    }

    case "EXTRACTION_START": {
      return {
        ...state,
        isExtracting: true,
        extractionError: null,
      };
    }

    case "EXTRACTION_SUCCESS": {
      return {
        ...state,
        isExtracting: false,
        extractionError: null,
        extractedData: action.payload.extracted,
        researchData: action.payload.research,
        currentStep: 2,
        maxCompletedStep: maxCompleted(state.maxCompletedStep, 2),
      };
    }

    case "EXTRACTION_FAIL": {
      return {
        ...state,
        isExtracting: false,
        extractionError: action.error,
      };
    }

    case "UPDATE_EDITED_FIELDS": {
      return {
        ...state,
        editedFields: { ...state.editedFields, ...action.payload },
      };
    }

    case "BID_EVALUATION_UPDATE": {
      return { ...state, ...action.payload };
    }

    case "UPDATE_CONFIG": {
      return { ...state, ...action.payload };
    }

    case "UPDATE_FORM_FIELDS": {
      return { ...state, ...action.payload };
    }

    case "POPULATE_FROM_EXTRACTION": {
      if (!state.extractedData) return state;
      const ex = state.extractedData.extracted;
      const inf = state.extractedData.inferred;

      // Prefer edited fields > extracted > inferred > current state (for fields already set)
      return {
        ...state,
        clientName: state.editedFields.client_name as string || ex.client_name?.value || state.clientName,
        clientIndustry: state.editedFields.client_industry as string || ex.client_industry?.value || inf?.industry?.value || state.clientIndustry,
        clientSize: state.editedFields.client_size as string || ex.client_size?.value || inf?.client_size?.value || state.clientSize,
        solicitationType: state.editedFields.solicitation_type as string || ex.solicitation_type?.value || inf?.solicitation_type?.value || state.solicitationType,
        opportunityType: state.editedFields.opportunity_type as string || ex.opportunity_type?.value || inf?.opportunity_type?.value || state.opportunityType,
        scopeDescription: state.editedFields.scope_description as string || ex.scope_description?.value || state.scopeDescription,
        budgetRange: state.editedFields.budget_range as string || ex.budget_range?.value || state.budgetRange,
        timelineExpectation: state.editedFields.timeline as string || ex.timeline?.value || state.timelineExpectation,
        technicalEnvironment: state.editedFields.technical_environment as string || ex.technical_environment?.value || state.technicalEnvironment,
        currentStatePains: (state.editedFields.current_state_pains as string[]) || ex.current_state_pains?.value || state.currentStatePains,
        desiredOutcomes: (state.editedFields.desired_outcomes as string[]) || ex.desired_outcomes?.value || state.desiredOutcomes,
        complianceRequirements: Array.isArray(state.editedFields.compliance_requirements)
          ? (state.editedFields.compliance_requirements as string[]).join(", ")
          : ex.compliance_requirements?.value?.join(", ") || state.complianceRequirements,
      };
    }

    case "SET_WIN_STRATEGY": {
      return { ...state, winStrategy: action.winStrategy };
    }

    case "GENERATION_START": {
      return {
        ...state,
        proposalId: action.proposalId,
        generationStatus: "generating",
        currentStep: 4,
        maxCompletedStep: 3,
      };
    }

    case "SECTION_STATUS_UPDATE": {
      return {
        ...state,
        sectionProgress: action.sections,
      };
    }

    case "GENERATION_COMPLETE": {
      return {
        ...state,
        generationStatus: "complete",
      };
    }

    case "GENERATION_FAIL": {
      return {
        ...state,
        generationStatus: "failed",
      };
    }

    case "RESTORE_DRAFT": {
      // Merge draft data but don't restore transient state
      const { files: _files, isExtracting: _ext, extractionError: _err, ...safeState } = action.state as WizardState;
      return {
        ...state,
        ...safeState,
        // Reset transient fields
        files: [],
        isExtracting: false,
        extractionError: null,
        generationStatus: "idle",
        sectionProgress: [],
      };
    }

    case "RESET": {
      return { ...INITIAL_STATE };
    }

    default:
      return state;
  }
}
