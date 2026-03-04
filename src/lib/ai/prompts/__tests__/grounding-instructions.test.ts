import { describe, it, expect } from "vitest";

import {
  parseL1Metadata,
  computeGroundingLevel,
  buildGroundingInstructions,
} from "../grounding-instructions";
import type { L1DataAvailability } from "../grounding-instructions";

// ── parseL1Metadata ──────────────────────────────────────────────────────────

describe("parseL1Metadata", () => {
  it("parses new format correctly", () => {
    const input =
      "Some context\n<!-- L1_DATA: evidence=3 products=2 team=5 company=4 -->\nMore context";
    const result = parseL1Metadata(input);
    expect(result).toEqual({
      evidenceCount: 3,
      productCount: 2,
      teamMemberCount: 5,
      companyContextCount: 4,
    });
  });

  it("parses old format correctly (sets evidenceCount only, others zero)", () => {
    const input = "Some context\n<!-- L1_EVIDENCE_COUNT: 5 -->\nMore context";
    const result = parseL1Metadata(input);
    expect(result).toEqual({
      evidenceCount: 5,
      productCount: 0,
      teamMemberCount: 0,
      companyContextCount: 0,
    });
  });

  it("returns zeros for empty string input", () => {
    const result = parseL1Metadata("");
    expect(result).toEqual({
      evidenceCount: 0,
      productCount: 0,
      teamMemberCount: 0,
      companyContextCount: 0,
    });
  });

  it("returns zeros for string with no metadata markers", () => {
    const result = parseL1Metadata(
      "Just some plain text with no special markers at all.",
    );
    expect(result).toEqual({
      evidenceCount: 0,
      productCount: 0,
      teamMemberCount: 0,
      companyContextCount: 0,
    });
  });
});

// ── computeGroundingLevel ────────────────────────────────────────────────────

describe("computeGroundingLevel", () => {
  it('returns "low" for evidence-heavy section with zero data', () => {
    const l1: L1DataAvailability = {
      evidenceCount: 0,
      productCount: 0,
      teamMemberCount: 0,
      companyContextCount: 0,
    };
    expect(computeGroundingLevel("case_studies", l1)).toBe("low");
  });

  it('returns "high" for evidence-heavy section with sufficient data', () => {
    const l1: L1DataAvailability = {
      evidenceCount: 2,
      productCount: 2,
      teamMemberCount: 1,
      companyContextCount: 1,
    };
    // totalData = 2 + 2 + 1 = 5 >= 4, evidenceCount = 2 >= 2
    expect(computeGroundingLevel("case_studies", l1)).toBe("high");
  });

  it('returns "medium" for evidence-heavy section with partial data', () => {
    const l1: L1DataAvailability = {
      evidenceCount: 1,
      productCount: 0,
      teamMemberCount: 0,
      companyContextCount: 0,
    };
    // evidenceCount >= 1 triggers medium
    expect(computeGroundingLevel("methodology", l1)).toBe("medium");
  });

  it('returns "medium" for evidence-heavy section at totalData threshold', () => {
    const l1: L1DataAvailability = {
      evidenceCount: 0,
      productCount: 1,
      teamMemberCount: 0,
      companyContextCount: 1,
    };
    // totalData = 0 + 1 + 1 = 2 >= 2, evidenceCount < 1 but totalData triggers medium
    expect(computeGroundingLevel("why_us", l1)).toBe("medium");
  });

  it('returns "high" for non-evidence-heavy section with totalData >= 2', () => {
    const l1: L1DataAvailability = {
      evidenceCount: 1,
      productCount: 1,
      teamMemberCount: 0,
      companyContextCount: 0,
    };
    // totalData = 1 + 1 + 0 = 2 >= 2
    expect(computeGroundingLevel("pricing", l1)).toBe("high");
  });

  it('returns "medium" for non-evidence-heavy section with totalData = 1', () => {
    const l1: L1DataAvailability = {
      evidenceCount: 0,
      productCount: 1,
      teamMemberCount: 0,
      companyContextCount: 0,
    };
    // totalData = 0 + 1 + 0 = 1 >= 1
    expect(computeGroundingLevel("pricing", l1)).toBe("medium");
  });

  it('returns "low" for non-evidence-heavy section with zero data', () => {
    const l1: L1DataAvailability = {
      evidenceCount: 0,
      productCount: 0,
      teamMemberCount: 0,
      companyContextCount: 0,
    };
    expect(computeGroundingLevel("pricing", l1)).toBe("low");
  });

  it("excludes teamMemberCount from totalData calculation", () => {
    const l1: L1DataAvailability = {
      evidenceCount: 0,
      productCount: 0,
      teamMemberCount: 10,
      companyContextCount: 0,
    };
    // totalData = 0 + 0 + 0 = 0 (teamMemberCount not included)
    expect(computeGroundingLevel("pricing", l1)).toBe("low");
  });
});

// ── buildGroundingInstructions ───────────────────────────────────────────────

describe("buildGroundingInstructions", () => {
  const highL1: L1DataAvailability = {
    evidenceCount: 3,
    productCount: 2,
    teamMemberCount: 1,
    companyContextCount: 2,
  };

  const lowL1: L1DataAvailability = {
    evidenceCount: 0,
    productCount: 0,
    teamMemberCount: 0,
    companyContextCount: 0,
  };

  const mediumL1: L1DataAvailability = {
    evidenceCount: 1,
    productCount: 0,
    teamMemberCount: 0,
    companyContextCount: 0,
  };

  it('returns empty string when grounding level is "high"', () => {
    const result = buildGroundingInstructions(
      "case_studies",
      highL1,
      "Acme Corp",
    );
    expect(result).toBe("");
  });

  it('returns string containing "HONEST FRAMING" when grounding level is "low"', () => {
    const result = buildGroundingInstructions(
      "case_studies",
      lowL1,
      "Acme Corp",
    );
    expect(result).toContain("HONEST FRAMING");
  });

  it('returns string containing "EVIDENCE CALIBRATION" when grounding level is "medium"', () => {
    const result = buildGroundingInstructions(
      "case_studies",
      mediumL1,
      "Acme Corp",
    );
    expect(result).toContain("EVIDENCE CALIBRATION");
  });

  it("includes company name in output when provided", () => {
    const result = buildGroundingInstructions(
      "case_studies",
      lowL1,
      "Capgemini",
    );
    expect(result).toContain("Capgemini");
  });

  it('uses company name string as-is (does not default to "the company")', () => {
    // The function always uses companyName directly; test with empty string
    const result = buildGroundingInstructions("case_studies", lowL1, "");
    expect(result).toContain("HONEST FRAMING");
    // Empty companyName means the template renders empty where name goes
    expect(result).not.toContain("the company");
  });

  it("includes evidence and product counts in low grounding output", () => {
    const result = buildGroundingInstructions(
      "executive_summary",
      lowL1,
      "TestCo",
    );
    expect(result).toContain("evidence: 0");
    expect(result).toContain("products: 0");
  });

  it("includes evidence and product counts in medium grounding output", () => {
    const result = buildGroundingInstructions(
      "approach",
      mediumL1,
      "TestCo",
    );
    expect(result).toContain("evidence: 1");
    expect(result).toContain("products: 0");
  });
});
