import { describe, it, expect } from "vitest";
import { buildEditorialStandards } from "../prompts/editorial-standards";

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH — Audience-Modulated Tone
// ════════════════════════════════════════════════════════════════════════════

describe("Audience Calibration — Editorial Standards", () => {
  it("adjusts tone for non-technical audience when audience_profile provided", () => {
    const standards = buildEditorialStandards("RFP", {
      tech_level: "non_technical",
      evaluator: "county_board",
      size: "small_municipality",
    });

    expect(standards).toContain("NON-TECHNICAL AUDIENCE");
    expect(standards).toMatch(/plain language|avoid jargon|everyday terms/i);
  });

  it("adjusts tone for highly technical audience", () => {
    const standards = buildEditorialStandards("RFP", {
      tech_level: "highly_technical",
      evaluator: "engineering_team",
      size: "enterprise",
    });

    expect(standards).toContain("TECHNICAL AUDIENCE");
    expect(standards).toMatch(/technical depth|specifications|architecture/i);
  });

  it("uses default tone when no audience profile provided", () => {
    const standards = buildEditorialStandards("RFP");

    // Should not have audience-specific modifiers
    expect(standards).not.toContain("NON-TECHNICAL AUDIENCE");
    expect(standards).not.toContain("TECHNICAL AUDIENCE");
  });

  it("uses default tone when audience profile is null", () => {
    const standards = buildEditorialStandards("RFP", null as unknown as undefined);

    expect(standards).not.toContain("NON-TECHNICAL AUDIENCE");
    expect(standards).not.toContain("TECHNICAL AUDIENCE");
  });

  it("handles moderate tech level with balanced tone", () => {
    const standards = buildEditorialStandards("RFP", {
      tech_level: "moderate",
      evaluator: "procurement_office",
      size: "mid_market",
    });

    // Should not have extreme audience modifiers for moderate level
    expect(standards).not.toContain("NON-TECHNICAL AUDIENCE");
    expect(standards).not.toContain("TECHNICAL AUDIENCE");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH — Brand Name Lock
// ════════════════════════════════════════════════════════════════════════════

describe("Brand Name Lock — Editorial Standards", () => {
  it("includes brand name lock instruction when brand name provided", () => {
    const standards = buildEditorialStandards("RFP", undefined, "Trellex Solutions");

    expect(standards).toContain("Trellex Solutions");
    expect(standards).toMatch(/use only.*Trellex Solutions/i);
  });

  it("omits brand name lock when no brand name provided", () => {
    const standards = buildEditorialStandards("RFP");

    expect(standards).not.toContain("BRAND NAME LOCK");
  });

  it("omits brand name lock when brand name is empty string", () => {
    const standards = buildEditorialStandards("RFP", undefined, "");

    expect(standards).not.toContain("BRAND NAME LOCK");
  });

  it("handles brand name with special characters", () => {
    const standards = buildEditorialStandards("RFP", undefined, "O'Brien & Associates, LLC");

    expect(standards).toContain("O'Brien & Associates, LLC");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BAD PATH
// ════════════════════════════════════════════════════════════════════════════

describe("Audience Calibration — Bad Path", () => {
  it("doesn't crash when audience_profile has unknown tech_level", () => {
    const standards = buildEditorialStandards("RFP", {
      tech_level: "unknown_value" as string,
      evaluator: "unknown",
      size: "unknown",
    });

    expect(standards.length).toBeGreaterThan(100);
  });

  it("doesn't crash when audience_profile fields are empty strings", () => {
    const standards = buildEditorialStandards("RFP", {
      tech_level: "",
      evaluator: "",
      size: "",
    });

    expect(standards.length).toBeGreaterThan(100);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Audience Calibration — Edge Cases", () => {
  it("audience calibration combines correctly with solicitation type tone", () => {
    const standards = buildEditorialStandards("RFQ", {
      tech_level: "non_technical",
      evaluator: "county_board",
      size: "small_municipality",
    });

    // Should have both RFQ tone and audience adjustment
    expect(standards).toContain("RFQ");
    expect(standards).toContain("NON-TECHNICAL AUDIENCE");
  });

  it("brand name lock combines correctly with audience calibration", () => {
    const standards = buildEditorialStandards("RFP", {
      tech_level: "highly_technical",
      evaluator: "engineering_team",
      size: "enterprise",
    }, "Trellex Solutions");

    expect(standards).toContain("TECHNICAL AUDIENCE");
    expect(standards).toContain("Trellex Solutions");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA DAMAGE
// ════════════════════════════════════════════════════════════════════════════

describe("Audience Calibration — Data Damage", () => {
  it("buildEditorialStandards remains backward-compatible (1 param still works)", () => {
    expect(() => buildEditorialStandards()).not.toThrow();
    expect(() => buildEditorialStandards("RFP")).not.toThrow();
  });

  it("calling buildEditorialStandards twice returns consistent results", () => {
    const profile = { tech_level: "non_technical", evaluator: "board", size: "small" };
    const r1 = buildEditorialStandards("RFP", profile, "Acme");
    const r2 = buildEditorialStandards("RFP", profile, "Acme");
    expect(r1).toBe(r2);
  });
});
