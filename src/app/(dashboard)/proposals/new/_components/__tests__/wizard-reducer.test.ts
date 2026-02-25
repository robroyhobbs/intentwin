import { describe, it, expect } from "vitest";
import { wizardReducer, INITIAL_STATE } from "../wizard-reducer";
import type { WizardState, WizardAction } from "../wizard-types";
import type { ExtractedIntake } from "@/types/intake";

// ────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────

function dispatch(state: WizardState, action: WizardAction): WizardState {
  return wizardReducer(state, action);
}

function dispatchMany(state: WizardState, actions: WizardAction[]): WizardState {
  return actions.reduce(wizardReducer, state);
}

function stateAt(step: 1 | 2 | 3 | 4): WizardState {
  let s = INITIAL_STATE;
  for (let i = 1; i < step; i++) {
    s = dispatch(s, { type: "GO_NEXT" });
  }
  return s;
}

const mockExtracted: ExtractedIntake = {
  input_type: "formal_rfp",
  input_summary: "Cloud migration RFP for Acme Corp",
  extracted: {
    client_name: { value: "Acme Corp", confidence: 0.95, source: "Page 1" },
    client_industry: { value: "Technology", confidence: 0.8, source: "Page 1" },
    scope_description: { value: "Migrate 50 workloads to AWS", confidence: 0.9, source: "Section 3" },
    solicitation_type: { value: "RFP", confidence: 0.95, source: "Header" },
    current_state_pains: { value: ["Legacy systems", "High cost"], confidence: 0.7, source: "Page 2" },
    desired_outcomes: { value: ["Reduced TCO", "Faster deployments"], confidence: 0.8, source: "Page 3" },
  },
  inferred: {
    client_size: { value: "Enterprise", reasoning: "50 workloads suggests large org" },
    opportunity_type: { value: "cloud_migration", reasoning: "Explicit migration scope" },
  },
  gaps: [
    { field: "budget_range", importance: "critical" },
    { field: "timeline", importance: "helpful" },
  ],
};

// ────────────────────────────────────────────────────────
// Happy Path
// ────────────────────────────────────────────────────────

describe("wizardReducer", () => {
  describe("initialization", () => {
    it("starts at step 1 with maxCompletedStep 0", () => {
      expect(INITIAL_STATE.currentStep).toBe(1);
      expect(INITIAL_STATE.maxCompletedStep).toBe(0);
    });

    it("starts with professional tone", () => {
      expect(INITIAL_STATE.tone).toBe("professional");
    });

    it("starts with RFP solicitation type", () => {
      expect(INITIAL_STATE.solicitationType).toBe("RFP");
    });
  });

  describe("GO_NEXT", () => {
    it("advances from step 1 to step 2", () => {
      const s = dispatch(INITIAL_STATE, { type: "GO_NEXT" });
      expect(s.currentStep).toBe(2);
      expect(s.maxCompletedStep).toBe(1);
    });

    it("advances sequentially through all 4 steps", () => {
      const s = dispatchMany(INITIAL_STATE, [
        { type: "GO_NEXT" },
        { type: "GO_NEXT" },
        { type: "GO_NEXT" },
      ]);
      expect(s.currentStep).toBe(4);
      expect(s.maxCompletedStep).toBe(3);
    });

    it("does nothing on step 4", () => {
      const s4 = stateAt(4);
      const s = dispatch(s4, { type: "GO_NEXT" });
      expect(s.currentStep).toBe(4);
    });
  });

  describe("GO_BACK", () => {
    it("decrements from step 3 to step 2", () => {
      const s3 = stateAt(3);
      const s = dispatch(s3, { type: "GO_BACK" });
      expect(s.currentStep).toBe(2);
    });

    it("does nothing on step 1", () => {
      const s = dispatch(INITIAL_STATE, { type: "GO_BACK" });
      expect(s.currentStep).toBe(1);
    });

    it("does NOT decrement maxCompletedStep", () => {
      const s3 = stateAt(3);
      expect(s3.maxCompletedStep).toBe(2);
      const s = dispatch(s3, { type: "GO_BACK" });
      expect(s.maxCompletedStep).toBe(2); // preserved
    });
  });

  describe("SET_STEP", () => {
    it("sets arbitrary step within bounds", () => {
      const s = dispatch(INITIAL_STATE, { type: "SET_STEP", step: 3 });
      expect(s.currentStep).toBe(3);
    });

    it("clamps step > 4 to 4", () => {
      const s = dispatch(INITIAL_STATE, { type: "SET_STEP", step: 99 as never });
      expect(s.currentStep).toBe(4);
    });

    it("clamps step < 1 to 1", () => {
      const s = dispatch(INITIAL_STATE, { type: "SET_STEP", step: -1 as never });
      expect(s.currentStep).toBe(1);
    });

    it("updates maxCompletedStep if new step is higher", () => {
      const s = dispatch(INITIAL_STATE, { type: "SET_STEP", step: 3 });
      expect(s.maxCompletedStep).toBe(2);
    });
  });

  describe("RESET", () => {
    it("returns to initial state", () => {
      const modified = dispatchMany(INITIAL_STATE, [
        { type: "UPDATE_FORM_FIELDS", payload: { clientName: "Acme" } },
        { type: "GO_NEXT" },
        { type: "GO_NEXT" },
      ]);
      const s = dispatch(modified, { type: "RESET" });
      expect(s).toEqual(INITIAL_STATE);
    });
  });

  // ────────────────────────────────────────────────────────
  // Extraction Flow
  // ────────────────────────────────────────────────────────

  describe("extraction", () => {
    it("EXTRACTION_START sets isExtracting and clears error", () => {
      const s = dispatch(INITIAL_STATE, { type: "EXTRACTION_START" });
      expect(s.isExtracting).toBe(true);
      expect(s.extractionError).toBeNull();
    });

    it("EXTRACTION_SUCCESS sets data and advances to step 2", () => {
      const s = dispatch(
        { ...INITIAL_STATE, isExtracting: true },
        { type: "EXTRACTION_SUCCESS", payload: { extracted: mockExtracted, research: null } },
      );
      expect(s.isExtracting).toBe(false);
      expect(s.extractedData).toBe(mockExtracted);
      expect(s.researchData).toBeNull();
      expect(s.currentStep).toBe(2);
      expect(s.maxCompletedStep).toBe(1);
    });

    it("EXTRACTION_FAIL sets error and stops extracting", () => {
      const s = dispatch(
        { ...INITIAL_STATE, isExtracting: true },
        { type: "EXTRACTION_FAIL", error: "AI service unavailable" },
      );
      expect(s.isExtracting).toBe(false);
      expect(s.extractionError).toBe("AI service unavailable");
      expect(s.currentStep).toBe(1); // stays on step 1
    });
  });

  // ────────────────────────────────────────────────────────
  // Input & Fields
  // ────────────────────────────────────────────────────────

  describe("UPDATE_INPUT", () => {
    it("updates intake mode", () => {
      const s = dispatch(INITIAL_STATE, { type: "UPDATE_INPUT", payload: { intakeMode: "upload" } });
      expect(s.intakeMode).toBe("upload");
    });

    it("updates multiple input fields at once", () => {
      const s = dispatch(INITIAL_STATE, {
        type: "UPDATE_INPUT",
        payload: { pastedContent: "Some RFP text", researchEnabled: true },
      });
      expect(s.pastedContent).toBe("Some RFP text");
      expect(s.researchEnabled).toBe(true);
    });
  });

  describe("UPDATE_FORM_FIELDS", () => {
    it("updates client name", () => {
      const s = dispatch(INITIAL_STATE, {
        type: "UPDATE_FORM_FIELDS",
        payload: { clientName: "Acme Corp" },
      });
      expect(s.clientName).toBe("Acme Corp");
    });

    it("preserves other fields when updating one", () => {
      const s1 = dispatch(INITIAL_STATE, {
        type: "UPDATE_FORM_FIELDS",
        payload: { clientName: "Acme", clientIndustry: "Tech" },
      });
      const s2 = dispatch(s1, {
        type: "UPDATE_FORM_FIELDS",
        payload: { clientName: "Beta Corp" },
      });
      expect(s2.clientName).toBe("Beta Corp");
      expect(s2.clientIndustry).toBe("Tech"); // preserved
    });
  });

  describe("UPDATE_EDITED_FIELDS", () => {
    it("merges new fields with existing edits", () => {
      const s1 = dispatch(INITIAL_STATE, {
        type: "UPDATE_EDITED_FIELDS",
        payload: { client_name: "Acme" },
      });
      const s2 = dispatch(s1, {
        type: "UPDATE_EDITED_FIELDS",
        payload: { client_industry: "Tech" },
      });
      expect(s2.editedFields).toEqual({ client_name: "Acme", client_industry: "Tech" });
    });
  });

  // ────────────────────────────────────────────────────────
  // POPULATE_FROM_EXTRACTION
  // ────────────────────────────────────────────────────────

  describe("POPULATE_FROM_EXTRACTION", () => {
    it("does nothing without extractedData", () => {
      const s = dispatch(INITIAL_STATE, { type: "POPULATE_FROM_EXTRACTION" });
      expect(s.clientName).toBe("");
    });

    it("populates form fields from extracted data", () => {
      const withData: WizardState = {
        ...INITIAL_STATE,
        extractedData: mockExtracted,
      };
      const s = dispatch(withData, { type: "POPULATE_FROM_EXTRACTION" });
      expect(s.clientName).toBe("Acme Corp");
      expect(s.clientIndustry).toBe("Technology");
      expect(s.scopeDescription).toBe("Migrate 50 workloads to AWS");
      expect(s.solicitationType).toBe("RFP");
    });

    it("uses inferred values when extracted values are missing", () => {
      const withData: WizardState = {
        ...INITIAL_STATE,
        extractedData: mockExtracted,
      };
      const s = dispatch(withData, { type: "POPULATE_FROM_EXTRACTION" });
      expect(s.clientSize).toBe("Enterprise"); // from inferred
      expect(s.opportunityType).toBe("cloud_migration"); // from inferred
    });

    it("prefers edited fields over extracted values", () => {
      const withData: WizardState = {
        ...INITIAL_STATE,
        extractedData: mockExtracted,
        editedFields: { client_name: "Override Corp" },
      };
      const s = dispatch(withData, { type: "POPULATE_FROM_EXTRACTION" });
      expect(s.clientName).toBe("Override Corp");
    });
  });

  // ────────────────────────────────────────────────────────
  // Config & Generation
  // ────────────────────────────────────────────────────────

  describe("UPDATE_CONFIG", () => {
    it("updates tone", () => {
      const s = dispatch(INITIAL_STATE, { type: "UPDATE_CONFIG", payload: { tone: "executive" } });
      expect(s.tone).toBe("executive");
    });

    it("updates selected sections", () => {
      const s = dispatch(INITIAL_STATE, {
        type: "UPDATE_CONFIG",
        payload: { selectedSections: ["executive_summary", "approach"] },
      });
      expect(s.selectedSections).toEqual(["executive_summary", "approach"]);
    });
  });

  describe("generation", () => {
    it("GENERATION_START sets proposalId and advances to step 4", () => {
      const s = dispatch(stateAt(3), { type: "GENERATION_START", proposalId: "abc-123" });
      expect(s.proposalId).toBe("abc-123");
      expect(s.generationStatus).toBe("generating");
      expect(s.currentStep).toBe(4);
    });

    it("SECTION_STATUS_UPDATE updates section progress", () => {
      const sections = [
        { type: "exec_summary", title: "Executive Summary", status: "completed" as const },
        { type: "approach", title: "Approach", status: "generating" as const },
      ];
      const s = dispatch(INITIAL_STATE, { type: "SECTION_STATUS_UPDATE", sections });
      expect(s.sectionProgress).toEqual(sections);
    });

    it("GENERATION_COMPLETE sets status", () => {
      const s = dispatch(
        { ...INITIAL_STATE, generationStatus: "generating" as const },
        { type: "GENERATION_COMPLETE" },
      );
      expect(s.generationStatus).toBe("complete");
    });

    it("GENERATION_FAIL sets status", () => {
      const s = dispatch(
        { ...INITIAL_STATE, generationStatus: "generating" as const },
        { type: "GENERATION_FAIL" },
      );
      expect(s.generationStatus).toBe("failed");
    });
  });

  // ────────────────────────────────────────────────────────
  // Data Preservation (GO_BACK never clears)
  // ────────────────────────────────────────────────────────

  describe("state preservation on GO_BACK", () => {
    it("preserves extraction data when going back from step 2 to step 1", () => {
      const s2 = dispatch(
        INITIAL_STATE,
        { type: "EXTRACTION_SUCCESS", payload: { extracted: mockExtracted, research: null } },
      );
      expect(s2.currentStep).toBe(2);
      const s1 = dispatch(s2, { type: "GO_BACK" });
      expect(s1.currentStep).toBe(1);
      expect(s1.extractedData).toBe(mockExtracted); // preserved!
    });

    it("preserves config when going back from step 3 to step 2", () => {
      const s3 = dispatchMany(stateAt(3), [
        { type: "UPDATE_CONFIG", payload: { tone: "executive", selectedSections: ["a", "b"] } },
      ]);
      const s2 = dispatch(s3, { type: "GO_BACK" });
      expect(s2.tone).toBe("executive");
      expect(s2.selectedSections).toEqual(["a", "b"]);
    });

    it("preserves form fields across multiple back/forward cycles", () => {
      let s = dispatch(INITIAL_STATE, { type: "UPDATE_FORM_FIELDS", payload: { clientName: "Acme" } });
      s = dispatch(s, { type: "GO_NEXT" }); // step 2
      s = dispatch(s, { type: "GO_NEXT" }); // step 3
      s = dispatch(s, { type: "GO_BACK" }); // step 2
      s = dispatch(s, { type: "GO_BACK" }); // step 1
      s = dispatch(s, { type: "GO_NEXT" }); // step 2
      expect(s.clientName).toBe("Acme"); // still there
    });
  });

  // ────────────────────────────────────────────────────────
  // Edge Cases
  // ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("rapid GO_NEXT/GO_BACK doesn't corrupt state", () => {
      const actions: WizardAction[] = [
        { type: "GO_NEXT" },
        { type: "GO_NEXT" },
        { type: "GO_BACK" },
        { type: "GO_NEXT" },
        { type: "GO_BACK" },
        { type: "GO_BACK" },
        { type: "GO_NEXT" },
      ];
      const s = dispatchMany(INITIAL_STATE, actions);
      expect(s.currentStep).toBeGreaterThanOrEqual(1);
      expect(s.currentStep).toBeLessThanOrEqual(4);
      expect(s.maxCompletedStep).toBeGreaterThanOrEqual(0);
      expect(s.maxCompletedStep).toBeLessThanOrEqual(3);
    });

    it("RESTORE_DRAFT merges without corrupting state", () => {
      const draft: Partial<WizardState> = {
        currentStep: 2,
        maxCompletedStep: 1,
        clientName: "Draft Corp",
        tone: "executive",
      };
      const s = dispatch(INITIAL_STATE, { type: "RESTORE_DRAFT", state: draft });
      expect(s.clientName).toBe("Draft Corp");
      expect(s.tone).toBe("executive");
      expect(s.currentStep).toBe(2);
      // Transient fields should be reset
      expect(s.isExtracting).toBe(false);
      expect(s.generationStatus).toBe("idle");
      expect(s.files).toEqual([]);
    });

    it("RESTORE_DRAFT with empty object doesn't break state", () => {
      const s = dispatch(INITIAL_STATE, { type: "RESTORE_DRAFT", state: {} });
      expect(s.currentStep).toBe(1);
    });

    it("BID_EVALUATION_UPDATE sets bid fields", () => {
      const s = dispatch(INITIAL_STATE, {
        type: "BID_EVALUATION_UPDATE",
        payload: { bidPhase: "scoring" },
      });
      expect(s.bidPhase).toBe("scoring");
    });

    it("SET_WIN_STRATEGY stores win strategy data", () => {
      const strategy = {
        win_themes: ["Cloud expertise"],
        success_metrics: ["99.9% uptime"],
        differentiators: ["5x AWS certifications"],
        target_outcomes: [],
        generated_at: "2026-02-24T00:00:00Z",
      };
      const s = dispatch(INITIAL_STATE, { type: "SET_WIN_STRATEGY", winStrategy: strategy });
      expect(s.winStrategy).toEqual(strategy);
    });
  });

  // ────────────────────────────────────────────────────────
  // Data Damage Prevention
  // ────────────────────────────────────────────────────────

  describe("data damage prevention", () => {
    it("RESET fully clears state (no stale data)", () => {
      const modified = dispatchMany(INITIAL_STATE, [
        { type: "UPDATE_FORM_FIELDS", payload: { clientName: "Acme" } },
        { type: "UPDATE_CONFIG", payload: { tone: "executive" } },
        { type: "GO_NEXT" },
      ]);
      const s = dispatch(modified, { type: "RESET" });
      expect(s.clientName).toBe("");
      expect(s.tone).toBe("professional");
      expect(s.currentStep).toBe(1);
      expect(s.maxCompletedStep).toBe(0);
    });

    it("unknown action type returns state unchanged", () => {
      const s = dispatch(INITIAL_STATE, { type: "UNKNOWN" } as never);
      expect(s).toBe(INITIAL_STATE);
    });
  });

  // ────────────────────────────────────────────────────────
  // Step 2: Review & Edit
  // ────────────────────────────────────────────────────────

  describe("step 2 review flow", () => {
    // Helper: state at step 2 with extraction data
    function stateAtStep2WithData(): WizardState {
      return dispatch(INITIAL_STATE, {
        type: "EXTRACTION_SUCCESS",
        payload: { extracted: mockExtracted, research: null },
      });
    }

    describe("UPDATE_EDITED_FIELDS", () => {
      it("stores edited field values in editedFields map", () => {
        const s = dispatch(stateAtStep2WithData(), {
          type: "UPDATE_EDITED_FIELDS",
          payload: { client_name: "Edited Corp" },
        });
        expect(s.editedFields.client_name).toBe("Edited Corp");
      });

      it("merges multiple edits without losing previous ones", () => {
        const s = dispatchMany(stateAtStep2WithData(), [
          { type: "UPDATE_EDITED_FIELDS", payload: { client_name: "Corp A" } },
          { type: "UPDATE_EDITED_FIELDS", payload: { budget_range: "$1M-$5M" } },
        ]);
        expect(s.editedFields.client_name).toBe("Corp A");
        expect(s.editedFields.budget_range).toBe("$1M-$5M");
      });

      it("overwrites previously edited field with new value", () => {
        const s = dispatchMany(stateAtStep2WithData(), [
          { type: "UPDATE_EDITED_FIELDS", payload: { client_name: "First" } },
          { type: "UPDATE_EDITED_FIELDS", payload: { client_name: "Second" } },
        ]);
        expect(s.editedFields.client_name).toBe("Second");
      });

      it("handles array field edits (requirements)", () => {
        const s = dispatch(stateAtStep2WithData(), {
          type: "UPDATE_EDITED_FIELDS",
          payload: { key_requirements: ["Req 1", "Req 2", "Req 3"] },
        });
        expect(s.editedFields.key_requirements).toEqual(["Req 1", "Req 2", "Req 3"]);
      });

      it("does not corrupt other state fields", () => {
        const base = stateAtStep2WithData();
        const s = dispatch(base, {
          type: "UPDATE_EDITED_FIELDS",
          payload: { client_name: "Changed" },
        });
        // Other state should be unchanged
        expect(s.currentStep).toBe(base.currentStep);
        expect(s.extractedData).toBe(base.extractedData);
        expect(s.researchData).toBe(base.researchData);
      });
    });

    describe("POPULATE_FROM_EXTRACTION with edits", () => {
      it("prefers edited fields over extracted values", () => {
        const s = dispatchMany(stateAtStep2WithData(), [
          { type: "UPDATE_EDITED_FIELDS", payload: { client_name: "Edited Corp" } },
          { type: "POPULATE_FROM_EXTRACTION" },
        ]);
        expect(s.clientName).toBe("Edited Corp");
      });

      it("falls back to extracted values when no edits exist", () => {
        const s = dispatch(stateAtStep2WithData(), { type: "POPULATE_FROM_EXTRACTION" });
        expect(s.clientName).toBe("Acme Corp");
        expect(s.clientIndustry).toBe("Technology");
        expect(s.scopeDescription).toBe("Migrate 50 workloads to AWS");
      });

      it("uses inferred values when extracted value is missing", () => {
        const s = dispatch(stateAtStep2WithData(), { type: "POPULATE_FROM_EXTRACTION" });
        expect(s.clientSize).toBe("Enterprise"); // from inferred
        expect(s.opportunityType).toBe("cloud_migration"); // from inferred
      });

      it("prefers edited over inferred", () => {
        const s = dispatchMany(stateAtStep2WithData(), [
          { type: "UPDATE_EDITED_FIELDS", payload: { client_size: "Midmarket" } },
          { type: "POPULATE_FROM_EXTRACTION" },
        ]);
        expect(s.clientSize).toBe("Midmarket");
      });

      it("handles array fields from extraction", () => {
        const s = dispatch(stateAtStep2WithData(), { type: "POPULATE_FROM_EXTRACTION" });
        expect(s.currentStatePains).toEqual(["Legacy systems", "High cost"]);
        expect(s.desiredOutcomes).toEqual(["Reduced TCO", "Faster deployments"]);
      });

      it("handles edited array fields overriding extracted", () => {
        const s = dispatchMany(stateAtStep2WithData(), [
          { type: "UPDATE_EDITED_FIELDS", payload: { current_state_pains: ["Custom pain"] } },
          { type: "POPULATE_FROM_EXTRACTION" },
        ]);
        expect(s.currentStatePains).toEqual(["Custom pain"]);
      });

      it("does nothing when extractedData is null", () => {
        const s = dispatch(INITIAL_STATE, { type: "POPULATE_FROM_EXTRACTION" });
        expect(s.clientName).toBe(""); // unchanged
      });
    });

    describe("BID_EVALUATION_UPDATE", () => {
      it("stores bid evaluation from API", () => {
        const mockEvaluation = {
          ai_scores: {
            requirement_match: { score: 85, rationale: "Strong match" },
            past_performance: { score: 70, rationale: "Some history" },
            capability_alignment: { score: 90, rationale: "Well aligned" },
            timeline_feasibility: { score: 60, rationale: "Tight" },
            strategic_value: { score: 75, rationale: "Good fit" },
          },
          weighted_total: 78.5,
          recommendation: "bid" as const,
          scored_at: "2026-02-24T00:00:00Z",
        };
        const s = dispatch(stateAtStep2WithData(), {
          type: "BID_EVALUATION_UPDATE",
          payload: { bidEvaluation: mockEvaluation, bidPhase: "review" },
        });
        expect(s.bidEvaluation).toEqual(mockEvaluation);
        expect(s.bidPhase).toBe("review");
      });

      it("updates bid phase to decided", () => {
        const s = dispatch(stateAtStep2WithData(), {
          type: "BID_EVALUATION_UPDATE",
          payload: { bidPhase: "decided" },
        });
        expect(s.bidPhase).toBe("decided");
      });

      it("preserves bid evaluation when updating only phase", () => {
        const mockEvaluation = {
          ai_scores: {
            requirement_match: { score: 85, rationale: "Strong" },
            past_performance: { score: 70, rationale: "Ok" },
            capability_alignment: { score: 90, rationale: "Good" },
            timeline_feasibility: { score: 60, rationale: "Tight" },
            strategic_value: { score: 75, rationale: "Fit" },
          },
          weighted_total: 78.5,
          recommendation: "bid" as const,
          scored_at: "2026-02-24T00:00:00Z",
        };
        const withEval = dispatch(stateAtStep2WithData(), {
          type: "BID_EVALUATION_UPDATE",
          payload: { bidEvaluation: mockEvaluation, bidPhase: "review" },
        });
        const s = dispatch(withEval, {
          type: "BID_EVALUATION_UPDATE",
          payload: { bidPhase: "decided" },
        });
        // bidEvaluation should still be there (BID_EVALUATION_UPDATE does spread)
        expect(s.bidEvaluation).toEqual(mockEvaluation);
        expect(s.bidPhase).toBe("decided");
      });
    });

    describe("step 2 data preservation on GO_BACK", () => {
      it("preserves editedFields when going back from step 2 to step 1", () => {
        const s = dispatchMany(stateAtStep2WithData(), [
          { type: "UPDATE_EDITED_FIELDS", payload: { client_name: "Edited" } },
          { type: "GO_BACK" },
        ]);
        expect(s.currentStep).toBe(1);
        expect(s.editedFields.client_name).toBe("Edited");
      });

      it("preserves bidEvaluation when going back from step 2", () => {
        const mockEvaluation = {
          ai_scores: {
            requirement_match: { score: 85, rationale: "Strong" },
            past_performance: { score: 70, rationale: "Ok" },
            capability_alignment: { score: 90, rationale: "Good" },
            timeline_feasibility: { score: 60, rationale: "Tight" },
            strategic_value: { score: 75, rationale: "Fit" },
          },
          weighted_total: 78.5,
          recommendation: "bid" as const,
          scored_at: "2026-02-24T00:00:00Z",
        };
        const s = dispatchMany(stateAtStep2WithData(), [
          { type: "BID_EVALUATION_UPDATE", payload: { bidEvaluation: mockEvaluation } },
          { type: "GO_BACK" },
        ]);
        expect(s.currentStep).toBe(1);
        expect(s.bidEvaluation).toEqual(mockEvaluation);
      });

      it("preserves extractedData when navigating back and forth", () => {
        const s = dispatchMany(stateAtStep2WithData(), [
          { type: "GO_BACK" },  // step 1
          { type: "GO_NEXT" },  // step 2
        ]);
        expect(s.currentStep).toBe(2);
        expect(s.extractedData).toEqual(mockExtracted);
      });
    });

    describe("step 2 edge cases", () => {
      it("empty editedFields object doesn't corrupt state", () => {
        const base = stateAtStep2WithData();
        const s = dispatch(base, {
          type: "UPDATE_EDITED_FIELDS",
          payload: {},
        });
        expect(s.editedFields).toEqual({});
      });

      it("POPULATE_FROM_EXTRACTION with empty extracted sub-objects doesn't crash", () => {
        const emptyExtracted: ExtractedIntake = {
          input_type: "other",
          input_summary: "Empty doc",
          extracted: {},
          inferred: {},
          gaps: [],
        };
        const s = dispatchMany(INITIAL_STATE, [
          { type: "EXTRACTION_SUCCESS", payload: { extracted: emptyExtracted, research: null } },
          { type: "POPULATE_FROM_EXTRACTION" },
        ]);
        // Should use defaults, not crash
        expect(s.clientName).toBe("");
        expect(s.currentStatePains).toEqual([]);
      });

      it("POPULATE_FROM_EXTRACTION preserves existing form values when extraction has no data", () => {
        // Pre-fill some form fields, then extract an empty document
        const withFormData = dispatch(INITIAL_STATE, {
          type: "UPDATE_FORM_FIELDS",
          payload: { clientName: "Pre-filled Corp" },
        });
        const emptyExtracted: ExtractedIntake = {
          input_type: "other",
          input_summary: "Empty",
          extracted: {},
          inferred: {},
          gaps: [],
        };
        const s = dispatchMany(withFormData, [
          { type: "EXTRACTION_SUCCESS", payload: { extracted: emptyExtracted, research: null } },
          { type: "POPULATE_FROM_EXTRACTION" },
        ]);
        // Pre-filled value should survive since extraction has nothing
        expect(s.clientName).toBe("Pre-filled Corp");
      });

      it("removing array items produces correct results after POPULATE_FROM_EXTRACTION", () => {
        // Simulate user removing one pain point during review
        const s = dispatchMany(stateAtStep2WithData(), [
          { type: "UPDATE_EDITED_FIELDS", payload: { current_state_pains: ["Only this one"] } },
          { type: "POPULATE_FROM_EXTRACTION" },
        ]);
        expect(s.currentStatePains).toEqual(["Only this one"]);
      });
    });
  });
});
