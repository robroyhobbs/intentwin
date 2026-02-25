import { describe, it, expect } from "vitest";

/**
 * Tests for logic extracted from step-configure.tsx.
 *
 * Tests section toggle behavior, template initialization,
 * solicitation type label mapping, and tone selection.
 */

// ────────────────────────────────────────────────────────
// Types (mirrored from step-configure.tsx)
// ────────────────────────────────────────────────────────

interface SectionTemplate {
  type: string;
  title: string;
  order: number;
  required: boolean;
  defaultEnabled: boolean;
}

type WizardTone = "professional" | "conversational" | "technical" | "executive";

const TONE_OPTIONS: { value: WizardTone; label: string; description: string }[] = [
  { value: "professional", label: "Professional", description: "Formal, business-appropriate tone" },
  { value: "conversational", label: "Conversational", description: "Approachable, friendly while professional" },
  { value: "technical", label: "Technical", description: "Detailed, precise, specification-focused" },
  { value: "executive", label: "Executive", description: "High-level, strategic, outcome-focused" },
];

const SOLICITATION_TYPES = ["RFP", "RFI", "RFQ", "SOW", "Proactive"];

// ────────────────────────────────────────────────────────
// Extracted logic functions
// ────────────────────────────────────────────────────────

function computeDefaultSections(sections: SectionTemplate[]): string[] {
  return sections
    .filter((s) => s.defaultEnabled || s.required)
    .map((s) => s.type);
}

function toggleSection(
  selectedTypes: Set<string>,
  type: string,
  sections: SectionTemplate[],
): Set<string> {
  const section = sections.find((s) => s.type === type);
  if (section?.required) return selectedTypes; // Don't allow unchecking required

  const next = new Set(selectedTypes);
  if (next.has(type)) {
    next.delete(type);
  } else {
    next.add(type);
  }
  return next;
}

function getSolicitationLabel(type: string, templateLabel?: string): string {
  if (templateLabel) return `${templateLabel} (auto-detected)`;
  switch (type) {
    case "RFP": return "Standard RFP Response";
    case "RFI": return "Request for Information";
    case "RFQ": return "Request for Quotation";
    case "SOW": return "Statement of Work";
    case "Proactive": return "Proactive Proposal";
    default: return type;
  }
}

function buildIntakeDataForStrategy(state: {
  clientName: string;
  clientIndustry: string;
  clientSize: string;
  solicitationType: string;
  opportunityType: string;
  scopeDescription: string;
  currentStatePains: string[];
  desiredOutcomes: string[];
  budgetRange: string;
  timelineExpectation: string;
  technicalEnvironment: string;
  competitiveIntel: string;
}) {
  return {
    client_name: state.clientName,
    client_industry: state.clientIndustry,
    client_size: state.clientSize,
    solicitation_type: state.solicitationType,
    opportunity_type: state.opportunityType,
    scope_description: state.scopeDescription,
    current_state_pains: state.currentStatePains.filter((p) => p.trim()),
    desired_outcomes: state.desiredOutcomes.filter((o) => o.trim()),
    budget_range: state.budgetRange,
    timeline_expectation: state.timelineExpectation,
    technical_environment: state.technicalEnvironment,
    competitive_intel: state.competitiveIntel,
  };
}

// ────────────────────────────────────────────────────────
// Test fixtures
// ────────────────────────────────────────────────────────

const mockSections: SectionTemplate[] = [
  { type: "executive_summary", title: "Executive Summary", order: 1, required: true, defaultEnabled: true },
  { type: "approach", title: "Technical Approach", order: 2, required: true, defaultEnabled: true },
  { type: "team", title: "Team Qualifications", order: 3, required: false, defaultEnabled: true },
  { type: "pricing", title: "Pricing", order: 4, required: false, defaultEnabled: true },
  { type: "case_studies", title: "Case Studies", order: 5, required: false, defaultEnabled: false },
  { type: "appendix", title: "Appendix", order: 6, required: false, defaultEnabled: false },
];

// ────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────

describe("step-configure logic", () => {
  describe("default section computation", () => {
    it("includes required and defaultEnabled sections", () => {
      const defaults = computeDefaultSections(mockSections);
      expect(defaults).toContain("executive_summary");
      expect(defaults).toContain("approach");
      expect(defaults).toContain("team");
      expect(defaults).toContain("pricing");
    });

    it("excludes non-default optional sections", () => {
      const defaults = computeDefaultSections(mockSections);
      expect(defaults).not.toContain("case_studies");
      expect(defaults).not.toContain("appendix");
    });

    it("returns 4 defaults from mock data", () => {
      expect(computeDefaultSections(mockSections)).toHaveLength(4);
    });

    it("handles empty sections list", () => {
      expect(computeDefaultSections([])).toEqual([]);
    });

    it("handles all-required sections", () => {
      const allRequired = mockSections.map((s) => ({ ...s, required: true }));
      expect(computeDefaultSections(allRequired)).toHaveLength(6);
    });

    it("handles no defaults (only required)", () => {
      const noDefaults = mockSections.map((s) => ({ ...s, defaultEnabled: false }));
      const result = computeDefaultSections(noDefaults);
      // Only required sections (executive_summary and approach)
      expect(result).toEqual(["executive_summary", "approach"]);
    });
  });

  describe("section toggle", () => {
    it("adds an unselected section", () => {
      const selected = new Set(["executive_summary"]);
      const result = toggleSection(selected, "case_studies", mockSections);
      expect(result.has("case_studies")).toBe(true);
      expect(result.has("executive_summary")).toBe(true);
    });

    it("removes a selected optional section", () => {
      const selected = new Set(["executive_summary", "team", "pricing"]);
      const result = toggleSection(selected, "team", mockSections);
      expect(result.has("team")).toBe(false);
      expect(result.has("pricing")).toBe(true);
    });

    it("does NOT remove a required section", () => {
      const selected = new Set(["executive_summary", "approach", "team"]);
      const result = toggleSection(selected, "executive_summary", mockSections);
      expect(result.has("executive_summary")).toBe(true); // still there!
    });

    it("does NOT remove another required section", () => {
      const selected = new Set(["executive_summary", "approach"]);
      const result = toggleSection(selected, "approach", mockSections);
      expect(result.has("approach")).toBe(true);
    });

    it("doesn't mutate original set", () => {
      const selected = new Set(["executive_summary"]);
      const result = toggleSection(selected, "case_studies", mockSections);
      expect(selected.has("case_studies")).toBe(false); // original unchanged
      expect(result.has("case_studies")).toBe(true); // new set has it
    });

    it("toggle on then off returns to original", () => {
      const original = new Set(["executive_summary", "approach"]);
      const added = toggleSection(original, "appendix", mockSections);
      const removed = toggleSection(added, "appendix", mockSections);
      expect([...removed].sort()).toEqual([...original].sort());
    });
  });

  describe("solicitation type labels", () => {
    it("shows auto-detected label when template data available", () => {
      expect(getSolicitationLabel("RFP", "Standard RFP Response"))
        .toBe("Standard RFP Response (auto-detected)");
    });

    it("maps all types to human labels", () => {
      expect(getSolicitationLabel("RFP")).toBe("Standard RFP Response");
      expect(getSolicitationLabel("RFI")).toBe("Request for Information");
      expect(getSolicitationLabel("RFQ")).toBe("Request for Quotation");
      expect(getSolicitationLabel("SOW")).toBe("Statement of Work");
      expect(getSolicitationLabel("Proactive")).toBe("Proactive Proposal");
    });

    it("handles unknown type gracefully", () => {
      expect(getSolicitationLabel("UNKNOWN")).toBe("UNKNOWN");
    });
  });

  describe("tone options", () => {
    it("has exactly 4 tone options", () => {
      expect(TONE_OPTIONS).toHaveLength(4);
    });

    it("all tone values are unique", () => {
      const values = TONE_OPTIONS.map((o) => o.value);
      expect(new Set(values).size).toBe(4);
    });

    it("all tones have labels and descriptions", () => {
      for (const opt of TONE_OPTIONS) {
        expect(opt.label.length).toBeGreaterThan(0);
        expect(opt.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe("solicitation types", () => {
    it("has exactly 5 types", () => {
      expect(SOLICITATION_TYPES).toHaveLength(5);
    });

    it("includes all expected types", () => {
      expect(SOLICITATION_TYPES).toContain("RFP");
      expect(SOLICITATION_TYPES).toContain("RFI");
      expect(SOLICITATION_TYPES).toContain("RFQ");
      expect(SOLICITATION_TYPES).toContain("SOW");
      expect(SOLICITATION_TYPES).toContain("Proactive");
    });
  });

  describe("intake data for strategy", () => {
    it("filters empty strings from pains and outcomes", () => {
      const result = buildIntakeDataForStrategy({
        clientName: "Corp",
        clientIndustry: "Tech",
        clientSize: "Mid",
        solicitationType: "RFP",
        opportunityType: "cloud",
        scopeDescription: "Migrate",
        currentStatePains: ["Real pain", "", "  ", "Another"],
        desiredOutcomes: ["Goal", "", "  "],
        budgetRange: "$1M",
        timelineExpectation: "6mo",
        technicalEnvironment: "AWS",
        competitiveIntel: "",
      });

      expect(result.current_state_pains).toEqual(["Real pain", "Another"]);
      expect(result.desired_outcomes).toEqual(["Goal"]);
    });

    it("handles completely empty arrays", () => {
      const result = buildIntakeDataForStrategy({
        clientName: "",
        clientIndustry: "",
        clientSize: "",
        solicitationType: "RFP",
        opportunityType: "",
        scopeDescription: "",
        currentStatePains: [],
        desiredOutcomes: [],
        budgetRange: "",
        timelineExpectation: "",
        technicalEnvironment: "",
        competitiveIntel: "",
      });

      expect(result.current_state_pains).toEqual([]);
      expect(result.desired_outcomes).toEqual([]);
    });

    it("preserves all non-array fields as-is", () => {
      const result = buildIntakeDataForStrategy({
        clientName: "Acme",
        clientIndustry: "Finance",
        clientSize: "Enterprise",
        solicitationType: "SOW",
        opportunityType: "digital_transformation",
        scopeDescription: "Full stack rewrite",
        currentStatePains: [],
        desiredOutcomes: [],
        budgetRange: "$2M-$5M",
        timelineExpectation: "12 months",
        technicalEnvironment: "Azure",
        competitiveIntel: "Deloitte is incumbent",
      });

      expect(result.client_name).toBe("Acme");
      expect(result.client_industry).toBe("Finance");
      expect(result.competitive_intel).toBe("Deloitte is incumbent");
    });
  });
});
