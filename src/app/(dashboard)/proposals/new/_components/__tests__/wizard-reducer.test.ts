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

  // ────────────────────────────────────────────────────────
  // Step 3: Configure & Win Strategy
  // ────────────────────────────────────────────────────────

  describe("step 3 configure flow", () => {
    // Helper: state at step 3 with form data populated
    function stateAtStep3WithData(): WizardState {
      return dispatchMany(INITIAL_STATE, [
        {
          type: "EXTRACTION_SUCCESS",
          payload: { extracted: mockExtracted, research: null },
        },
        { type: "POPULATE_FROM_EXTRACTION" },
        { type: "GO_NEXT" }, // step 2 → step 3
      ]);
    }

    const mockStrategy: import("@/types/outcomes").WinStrategyData = {
      win_themes: ["Cloud expertise", "Rapid delivery", "Cost optimization"],
      success_metrics: ["99.9% uptime SLA", "30% cost reduction"],
      differentiators: ["5x AWS certifications", "200+ cloud migrations"],
      target_outcomes: [
        {
          id: "out-1",
          outcome: "Reduce infrastructure costs by 30%",
          category: "cost_savings",
          priority: "high",
        },
        {
          id: "out-2",
          outcome: "Zero-downtime migration",
          category: "performance",
          priority: "medium",
        },
      ],
      generated_at: "2026-02-24T12:00:00Z",
    };

    describe("UPDATE_CONFIG", () => {
      it("updates tone to conversational", () => {
        const s = dispatch(stateAtStep3WithData(), {
          type: "UPDATE_CONFIG",
          payload: { tone: "conversational" },
        });
        expect(s.tone).toBe("conversational");
      });

      it("updates tone to technical", () => {
        const s = dispatch(stateAtStep3WithData(), {
          type: "UPDATE_CONFIG",
          payload: { tone: "technical" },
        });
        expect(s.tone).toBe("technical");
      });

      it("updates selectedTemplate", () => {
        const s = dispatch(stateAtStep3WithData(), {
          type: "UPDATE_CONFIG",
          payload: { selectedTemplate: "enterprise-rfp" },
        });
        expect(s.selectedTemplate).toBe("enterprise-rfp");
      });

      it("updates selectedSections with full section list", () => {
        const sections = [
          "executive_summary",
          "approach",
          "team",
          "timeline",
          "pricing",
          "compliance",
        ];
        const s = dispatch(stateAtStep3WithData(), {
          type: "UPDATE_CONFIG",
          payload: { selectedSections: sections },
        });
        expect(s.selectedSections).toEqual(sections);
        expect(s.selectedSections).toHaveLength(6);
      });

      it("toggles showAdvanced on and off", () => {
        const s1 = dispatch(stateAtStep3WithData(), {
          type: "UPDATE_CONFIG",
          payload: { showAdvanced: true },
        });
        expect(s1.showAdvanced).toBe(true);

        const s2 = dispatch(s1, {
          type: "UPDATE_CONFIG",
          payload: { showAdvanced: false },
        });
        expect(s2.showAdvanced).toBe(false);
      });

      it("partial update preserves other config fields", () => {
        const s1 = dispatch(stateAtStep3WithData(), {
          type: "UPDATE_CONFIG",
          payload: { tone: "executive", selectedSections: ["a", "b"] },
        });
        const s2 = dispatch(s1, {
          type: "UPDATE_CONFIG",
          payload: { showAdvanced: true },
        });
        expect(s2.tone).toBe("executive");
        expect(s2.selectedSections).toEqual(["a", "b"]);
        expect(s2.showAdvanced).toBe(true);
      });

      it("replaces selectedSections entirely (not merge)", () => {
        const s1 = dispatch(stateAtStep3WithData(), {
          type: "UPDATE_CONFIG",
          payload: { selectedSections: ["a", "b", "c"] },
        });
        const s2 = dispatch(s1, {
          type: "UPDATE_CONFIG",
          payload: { selectedSections: ["x", "y"] },
        });
        expect(s2.selectedSections).toEqual(["x", "y"]);
      });

      it("empty selectedSections array is valid", () => {
        const s = dispatch(stateAtStep3WithData(), {
          type: "UPDATE_CONFIG",
          payload: { selectedSections: [] },
        });
        expect(s.selectedSections).toEqual([]);
      });

      it("does not affect form fields", () => {
        const base = stateAtStep3WithData();
        const s = dispatch(base, {
          type: "UPDATE_CONFIG",
          payload: { tone: "executive" },
        });
        expect(s.clientName).toBe(base.clientName);
        expect(s.scopeDescription).toBe(base.scopeDescription);
      });
    });

    describe("SET_WIN_STRATEGY", () => {
      it("stores complete win strategy data", () => {
        const s = dispatch(stateAtStep3WithData(), {
          type: "SET_WIN_STRATEGY",
          winStrategy: mockStrategy,
        });
        expect(s.winStrategy).toEqual(mockStrategy);
        expect(s.winStrategy?.win_themes).toHaveLength(3);
        expect(s.winStrategy?.target_outcomes).toHaveLength(2);
        expect(s.winStrategy?.differentiators).toHaveLength(2);
      });

      it("overwrites existing win strategy", () => {
        const s1 = dispatch(stateAtStep3WithData(), {
          type: "SET_WIN_STRATEGY",
          winStrategy: mockStrategy,
        });
        const updatedStrategy = {
          ...mockStrategy,
          win_themes: ["Only one theme"],
          generated_at: "2026-02-24T13:00:00Z",
        };
        const s2 = dispatch(s1, {
          type: "SET_WIN_STRATEGY",
          winStrategy: updatedStrategy,
        });
        expect(s2.winStrategy?.win_themes).toEqual(["Only one theme"]);
        expect(s2.winStrategy?.generated_at).toBe("2026-02-24T13:00:00Z");
      });

      it("preserves target outcome priorities", () => {
        const s = dispatch(stateAtStep3WithData(), {
          type: "SET_WIN_STRATEGY",
          winStrategy: mockStrategy,
        });
        expect(s.winStrategy?.target_outcomes[0].priority).toBe("high");
        expect(s.winStrategy?.target_outcomes[1].priority).toBe("medium");
      });

      it("stores fallback strategy with empty arrays", () => {
        const fallback = {
          win_themes: ["Value-driven transformation"],
          success_metrics: [],
          differentiators: [],
          target_outcomes: [],
          generated_at: "2026-02-24T12:00:00Z",
        };
        const s = dispatch(stateAtStep3WithData(), {
          type: "SET_WIN_STRATEGY",
          winStrategy: fallback,
        });
        expect(s.winStrategy).toEqual(fallback);
        expect(s.winStrategy?.success_metrics).toEqual([]);
        expect(s.winStrategy?.target_outcomes).toEqual([]);
      });

      it("does not affect config or form fields", () => {
        const base = dispatchMany(stateAtStep3WithData(), [
          { type: "UPDATE_CONFIG", payload: { tone: "technical", selectedSections: ["a"] } },
        ]);
        const s = dispatch(base, {
          type: "SET_WIN_STRATEGY",
          winStrategy: mockStrategy,
        });
        expect(s.tone).toBe("technical");
        expect(s.selectedSections).toEqual(["a"]);
        expect(s.clientName).toBe(base.clientName);
      });
    });

    describe("UPDATE_FORM_FIELDS on step 3 (advanced options)", () => {
      it("updates competitiveIntel from advanced options", () => {
        const s = dispatch(stateAtStep3WithData(), {
          type: "UPDATE_FORM_FIELDS",
          payload: { competitiveIntel: "Incumbent is Deloitte" },
        });
        expect(s.competitiveIntel).toBe("Incumbent is Deloitte");
      });

      it("updates complianceRequirements from advanced options", () => {
        const s = dispatch(stateAtStep3WithData(), {
          type: "UPDATE_FORM_FIELDS",
          payload: { complianceRequirements: "SOC 2, FedRAMP" },
        });
        expect(s.complianceRequirements).toBe("SOC 2, FedRAMP");
      });

      it("updates budgetRange and timelineExpectation together", () => {
        const s = dispatch(stateAtStep3WithData(), {
          type: "UPDATE_FORM_FIELDS",
          payload: { budgetRange: "$500K-$1M", timelineExpectation: "6 months" },
        });
        expect(s.budgetRange).toBe("$500K-$1M");
        expect(s.timelineExpectation).toBe("6 months");
      });

      it("preserves config when updating form fields", () => {
        const base = dispatchMany(stateAtStep3WithData(), [
          { type: "UPDATE_CONFIG", payload: { tone: "executive" } },
        ]);
        const s = dispatch(base, {
          type: "UPDATE_FORM_FIELDS",
          payload: { competitiveIntel: "Accenture" },
        });
        expect(s.tone).toBe("executive");
        expect(s.competitiveIntel).toBe("Accenture");
      });
    });

    describe("step 3 data preservation on GO_BACK", () => {
      it("preserves config (tone, sections) when going back to step 2", () => {
        const s = dispatchMany(stateAtStep3WithData(), [
          { type: "UPDATE_CONFIG", payload: { tone: "technical", selectedSections: ["a", "b", "c"] } },
          { type: "GO_BACK" },
        ]);
        expect(s.currentStep).toBe(2);
        expect(s.tone).toBe("technical");
        expect(s.selectedSections).toEqual(["a", "b", "c"]);
      });

      it("preserves win strategy when going back to step 2", () => {
        const s = dispatchMany(stateAtStep3WithData(), [
          { type: "SET_WIN_STRATEGY", winStrategy: mockStrategy },
          { type: "GO_BACK" },
        ]);
        expect(s.currentStep).toBe(2);
        expect(s.winStrategy).toEqual(mockStrategy);
      });

      it("preserves advanced option form fields when going back", () => {
        const s = dispatchMany(stateAtStep3WithData(), [
          { type: "UPDATE_FORM_FIELDS", payload: { competitiveIntel: "IBM", budgetRange: "$2M" } },
          { type: "GO_BACK" },
        ]);
        expect(s.competitiveIntel).toBe("IBM");
        expect(s.budgetRange).toBe("$2M");
      });

      it("preserves showAdvanced state when going back and returning", () => {
        const s = dispatchMany(stateAtStep3WithData(), [
          { type: "UPDATE_CONFIG", payload: { showAdvanced: true } },
          { type: "GO_BACK" },
          { type: "GO_NEXT" },
        ]);
        expect(s.currentStep).toBe(3);
        expect(s.showAdvanced).toBe(true);
      });

      it("preserves all step 3 state across multiple back/forward cycles", () => {
        const s = dispatchMany(stateAtStep3WithData(), [
          { type: "UPDATE_CONFIG", payload: { tone: "executive", selectedSections: ["x"] } },
          { type: "SET_WIN_STRATEGY", winStrategy: mockStrategy },
          { type: "UPDATE_FORM_FIELDS", payload: { competitiveIntel: "KPMG" } },
          { type: "GO_BACK" }, // step 2
          { type: "GO_BACK" }, // step 1
          { type: "GO_NEXT" }, // step 2
          { type: "GO_NEXT" }, // step 3
        ]);
        expect(s.currentStep).toBe(3);
        expect(s.tone).toBe("executive");
        expect(s.selectedSections).toEqual(["x"]);
        expect(s.winStrategy).toEqual(mockStrategy);
        expect(s.competitiveIntel).toBe("KPMG");
      });
    });

    describe("step 3 → step 4 transition", () => {
      it("GENERATION_START from step 3 advances to step 4 with proposalId", () => {
        const base = dispatchMany(stateAtStep3WithData(), [
          { type: "UPDATE_CONFIG", payload: { selectedSections: ["exec_summary", "approach"] } },
          { type: "SET_WIN_STRATEGY", winStrategy: mockStrategy },
        ]);
        const s = dispatch(base, { type: "GENERATION_START", proposalId: "prop-456" });
        expect(s.currentStep).toBe(4);
        expect(s.proposalId).toBe("prop-456");
        expect(s.generationStatus).toBe("generating");
        expect(s.maxCompletedStep).toBe(3);
      });

      it("config and strategy survive transition to step 4", () => {
        const base = dispatchMany(stateAtStep3WithData(), [
          { type: "UPDATE_CONFIG", payload: { tone: "executive", selectedSections: ["a", "b"] } },
          { type: "SET_WIN_STRATEGY", winStrategy: mockStrategy },
          { type: "UPDATE_FORM_FIELDS", payload: { competitiveIntel: "EY" } },
        ]);
        const s = dispatch(base, { type: "GENERATION_START", proposalId: "prop-789" });
        expect(s.tone).toBe("executive");
        expect(s.selectedSections).toEqual(["a", "b"]);
        expect(s.winStrategy).toEqual(mockStrategy);
        expect(s.competitiveIntel).toBe("EY");
      });
    });

    describe("step 3 edge cases", () => {
      it("UPDATE_CONFIG with empty payload doesn't corrupt state", () => {
        const base = stateAtStep3WithData();
        const s = dispatch(base, { type: "UPDATE_CONFIG", payload: {} });
        expect(s.tone).toBe(base.tone);
        expect(s.selectedSections).toEqual(base.selectedSections);
      });

      it("SET_WIN_STRATEGY then UPDATE_CONFIG don't interfere", () => {
        const s = dispatchMany(stateAtStep3WithData(), [
          { type: "SET_WIN_STRATEGY", winStrategy: mockStrategy },
          { type: "UPDATE_CONFIG", payload: { tone: "conversational" } },
        ]);
        expect(s.winStrategy).toEqual(mockStrategy);
        expect(s.tone).toBe("conversational");
      });

      it("multiple SET_WIN_STRATEGY calls only keep the last", () => {
        const strat1 = { ...mockStrategy, win_themes: ["Theme A"] };
        const strat2 = { ...mockStrategy, win_themes: ["Theme B"] };
        const s = dispatchMany(stateAtStep3WithData(), [
          { type: "SET_WIN_STRATEGY", winStrategy: strat1 },
          { type: "SET_WIN_STRATEGY", winStrategy: strat2 },
        ]);
        expect(s.winStrategy?.win_themes).toEqual(["Theme B"]);
      });

      it("RESET clears all step 3 configuration", () => {
        const s = dispatchMany(stateAtStep3WithData(), [
          { type: "UPDATE_CONFIG", payload: { tone: "executive", selectedSections: ["a"] } },
          { type: "SET_WIN_STRATEGY", winStrategy: mockStrategy },
          { type: "UPDATE_FORM_FIELDS", payload: { competitiveIntel: "Deloitte" } },
          { type: "RESET" },
        ]);
        expect(s.tone).toBe("professional");
        expect(s.selectedSections).toEqual([]);
        expect(s.winStrategy).toBeNull();
        expect(s.competitiveIntel).toBe("");
        expect(s.showAdvanced).toBe(false);
      });

      it("solicitation type change via UPDATE_FORM_FIELDS doesn't clear config", () => {
        const s = dispatchMany(stateAtStep3WithData(), [
          { type: "UPDATE_CONFIG", payload: { tone: "technical", selectedSections: ["a"] } },
          { type: "UPDATE_FORM_FIELDS", payload: { solicitationType: "RFI" } },
        ]);
        expect(s.solicitationType).toBe("RFI");
        expect(s.tone).toBe("technical");
        expect(s.selectedSections).toEqual(["a"]);
      });

      it("RESTORE_DRAFT preserves step 3 config fields", () => {
        const draft: Partial<WizardState> = {
          currentStep: 3,
          maxCompletedStep: 2,
          tone: "executive",
          selectedSections: ["exec_summary", "approach", "pricing"],
          showAdvanced: true,
          competitiveIntel: "Saved intel",
          winStrategy: mockStrategy,
        };
        const s = dispatch(INITIAL_STATE, { type: "RESTORE_DRAFT", state: draft });
        expect(s.currentStep).toBe(3);
        expect(s.tone).toBe("executive");
        expect(s.selectedSections).toEqual(["exec_summary", "approach", "pricing"]);
        expect(s.showAdvanced).toBe(true);
        expect(s.competitiveIntel).toBe("Saved intel");
        expect(s.winStrategy).toEqual(mockStrategy);
      });
    });
  });

  // ────────────────────────────────────────────────────────
  // Step 4: Generate & Progress
  // ────────────────────────────────────────────────────────

  describe("step 4 generation flow", () => {
    const mockStrategy: import("@/types/outcomes").WinStrategyData = {
      win_themes: ["Cloud expertise", "Rapid delivery"],
      success_metrics: [],
      differentiators: [],
      target_outcomes: [],
      generated_at: "2026-02-24T12:00:00Z",
    };

    // Helper: state fully configured at step 3, ready to generate
    function stateReadyToGenerate(): WizardState {
      return dispatchMany(INITIAL_STATE, [
        { type: "UPDATE_FORM_FIELDS", payload: { clientName: "Acme Corp", solicitationType: "RFP" } },
        { type: "GO_NEXT" }, // step 2
        { type: "GO_NEXT" }, // step 3
        { type: "UPDATE_CONFIG", payload: { tone: "executive", selectedSections: ["exec_summary", "approach", "pricing"] } },
        { type: "SET_WIN_STRATEGY", winStrategy: mockStrategy },
      ]);
    }

    const mockSections = [
      { type: "exec_summary", title: "Executive Summary", status: "completed" as const },
      { type: "approach", title: "Approach", status: "generating" as const },
      { type: "pricing", title: "Pricing", status: "pending" as const },
    ];

    describe("GENERATION_START", () => {
      it("sets proposalId, status to generating, advances to step 4", () => {
        const s = dispatch(stateReadyToGenerate(), {
          type: "GENERATION_START",
          proposalId: "gen-100",
        });
        expect(s.proposalId).toBe("gen-100");
        expect(s.generationStatus).toBe("generating");
        expect(s.currentStep).toBe(4);
        expect(s.maxCompletedStep).toBe(3);
      });

      it("preserves all wizard data from prior steps", () => {
        const s = dispatch(stateReadyToGenerate(), {
          type: "GENERATION_START",
          proposalId: "gen-101",
        });
        expect(s.clientName).toBe("Acme Corp");
        expect(s.tone).toBe("executive");
        expect(s.selectedSections).toEqual(["exec_summary", "approach", "pricing"]);
        expect(s.winStrategy).toEqual(mockStrategy);
      });

      it("double GENERATION_START overwrites proposalId (idempotent)", () => {
        const s = dispatchMany(stateReadyToGenerate(), [
          { type: "GENERATION_START", proposalId: "first-id" },
          { type: "GENERATION_START", proposalId: "second-id" },
        ]);
        expect(s.proposalId).toBe("second-id");
        expect(s.currentStep).toBe(4);
      });
    });

    describe("SECTION_STATUS_UPDATE", () => {
      it("updates section progress list", () => {
        const s = dispatchMany(stateReadyToGenerate(), [
          { type: "GENERATION_START", proposalId: "gen-200" },
          { type: "SECTION_STATUS_UPDATE", sections: mockSections },
        ]);
        expect(s.sectionProgress).toEqual(mockSections);
        expect(s.sectionProgress).toHaveLength(3);
      });

      it("replaces previous section progress on each update", () => {
        const s1 = dispatchMany(stateReadyToGenerate(), [
          { type: "GENERATION_START", proposalId: "gen-201" },
          { type: "SECTION_STATUS_UPDATE", sections: mockSections },
        ]);
        const updatedSections = [
          { type: "exec_summary", title: "Executive Summary", status: "completed" as const },
          { type: "approach", title: "Approach", status: "completed" as const },
          { type: "pricing", title: "Pricing", status: "generating" as const },
        ];
        const s2 = dispatch(s1, { type: "SECTION_STATUS_UPDATE", sections: updatedSections });
        expect(s2.sectionProgress[1].status).toBe("completed"); // approach now completed
        expect(s2.sectionProgress[2].status).toBe("generating"); // pricing now generating
      });

      it("does not affect other wizard state fields", () => {
        const base = dispatch(stateReadyToGenerate(), {
          type: "GENERATION_START",
          proposalId: "gen-202",
        });
        const s = dispatch(base, { type: "SECTION_STATUS_UPDATE", sections: mockSections });
        expect(s.proposalId).toBe("gen-202");
        expect(s.generationStatus).toBe("generating");
        expect(s.tone).toBe("executive");
      });

      it("handles empty section list", () => {
        const s = dispatchMany(stateReadyToGenerate(), [
          { type: "GENERATION_START", proposalId: "gen-203" },
          { type: "SECTION_STATUS_UPDATE", sections: [] },
        ]);
        expect(s.sectionProgress).toEqual([]);
      });
    });

    describe("GENERATION_COMPLETE", () => {
      it("sets status to complete", () => {
        const s = dispatchMany(stateReadyToGenerate(), [
          { type: "GENERATION_START", proposalId: "gen-300" },
          { type: "SECTION_STATUS_UPDATE", sections: mockSections },
          { type: "GENERATION_COMPLETE" },
        ]);
        expect(s.generationStatus).toBe("complete");
      });

      it("preserves proposalId and section progress", () => {
        const allCompleted = mockSections.map((s) => ({ ...s, status: "completed" as const }));
        const s = dispatchMany(stateReadyToGenerate(), [
          { type: "GENERATION_START", proposalId: "gen-301" },
          { type: "SECTION_STATUS_UPDATE", sections: allCompleted },
          { type: "GENERATION_COMPLETE" },
        ]);
        expect(s.proposalId).toBe("gen-301");
        expect(s.sectionProgress).toEqual(allCompleted);
      });

      it("stays on step 4 after completion", () => {
        const s = dispatchMany(stateReadyToGenerate(), [
          { type: "GENERATION_START", proposalId: "gen-302" },
          { type: "GENERATION_COMPLETE" },
        ]);
        expect(s.currentStep).toBe(4);
      });
    });

    describe("GENERATION_FAIL", () => {
      it("sets status to failed", () => {
        const s = dispatchMany(stateReadyToGenerate(), [
          { type: "GENERATION_START", proposalId: "gen-400" },
          { type: "GENERATION_FAIL" },
        ]);
        expect(s.generationStatus).toBe("failed");
      });

      it("preserves proposalId on failure", () => {
        const s = dispatchMany(stateReadyToGenerate(), [
          { type: "GENERATION_START", proposalId: "gen-401" },
          { type: "GENERATION_FAIL" },
        ]);
        expect(s.proposalId).toBe("gen-401");
      });

      it("preserves partial section progress on failure", () => {
        const partialProgress = [
          { type: "exec_summary", title: "Executive Summary", status: "completed" as const },
          { type: "approach", title: "Approach", status: "failed" as const },
          { type: "pricing", title: "Pricing", status: "pending" as const },
        ];
        const s = dispatchMany(stateReadyToGenerate(), [
          { type: "GENERATION_START", proposalId: "gen-402" },
          { type: "SECTION_STATUS_UPDATE", sections: partialProgress },
          { type: "GENERATION_FAIL" },
        ]);
        expect(s.sectionProgress).toEqual(partialProgress);
      });
    });

    describe("full generation lifecycle", () => {
      it("complete flow: start → progress updates → complete", () => {
        const s = dispatchMany(stateReadyToGenerate(), [
          { type: "GENERATION_START", proposalId: "lifecycle-1" },
          // First poll: sections created, all pending
          {
            type: "SECTION_STATUS_UPDATE",
            sections: [
              { type: "exec_summary", title: "Executive Summary", status: "pending" as const },
              { type: "approach", title: "Approach", status: "pending" as const },
            ],
          },
          // Second poll: first section generating
          {
            type: "SECTION_STATUS_UPDATE",
            sections: [
              { type: "exec_summary", title: "Executive Summary", status: "generating" as const },
              { type: "approach", title: "Approach", status: "pending" as const },
            ],
          },
          // Third poll: first complete, second generating
          {
            type: "SECTION_STATUS_UPDATE",
            sections: [
              { type: "exec_summary", title: "Executive Summary", status: "completed" as const },
              { type: "approach", title: "Approach", status: "generating" as const },
            ],
          },
          // Fourth poll: all complete
          {
            type: "SECTION_STATUS_UPDATE",
            sections: [
              { type: "exec_summary", title: "Executive Summary", status: "completed" as const },
              { type: "approach", title: "Approach", status: "completed" as const },
            ],
          },
          { type: "GENERATION_COMPLETE" },
        ]);
        expect(s.generationStatus).toBe("complete");
        expect(s.sectionProgress.every((sp) => sp.status === "completed")).toBe(true);
        expect(s.proposalId).toBe("lifecycle-1");
      });

      it("partial failure flow: some complete, some failed", () => {
        const s = dispatchMany(stateReadyToGenerate(), [
          { type: "GENERATION_START", proposalId: "lifecycle-2" },
          {
            type: "SECTION_STATUS_UPDATE",
            sections: [
              { type: "exec_summary", title: "Executive Summary", status: "completed" as const },
              { type: "approach", title: "Approach", status: "failed" as const },
              { type: "pricing", title: "Pricing", status: "completed" as const },
            ],
          },
          { type: "GENERATION_COMPLETE" },
        ]);
        expect(s.generationStatus).toBe("complete");
        const completed = s.sectionProgress.filter((sp) => sp.status === "completed");
        const failed = s.sectionProgress.filter((sp) => sp.status === "failed");
        expect(completed).toHaveLength(2);
        expect(failed).toHaveLength(1);
      });

      it("RESET after generation clears everything including proposalId", () => {
        const s = dispatchMany(stateReadyToGenerate(), [
          { type: "GENERATION_START", proposalId: "lifecycle-3" },
          { type: "SECTION_STATUS_UPDATE", sections: mockSections },
          { type: "GENERATION_COMPLETE" },
          { type: "RESET" },
        ]);
        expect(s.proposalId).toBeNull();
        expect(s.generationStatus).toBe("idle");
        expect(s.sectionProgress).toEqual([]);
        expect(s.currentStep).toBe(1);
      });

      it("RESTORE_DRAFT resets generation state for safety", () => {
        const draft: Partial<WizardState> = {
          currentStep: 4,
          maxCompletedStep: 3,
          proposalId: "restored-prop",
          generationStatus: "generating",
          sectionProgress: mockSections,
        };
        const s = dispatch(INITIAL_STATE, { type: "RESTORE_DRAFT", state: draft });
        // RESTORE_DRAFT resets transient fields
        expect(s.generationStatus).toBe("idle");
        expect(s.sectionProgress).toEqual([]);
        // But preserves step and proposalId
        expect(s.currentStep).toBe(4);
        expect(s.proposalId).toBe("restored-prop");
      });
    });

    describe("step 4 navigation constraints", () => {
      it("GO_NEXT on step 4 does nothing (step 4 is the last)", () => {
        const s = dispatchMany(stateReadyToGenerate(), [
          { type: "GENERATION_START", proposalId: "nav-1" },
          { type: "GO_NEXT" },
        ]);
        expect(s.currentStep).toBe(4);
      });

      it("GO_BACK from step 4 returns to step 3 (reducer allows it)", () => {
        const s = dispatchMany(stateReadyToGenerate(), [
          { type: "GENERATION_START", proposalId: "nav-2" },
          { type: "GO_BACK" },
        ]);
        // The reducer allows GO_BACK from step 4, but the UI hides the back button
        expect(s.currentStep).toBe(3);
        // proposalId and generation status should be preserved
        expect(s.proposalId).toBe("nav-2");
      });
    });
  });
});
