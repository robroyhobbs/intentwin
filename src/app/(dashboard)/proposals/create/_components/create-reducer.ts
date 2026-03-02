import type { CreateFlowState, CreateAction, Blocker } from "./create-types";

export const initialState: CreateFlowState = {
  phase: "intake",
  completedPhases: new Set(),
  files: [],
  uploadedDocIds: [],
  isExtracting: false,
  extractionError: null,
  extractedData: null,
  buyerGoal: "",
  bidEvaluation: null,
  bidDecision: null,
  winThemes: [],
  strategyConfirmed: false,
  proposalId: null,
  sections: [],
  generationStatus: "idle",
  blockers: [],
  confidence: 20,
  finalApproved: false,
  exportedUrl: null,
};

function computeConfidence(state: CreateFlowState): number {
  let score = 20;
  if (state.completedPhases.has("intake")) score += 15;
  if (state.completedPhases.has("strategy")) score += 20;
  if (state.completedPhases.has("draft")) score += 25;
  if (state.completedPhases.has("finalize")) score += 20;
  const unresolvedBlockers = state.blockers.filter(
    (b: Blocker) => !b.resolved,
  ).length;
  score -= unresolvedBlockers * 5;
  return Math.max(0, Math.min(100, score));
}

// eslint-disable-next-line max-lines-per-function -- reducer switch is inherently long
export function createReducer(
  state: CreateFlowState,
  action: CreateAction,
): CreateFlowState {
  let next: CreateFlowState;

  switch (action.type) {
    case "SET_PHASE":
      next = { ...state, phase: action.phase };
      break;
    case "COMPLETE_PHASE": {
      const completed = new Set(state.completedPhases);
      completed.add(action.phase);
      next = { ...state, completedPhases: completed };
      break;
    }
    case "SET_FILES":
      next = { ...state, files: action.files };
      break;
    case "SET_UPLOADED_DOC_IDS":
      next = { ...state, uploadedDocIds: action.ids };
      break;
    case "EXTRACTION_START":
      next = { ...state, isExtracting: true, extractionError: null };
      break;
    case "EXTRACTION_SUCCESS":
      next = {
        ...state,
        isExtracting: false,
        extractedData: action.payload.extracted,
      };
      break;
    case "EXTRACTION_FAIL":
      next = {
        ...state,
        isExtracting: false,
        extractionError: action.error,
      };
      break;
    case "SET_BUYER_GOAL":
      next = { ...state, buyerGoal: action.goal };
      break;
    case "SET_BID_EVALUATION":
      next = { ...state, bidEvaluation: action.evaluation };
      break;
    case "SET_BID_DECISION":
      next = { ...state, bidDecision: action.decision };
      break;
    case "SET_WIN_THEMES":
      next = { ...state, winThemes: action.themes };
      break;
    case "TOGGLE_WIN_THEME":
      next = {
        ...state,
        winThemes: state.winThemes.map((t) =>
          t.id === action.themeId ? { ...t, confirmed: !t.confirmed } : t,
        ),
      };
      break;
    case "CONFIRM_STRATEGY":
      next = { ...state, strategyConfirmed: true };
      break;
    case "SET_PROPOSAL_ID":
      next = { ...state, proposalId: action.id };
      break;
    case "GENERATION_START":
      next = { ...state, generationStatus: "generating" };
      break;
    case "SET_SECTIONS":
      next = { ...state, sections: action.sections };
      break;
    case "UPDATE_SECTION":
      next = {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId ? { ...s, ...action.updates } : s,
        ),
      };
      break;
    case "GENERATION_COMPLETE":
      next = { ...state, generationStatus: "complete" };
      break;
    case "GENERATION_FAIL":
      next = { ...state, generationStatus: "failed" };
      break;
    case "MARK_SECTION_REVIEWED":
      next = {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId ? { ...s, reviewed: true } : s,
        ),
      };
      break;
    case "SET_BLOCKERS":
      next = { ...state, blockers: action.blockers };
      break;
    case "RESOLVE_BLOCKER":
      next = {
        ...state,
        blockers: state.blockers.map((b) =>
          b.id === action.blockerId ? { ...b, resolved: true } : b,
        ),
      };
      break;
    case "APPROVE_FINAL":
      next = { ...state, finalApproved: true };
      break;
    case "SET_EXPORTED_URL":
      next = { ...state, exportedUrl: action.url };
      break;
    case "RESET":
      return initialState;
    default:
      return state;
  }

  return { ...next, confidence: computeConfidence(next) };
}
