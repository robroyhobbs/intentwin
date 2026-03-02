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
});
