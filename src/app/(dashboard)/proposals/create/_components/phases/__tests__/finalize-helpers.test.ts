import { describe, expect, it } from "vitest";
import { initialState } from "../../create-reducer";
import type { ExtractedIntake } from "@/types/intake";
import {
  computeFinalizeBlockers,
  getSectionGateState,
  isAutoResolvedBlocker,
} from "../finalize-helpers";

describe("finalize helpers", () => {
  it("blocks approval when no sections exist", () => {
    const gate = getSectionGateState(initialState);
    expect(gate.hasBlockingSectionIssues).toBe(true);
    expect(gate.message).toMatch(/Generate your draft/i);
  });

  it("adds failed-sections blocker", () => {
    const state = {
      ...initialState,
      extractedData: {} as unknown as ExtractedIntake,
      bidDecision: "proceed" as const,
      strategyConfirmed: true,
      winThemes: [{ id: "t1", label: "Speed", description: "", confirmed: true }],
      sections: [
        {
          id: "s1",
          sectionType: "exec_summary",
          title: "Exec Summary",
          content: "",
          generationStatus: "failed" as const,
          reviewed: false,
          order: 1,
        },
      ],
    };

    const blockers = computeFinalizeBlockers(state);
    expect(blockers.some((b) => b.id === "sections-failed")).toBe(true);
  });

  it("treats system blockers as non-toggleable", () => {
    expect(isAutoResolvedBlocker("sections-failed")).toBe(true);
    expect(isAutoResolvedBlocker("unreviewed")).toBe(false);
  });
});
