import { describe, it, expect } from "vitest";
import {
  wizardReducer,
  INITIAL_STATE,
  type WizardState,
} from "../wizard-state";

describe("wizardReducer property tests", () => {
  describe("GO_NEXT", () => {
    it("advances from step 1 to step 2", () => {
      const state = wizardReducer(INITIAL_STATE, { type: "GO_NEXT" });
      expect(state.currentStep).toBe(2);
    });

    it("stays at max step (5) when already at step 5", () => {
      const atMax: WizardState = { ...INITIAL_STATE, currentStep: 5 };
      const state = wizardReducer(atMax, { type: "GO_NEXT" });
      expect(state.currentStep).toBe(5);
    });

    it("updates maxCompletedStep when advancing", () => {
      const state = wizardReducer(INITIAL_STATE, { type: "GO_NEXT" });
      // Moving to step 2 means step 1 is completed (maxCompletedStep = 1)
      expect(state.maxCompletedStep).toBe(1);
    });
  });

  describe("GO_BACK", () => {
    it("goes from step 3 to step 2", () => {
      const atStep3: WizardState = { ...INITIAL_STATE, currentStep: 3 };
      const state = wizardReducer(atStep3, { type: "GO_BACK" });
      expect(state.currentStep).toBe(2);
    });

    it("stays at step 1 when already at step 1", () => {
      const state = wizardReducer(INITIAL_STATE, { type: "GO_BACK" });
      expect(state.currentStep).toBe(1);
    });

    it("does not decrease maxCompletedStep when going back", () => {
      const atStep3: WizardState = {
        ...INITIAL_STATE,
        currentStep: 3,
        maxCompletedStep: 2,
      };
      const state = wizardReducer(atStep3, { type: "GO_BACK" });
      expect(state.maxCompletedStep).toBe(2);
    });
  });

  describe("SET_STEP", () => {
    it("sets currentStep to a valid step (e.g., 3)", () => {
      const state = wizardReducer(INITIAL_STATE, {
        type: "SET_STEP",
        step: 3,
      });
      expect(state.currentStep).toBe(3);
    });

    it("clamps step to min 1 when given value below range", () => {
      const state = wizardReducer(INITIAL_STATE, {
        type: "SET_STEP",
        step: -1 as any,
      });
      expect(state.currentStep).toBe(1);
    });

    it("clamps step to max 5 when given value above range", () => {
      const state = wizardReducer(INITIAL_STATE, {
        type: "SET_STEP",
        step: 10 as any,
      });
      expect(state.currentStep).toBe(5);
    });

    it("updates maxCompletedStep appropriately", () => {
      const state = wizardReducer(INITIAL_STATE, {
        type: "SET_STEP",
        step: 4,
      });
      // step 4 means maxCompleted = max(0, 4-1) = 3
      expect(state.maxCompletedStep).toBe(3);
    });
  });

  describe("RESET", () => {
    it("returns initial state", () => {
      const modified: WizardState = {
        ...INITIAL_STATE,
        currentStep: 4,
        maxCompletedStep: 3,
        clientName: "Acme Corp",
        tone: "executive",
      };
      const state = wizardReducer(modified, { type: "RESET" });
      expect(state).toEqual(INITIAL_STATE);
    });
  });

  describe("BID_EVALUATION_UPDATE", () => {
    it("keeps current step unchanged", () => {
      const atStep3: WizardState = { ...INITIAL_STATE, currentStep: 3 };
      const state = wizardReducer(atStep3, {
        type: "BID_EVALUATION_UPDATE",
        payload: {
          bidEvaluation: {
            overall_score: 75,
            verdict: "bid",
            factors: [],
            summary: "Good fit",
          } as any,
          bidPhase: "review",
        },
      });
      expect(state.currentStep).toBe(3);
      expect(state.bidPhase).toBe("review");
    });
  });

  describe("GENERATION_START", () => {
    it("sets step to 5 and status to generating", () => {
      const state = wizardReducer(INITIAL_STATE, {
        type: "GENERATION_START",
        proposalId: "prop-123",
      });
      expect(state.currentStep).toBe(5);
      expect(state.generationStatus).toBe("generating");
      expect(state.proposalId).toBe("prop-123");
      expect(state.maxCompletedStep).toBe(4);
    });
  });

  describe("RESTORE_DRAFT", () => {
    it("restores draft state while resetting transient fields", () => {
      const draftState: Partial<WizardState> = {
        currentStep: 4,
        maxCompletedStep: 3,
        clientName: "Restored Corp",
        files: [] as any,
        isExtracting: true,
        extractionError: "old error",
        generationStatus: "complete",
      } as any;

      const state = wizardReducer(INITIAL_STATE, {
        type: "RESTORE_DRAFT",
        state: draftState,
      });

      expect(state.clientName).toBe("Restored Corp");
      expect(state.currentStep).toBe(4);
      // Transient fields should be reset
      expect(state.files).toEqual([]);
      expect(state.isExtracting).toBe(false);
      expect(state.extractionError).toBeNull();
      expect(state.generationStatus).toBe("idle");
      expect(state.sectionProgress).toEqual([]);
    });
  });

  describe("GENERATION_COMPLETE and GENERATION_FAIL", () => {
    it("sets status to complete on GENERATION_COMPLETE", () => {
      const generating: WizardState = {
        ...INITIAL_STATE,
        generationStatus: "generating",
      };
      const state = wizardReducer(generating, { type: "GENERATION_COMPLETE" });
      expect(state.generationStatus).toBe("complete");
    });

    it("sets status to failed on GENERATION_FAIL", () => {
      const generating: WizardState = {
        ...INITIAL_STATE,
        generationStatus: "generating",
      };
      const state = wizardReducer(generating, { type: "GENERATION_FAIL" });
      expect(state.generationStatus).toBe("failed");
    });
  });

  describe("EXTRACTION flow", () => {
    it("EXTRACTION_START sets isExtracting and clears error", () => {
      const withError: WizardState = {
        ...INITIAL_STATE,
        extractionError: "previous error",
      };
      const state = wizardReducer(withError, { type: "EXTRACTION_START" });
      expect(state.isExtracting).toBe(true);
      expect(state.extractionError).toBeNull();
    });

    it("EXTRACTION_FAIL sets error and stops extracting", () => {
      const extracting: WizardState = {
        ...INITIAL_STATE,
        isExtracting: true,
      };
      const state = wizardReducer(extracting, {
        type: "EXTRACTION_FAIL",
        error: "Network error",
      });
      expect(state.isExtracting).toBe(false);
      expect(state.extractionError).toBe("Network error");
    });
  });

  describe("unknown action", () => {
    it("returns state unchanged for unknown action type", () => {
      const state = wizardReducer(INITIAL_STATE, {
        type: "UNKNOWN_ACTION",
      } as any);
      expect(state).toBe(INITIAL_STATE);
    });
  });
});
