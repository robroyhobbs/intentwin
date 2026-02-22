import { describe, it, expect } from "vitest";
import {
  SECTION_CONFIGS,
  getSectionsForSolicitationType,
} from "../section-configs";

// ════════════════════════════════════════════════════════════════════════════
// SECTION_CONFIGS — Static configuration
// ════════════════════════════════════════════════════════════════════════════

describe("SECTION_CONFIGS — Structure", () => {
  it("contains 13 total section configs", () => {
    expect(SECTION_CONFIGS).toHaveLength(13);
  });

  it("each config has required fields", () => {
    for (const config of SECTION_CONFIGS) {
      expect(config.type).toBeTruthy();
      expect(config.title).toBeTruthy();
      expect(typeof config.order).toBe("number");
      expect(typeof config.buildPrompt).toBe("function");
      expect(typeof config.searchQuery).toBe("function");
    }
  });

  it("contains the original 10 core sections", () => {
    const coreTypes = [
      "executive_summary",
      "understanding",
      "approach",
      "methodology",
      "team",
      "case_studies",
      "timeline",
      "pricing",
      "risk_mitigation",
      "why_us",
    ];

    for (const type of coreTypes) {
      const found = SECTION_CONFIGS.find((c) => c.type === type);
      expect(found, `Missing core section: ${type}`).toBeDefined();
    }
  });

  it("contains the 3 boilerplate sections", () => {
    const boilerplateTypes = [
      "cover_letter",
      "compliance_matrix_section",
      "exceptions_terms",
    ];

    for (const type of boilerplateTypes) {
      const found = SECTION_CONFIGS.find((c) => c.type === type);
      expect(found, `Missing boilerplate section: ${type}`).toBeDefined();
    }
  });

  it("has unique types", () => {
    const types = SECTION_CONFIGS.map((c) => c.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("has unique orders", () => {
    const orders = SECTION_CONFIGS.map((c) => c.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("searchQuery returns a non-empty string", () => {
    const mockIntake = {
      client_industry: "technology",
      opportunity_type: "cloud_migration",
    };

    for (const config of SECTION_CONFIGS) {
      const query = config.searchQuery(mockIntake, null);
      expect(query.length, `Empty search query for ${config.type}`).toBeGreaterThan(0);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// getSectionsForSolicitationType — RFP
// ════════════════════════════════════════════════════════════════════════════

describe("getSectionsForSolicitationType — RFP", () => {
  it("returns 13 sections (10 core + 3 boilerplate)", () => {
    const sections = getSectionsForSolicitationType("RFP");
    expect(sections).toHaveLength(13);
  });

  it("includes cover_letter, compliance_matrix_section, and exceptions_terms", () => {
    const sections = getSectionsForSolicitationType("RFP");
    const types = sections.map((s) => s.type);

    expect(types).toContain("cover_letter");
    expect(types).toContain("compliance_matrix_section");
    expect(types).toContain("exceptions_terms");
  });

  it("returns sections sorted by order", () => {
    const sections = getSectionsForSolicitationType("RFP");
    for (let i = 1; i < sections.length; i++) {
      expect(sections[i].order).toBeGreaterThanOrEqual(sections[i - 1].order);
    }
  });

  it("cover_letter is first (order 0)", () => {
    const sections = getSectionsForSolicitationType("RFP");
    expect(sections[0].type).toBe("cover_letter");
    expect(sections[0].order).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// getSectionsForSolicitationType — RFI
// ════════════════════════════════════════════════════════════════════════════

describe("getSectionsForSolicitationType — RFI", () => {
  it("returns 11 sections (10 core + cover_letter only)", () => {
    const sections = getSectionsForSolicitationType("RFI");
    expect(sections).toHaveLength(11);
  });

  it("includes cover_letter but not compliance or exceptions", () => {
    const sections = getSectionsForSolicitationType("RFI");
    const types = sections.map((s) => s.type);

    expect(types).toContain("cover_letter");
    expect(types).not.toContain("compliance_matrix_section");
    expect(types).not.toContain("exceptions_terms");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// getSectionsForSolicitationType — RFQ
// ════════════════════════════════════════════════════════════════════════════

describe("getSectionsForSolicitationType — RFQ", () => {
  it("returns 11 sections (10 core + cover_letter only)", () => {
    const sections = getSectionsForSolicitationType("RFQ");
    expect(sections).toHaveLength(11);
  });

  it("includes cover_letter but not compliance or exceptions", () => {
    const sections = getSectionsForSolicitationType("RFQ");
    const types = sections.map((s) => s.type);

    expect(types).toContain("cover_letter");
    expect(types).not.toContain("compliance_matrix_section");
    expect(types).not.toContain("exceptions_terms");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// getSectionsForSolicitationType — SOW
// ════════════════════════════════════════════════════════════════════════════

describe("getSectionsForSolicitationType — SOW", () => {
  it("returns 12 sections (10 core + cover_letter + exceptions)", () => {
    const sections = getSectionsForSolicitationType("SOW");
    expect(sections).toHaveLength(12);
  });

  it("includes cover_letter and exceptions but not compliance_matrix", () => {
    const sections = getSectionsForSolicitationType("SOW");
    const types = sections.map((s) => s.type);

    expect(types).toContain("cover_letter");
    expect(types).toContain("exceptions_terms");
    expect(types).not.toContain("compliance_matrix_section");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// getSectionsForSolicitationType — Proactive
// ════════════════════════════════════════════════════════════════════════════

describe("getSectionsForSolicitationType — Proactive", () => {
  it("returns 10 sections (core only, no boilerplate)", () => {
    const sections = getSectionsForSolicitationType("Proactive");
    expect(sections).toHaveLength(10);
  });

  it("excludes all boilerplate sections", () => {
    const sections = getSectionsForSolicitationType("Proactive");
    const types = sections.map((s) => s.type);

    expect(types).not.toContain("cover_letter");
    expect(types).not.toContain("compliance_matrix_section");
    expect(types).not.toContain("exceptions_terms");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// getSectionsForSolicitationType — Unknown type (default fallback)
// ════════════════════════════════════════════════════════════════════════════

describe("getSectionsForSolicitationType — Unknown type", () => {
  it("defaults to including cover_letter only for unknown types", () => {
    const sections = getSectionsForSolicitationType("UNKNOWN_TYPE");
    expect(sections).toHaveLength(11);

    const types = sections.map((s) => s.type);
    expect(types).toContain("cover_letter");
    expect(types).not.toContain("compliance_matrix_section");
    expect(types).not.toContain("exceptions_terms");
  });

  it("results are sorted by order for unknown types", () => {
    const sections = getSectionsForSolicitationType("UNKNOWN_TYPE");
    for (let i = 1; i < sections.length; i++) {
      expect(sections[i].order).toBeGreaterThanOrEqual(sections[i - 1].order);
    }
  });
});
