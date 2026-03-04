import { describe, it, expect } from "vitest";
import { createReducer, initialState } from "../create-reducer";

describe("createReducer", () => {
  it("starts in intake phase", () => {
    expect(initialState.phase).toBe("intake");
  });

  it("transitions phase on SET_PHASE", () => {
    const state = createReducer(initialState, {
      type: "SET_PHASE",
      phase: "strategy",
    });
    expect(state.phase).toBe("strategy");
  });

  it("tracks completed phases", () => {
    const state = createReducer(initialState, {
      type: "COMPLETE_PHASE",
      phase: "intake",
    });
    expect(state.completedPhases.has("intake")).toBe(true);
  });

  it("sets extracting state on EXTRACTION_START", () => {
    const state = createReducer(initialState, {
      type: "EXTRACTION_START",
    });
    expect(state.isExtracting).toBe(true);
    expect(state.extractionError).toBeNull();
  });

  it("handles extraction success", () => {
    const extracted = {
      input_type: "formal_rfp",
      input_summary: "test",
      extracted: {},
      inferred: {},
      gaps: [],
    } as any;
    const state = createReducer(
      { ...initialState, isExtracting: true },
      { type: "EXTRACTION_SUCCESS", payload: { extracted } },
    );
    expect(state.isExtracting).toBe(false);
    expect(state.extractedData).toBe(extracted);
  });

  it("toggles win theme confirmation", () => {
    const themes = [
      {
        id: "t1",
        label: "Speed",
        description: "Fast",
        confirmed: false,
      },
    ];
    const s1 = createReducer(
      { ...initialState, winThemes: themes },
      { type: "TOGGLE_WIN_THEME", themeId: "t1" },
    );
    expect(s1.winThemes[0].confirmed).toBe(true);
  });

  it("computes confidence from completed phases and blockers", () => {
    let state = createReducer(initialState, {
      type: "COMPLETE_PHASE",
      phase: "intake",
    });
    state = createReducer(state, {
      type: "COMPLETE_PHASE",
      phase: "strategy",
    });
    expect(state.confidence).toBeGreaterThan(initialState.confidence);
  });

  it("marks section as reviewed", () => {
    const sections = [
      {
        id: "s1",
        sectionType: "exec_summary",
        title: "Exec Summary",
        content: "text",
        generationStatus: "complete" as const,
        reviewed: false,
        order: 1,
      },
    ];
    const state = createReducer(
      { ...initialState, sections },
      { type: "MARK_SECTION_REVIEWED", sectionId: "s1" },
    );
    expect(state.sections[0].reviewed).toBe(true);
  });

  it("resolves a blocker", () => {
    const blockers = [
      {
        id: "b1",
        label: "Missing goal",
        resolved: false,
        phase: "intake" as const,
      },
    ];
    const state = createReducer(
      { ...initialState, blockers },
      { type: "RESOLVE_BLOCKER", blockerId: "b1" },
    );
    expect(state.blockers[0].resolved).toBe(true);
  });

  describe("phase transitions", () => {
    it("transitions intake -> strategy", () => {
      const state = createReducer(initialState, {
        type: "SET_PHASE",
        phase: "strategy",
      });
      expect(state.phase).toBe("strategy");
    });

    it("transitions strategy -> draft", () => {
      const atStrategy = createReducer(initialState, {
        type: "SET_PHASE",
        phase: "strategy",
      });
      const state = createReducer(atStrategy, {
        type: "SET_PHASE",
        phase: "draft",
      });
      expect(state.phase).toBe("draft");
    });

    it("transitions draft -> finalize", () => {
      const atDraft = createReducer(initialState, {
        type: "SET_PHASE",
        phase: "draft",
      });
      const state = createReducer(atDraft, {
        type: "SET_PHASE",
        phase: "finalize",
      });
      expect(state.phase).toBe("finalize");
    });

    it("allows skipping phases (reducer does not enforce ordering)", () => {
      const state = createReducer(initialState, {
        type: "SET_PHASE",
        phase: "finalize",
      });
      expect(state.phase).toBe("finalize");
    });
  });

  describe("error recovery from failed generation", () => {
    it("sets generationStatus to failed on GENERATION_FAIL", () => {
      const generating = createReducer(initialState, {
        type: "GENERATION_START",
      });
      expect(generating.generationStatus).toBe("generating");

      const failed = createReducer(generating, { type: "GENERATION_FAIL" });
      expect(failed.generationStatus).toBe("failed");
    });

    it("can restart generation after failure", () => {
      const failed = createReducer(
        { ...initialState, generationStatus: "failed" },
        { type: "GENERATION_START" },
      );
      expect(failed.generationStatus).toBe("generating");
    });

    it("can complete generation after restart", () => {
      const generating = createReducer(
        { ...initialState, generationStatus: "failed" },
        { type: "GENERATION_START" },
      );
      const complete = createReducer(generating, {
        type: "GENERATION_COMPLETE",
      });
      expect(complete.generationStatus).toBe("complete");
    });
  });

  describe("confidence scoring", () => {
    it("starts at 0 confidence", () => {
      expect(initialState.confidence).toBe(0);
    });

    it("gains 25 points for completing intake", () => {
      const state = createReducer(initialState, {
        type: "COMPLETE_PHASE",
        phase: "intake",
      });
      expect(state.confidence).toBe(25);
    });

    it("gains 25 for intake + 25 for strategy = 50", () => {
      let state = createReducer(initialState, {
        type: "COMPLETE_PHASE",
        phase: "intake",
      });
      state = createReducer(state, {
        type: "COMPLETE_PHASE",
        phase: "strategy",
      });
      expect(state.confidence).toBe(50);
    });

    it("reaches 100 when all phases completed", () => {
      let state = initialState;
      for (const phase of [
        "intake",
        "strategy",
        "draft",
        "finalize",
      ] as const) {
        state = createReducer(state, {
          type: "COMPLETE_PHASE",
          phase,
        });
      }
      expect(state.confidence).toBe(100);
    });

    it("reduces confidence by 5 for each unresolved blocker", () => {
      let state = createReducer(initialState, {
        type: "COMPLETE_PHASE",
        phase: "intake",
      });
      state = createReducer(state, {
        type: "SET_BLOCKERS",
        blockers: [
          { id: "b1", label: "Missing info", resolved: false, phase: "intake" },
          {
            id: "b2",
            label: "Missing scope",
            resolved: false,
            phase: "intake",
          },
        ],
      });
      // 25 (intake) - 10 (2 blockers * 5) = 15
      expect(state.confidence).toBe(15);
    });

    it("confidence never drops below 0", () => {
      const state = createReducer(initialState, {
        type: "SET_BLOCKERS",
        blockers: Array.from({ length: 10 }, (_, i) => ({
          id: `b${i}`,
          label: `Blocker ${i}`,
          resolved: false,
          phase: "intake" as const,
        })),
      });
      expect(state.confidence).toBe(0);
    });

    it("resolved blockers do not reduce confidence", () => {
      let state = createReducer(initialState, {
        type: "COMPLETE_PHASE",
        phase: "intake",
      });
      state = createReducer(state, {
        type: "SET_BLOCKERS",
        blockers: [
          { id: "b1", label: "Missing info", resolved: true, phase: "intake" },
        ],
      });
      expect(state.confidence).toBe(25);
    });
  });

  describe("RESET", () => {
    it("returns to initial state", () => {
      let state = createReducer(initialState, {
        type: "SET_PHASE",
        phase: "draft",
      });
      state = createReducer(state, {
        type: "COMPLETE_PHASE",
        phase: "intake",
      });
      const reset = createReducer(state, { type: "RESET" });
      expect(reset.phase).toBe("intake");
      expect(reset.confidence).toBe(0);
      expect(reset.completedPhases.size).toBe(0);
    });
  });

  describe("REVIEW_ALL_SECTIONS", () => {
    it("marks all completed sections as reviewed", () => {
      const sections = [
        {
          id: "s1",
          sectionType: "exec_summary",
          title: "Summary",
          content: "text",
          generationStatus: "complete" as const,
          reviewed: false,
          order: 1,
        },
        {
          id: "s2",
          sectionType: "approach",
          title: "Approach",
          content: "",
          generationStatus: "generating" as const,
          reviewed: false,
          order: 2,
        },
      ];
      const state = createReducer(
        { ...initialState, sections },
        { type: "REVIEW_ALL_SECTIONS" },
      );
      expect(state.sections[0].reviewed).toBe(true);
      expect(state.sections[1].reviewed).toBe(false);
    });
  });

  describe("APPROVE_FINAL", () => {
    it("sets finalApproved to true", () => {
      const state = createReducer(initialState, { type: "APPROVE_FINAL" });
      expect(state.finalApproved).toBe(true);
    });
  });

  describe("SET_EXPORTED_URL", () => {
    it("sets the exported URL", () => {
      const state = createReducer(initialState, {
        type: "SET_EXPORTED_URL",
        url: "https://example.com/proposal.docx",
      });
      expect(state.exportedUrl).toBe("https://example.com/proposal.docx");
    });
  });
});
