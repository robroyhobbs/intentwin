import { describe, expect, it } from "vitest";

import { prepareProposalDetailSnapshot } from "../proposal-detail-snapshot";

describe("prepareProposalDetailSnapshot", () => {
  it("prefers the first completed section as the initial active section", () => {
    const result = prepareProposalDetailSnapshot({
      proposal: { id: "proposal-1", status: "review" },
      sections: [
        { id: "sec-1", generation_status: "failed" },
        { id: "sec-2", generation_status: "completed" },
        { id: "sec-3", generation_status: "completed" },
      ],
      initialSectionSet: false,
    });

    expect(result.activeSectionId).toBe("sec-2");
    expect(result.shouldSetInitialSection).toBe(true);
  });

  it("falls back to the first section when none are completed", () => {
    const result = prepareProposalDetailSnapshot({
      proposal: { id: "proposal-1", status: "generating" },
      sections: [
        { id: "sec-1", generation_status: "generating" },
        { id: "sec-2", generation_status: "pending" },
      ],
      initialSectionSet: false,
    });

    expect(result.activeSectionId).toBe("sec-1");
  });

  it("does not reset the active section after the initial selection", () => {
    const result = prepareProposalDetailSnapshot({
      proposal: { id: "proposal-1", status: "review" },
      sections: [{ id: "sec-1", generation_status: "completed" }],
      initialSectionSet: true,
    });

    expect(result.activeSectionId).toBeNull();
    expect(result.shouldSetInitialSection).toBe(false);
  });

  it("normalizes missing sections to an empty array", () => {
    const result = prepareProposalDetailSnapshot({
      proposal: { id: "proposal-1", status: "draft" },
      initialSectionSet: false,
    });

    expect(result.sections).toEqual([]);
    expect(result.activeSectionId).toBeNull();
  });
});
