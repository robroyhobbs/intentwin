import { describe, it, expect } from "vitest";
import { getSectionsForSolicitationType } from "@/lib/ai/pipeline/section-configs";

/**
 * Tests for the templates API backing logic.
 * Tests getSectionsForSolicitationType directly since it's the
 * single source of truth for section configs.
 */

// Constants matching the API route
const REQUIRED_SECTIONS = new Set([
  "executive_summary",
  "understanding",
  "approach",
]);
const DEFAULT_DISABLED_SECTIONS = new Set([
  "risk_mitigation",
  "exceptions_terms",
]);

function toApiShape(solicitationType: string) {
  const configs = getSectionsForSolicitationType(solicitationType);
  return configs.map((c) => ({
    type: c.type,
    title: c.title,
    order: c.order,
    required: REQUIRED_SECTIONS.has(c.type),
    defaultEnabled: !DEFAULT_DISABLED_SECTIONS.has(c.type),
  }));
}

describe("templates API logic", () => {
  describe("RFP template", () => {
    const sections = toApiShape("RFP");

    it("returns 13 sections for RFP", () => {
      expect(sections.length).toBe(13);
    });

    it("includes cover letter for RFP", () => {
      expect(sections.some((s) => s.type === "cover_letter")).toBe(true);
    });

    it("includes compliance matrix for RFP", () => {
      expect(sections.some((s) => s.type === "compliance_matrix_section")).toBe(true);
    });

    it("includes exceptions to terms for RFP", () => {
      expect(sections.some((s) => s.type === "exceptions_terms")).toBe(true);
    });

    it("marks executive_summary, understanding, approach as required", () => {
      for (const type of ["executive_summary", "understanding", "approach"]) {
        const section = sections.find((s) => s.type === type);
        expect(section?.required).toBe(true);
      }
    });

    it("marks risk_mitigation as default disabled", () => {
      const risk = sections.find((s) => s.type === "risk_mitigation");
      expect(risk?.defaultEnabled).toBe(false);
    });

    it("marks exceptions_terms as default disabled", () => {
      const exc = sections.find((s) => s.type === "exceptions_terms");
      expect(exc?.defaultEnabled).toBe(false);
    });

    it("returns sections sorted by order", () => {
      for (let i = 1; i < sections.length; i++) {
        expect(sections[i].order).toBeGreaterThanOrEqual(sections[i - 1].order);
      }
    });
  });

  describe("RFI template", () => {
    const sections = toApiShape("RFI");

    it("returns fewer sections than RFP (no compliance matrix or exceptions)", () => {
      expect(sections.length).toBeLessThan(toApiShape("RFP").length);
    });

    it("includes cover letter", () => {
      expect(sections.some((s) => s.type === "cover_letter")).toBe(true);
    });

    it("does NOT include compliance matrix", () => {
      expect(sections.some((s) => s.type === "compliance_matrix_section")).toBe(false);
    });

    it("does NOT include exceptions", () => {
      expect(sections.some((s) => s.type === "exceptions_terms")).toBe(false);
    });
  });

  describe("SOW template", () => {
    const sections = toApiShape("SOW");

    it("includes cover letter", () => {
      expect(sections.some((s) => s.type === "cover_letter")).toBe(true);
    });

    it("includes exceptions (contractual focus)", () => {
      expect(sections.some((s) => s.type === "exceptions_terms")).toBe(true);
    });

    it("does NOT include compliance matrix", () => {
      expect(sections.some((s) => s.type === "compliance_matrix_section")).toBe(false);
    });
  });

  describe("Proactive template", () => {
    const sections = toApiShape("Proactive");

    it("does NOT include cover letter (unsolicited)", () => {
      expect(sections.some((s) => s.type === "cover_letter")).toBe(false);
    });

    it("does NOT include compliance matrix", () => {
      expect(sections.some((s) => s.type === "compliance_matrix_section")).toBe(false);
    });

    it("still includes core sections (exec summary, approach, etc.)", () => {
      expect(sections.some((s) => s.type === "executive_summary")).toBe(true);
      expect(sections.some((s) => s.type === "approach")).toBe(true);
    });
  });

  describe("unknown solicitation type", () => {
    const sections = toApiShape("CUSTOM");

    it("falls back to cover letter only for boilerplate", () => {
      expect(sections.some((s) => s.type === "cover_letter")).toBe(true);
      expect(sections.some((s) => s.type === "compliance_matrix_section")).toBe(false);
      expect(sections.some((s) => s.type === "exceptions_terms")).toBe(false);
    });

    it("still includes all non-boilerplate sections", () => {
      expect(sections.some((s) => s.type === "executive_summary")).toBe(true);
      expect(sections.some((s) => s.type === "pricing")).toBe(true);
    });
  });

  describe("section properties", () => {
    it("every section has a non-empty title", () => {
      const sections = toApiShape("RFP");
      for (const s of sections) {
        expect(s.title.length).toBeGreaterThan(0);
      }
    });

    it("every section has a non-empty type", () => {
      const sections = toApiShape("RFP");
      for (const s of sections) {
        expect(s.type.length).toBeGreaterThan(0);
      }
    });

    it("no duplicate section types within a template", () => {
      const sections = toApiShape("RFP");
      const types = sections.map((s) => s.type);
      expect(new Set(types).size).toBe(types.length);
    });
  });
});
