import { describe, expect, it } from "vitest";

import {
  mapProposalSectionsToProgress,
  normalizeDraftSectionStatus,
  normalizeProposalSectionStatus,
} from "../proposal-section-state";

describe("proposal-section-state", () => {
  describe("normalizeProposalSectionStatus", () => {
    it("preserves known API statuses", () => {
      expect(normalizeProposalSectionStatus("completed")).toBe("completed");
      expect(normalizeProposalSectionStatus("failed")).toBe("failed");
      expect(normalizeProposalSectionStatus("generating")).toBe("generating");
    });

    it("falls back to pending for unknown statuses", () => {
      expect(normalizeProposalSectionStatus("queued")).toBe("pending");
      expect(normalizeProposalSectionStatus("")).toBe("pending");
    });
  });

  describe("normalizeDraftSectionStatus", () => {
    it("maps completed API sections to complete draft sections", () => {
      expect(normalizeDraftSectionStatus("completed")).toBe("complete");
    });

    it("maps unknown API statuses to pending draft sections", () => {
      expect(normalizeDraftSectionStatus("waiting")).toBe("pending");
    });
  });

  describe("mapProposalSectionsToProgress", () => {
    it("builds wizard section progress entries from proposal API sections", () => {
      expect(
        mapProposalSectionsToProgress([
          {
            section_type: "executive_summary",
            title: "Executive Summary",
            generation_status: "completed",
          },
          {
            section_type: "technical_approach",
            title: "Technical Approach",
            generation_status: "queued",
          },
        ]),
      ).toEqual([
        {
          type: "executive_summary",
          title: "Executive Summary",
          status: "completed",
        },
        {
          type: "technical_approach",
          title: "Technical Approach",
          status: "pending",
        },
      ]);
    });
  });
});
