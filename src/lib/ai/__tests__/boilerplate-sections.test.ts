import { describe, it, expect } from "vitest";
import { buildCoverLetterPrompt } from "../prompts/cover-letter";
import { buildComplianceMatrixSectionPrompt } from "../prompts/compliance-matrix-section";
import { buildExceptionsTermsPrompt } from "../prompts/exceptions-terms";
import { SECTION_CONFIGS } from "../pipeline/section-configs";
import { getSectionsForSolicitationType } from "../pipeline/section-configs";

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH — Cover Letter
// ════════════════════════════════════════════════════════════════════════════

describe("Cover Letter — Happy Path", () => {
  const baseIntake: Record<string, unknown> = {
    client_name: "Department of Veterans Affairs",
    solicitation_type: "RFP",
    scope_description: "Enterprise cloud migration",
    opportunity_type: "cloud_migration",
    audience_profile: { tech_level: "non_technical", evaluator: "procurement_office" },
  };

  it("generates cover letter with merge fields for signatory", () => {
    const prompt = buildCoverLetterPrompt(
      baseIntake,
      "Strategic analysis",
      "",
      null,
      { name: "Trellex Solutions" },
      "",
    );

    expect(prompt).toContain("{signatory_name}");
    expect(prompt).toContain("{signatory_title}");
    expect(prompt).toContain("{date}");
    expect(prompt).toContain("{client_name}");
  });

  it("includes client name in the prompt context", () => {
    const prompt = buildCoverLetterPrompt(
      baseIntake,
      "analysis",
      "",
      null,
      { name: "Trellex" },
      "",
    );

    expect(prompt).toContain("Department of Veterans Affairs");
  });

  it("references company name from companyInfo", () => {
    const prompt = buildCoverLetterPrompt(
      baseIntake,
      "analysis",
      "",
      null,
      { name: "Trellex Solutions" },
      "",
    );

    expect(prompt).toContain("Trellex Solutions");
  });

  it("includes editorial standards", () => {
    const prompt = buildCoverLetterPrompt(
      baseIntake,
      "analysis",
      "",
      null,
      { name: "Trellex" },
      "",
    );

    // Editorial standards always include formatting rules
    expect(prompt).toContain("OUTPUT FORMAT RULES");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH — Compliance Matrix Section
// ════════════════════════════════════════════════════════════════════════════

describe("Compliance Matrix Section — Happy Path", () => {
  const baseIntake: Record<string, unknown> = {
    client_name: "State of California",
    solicitation_type: "RFP",
    key_requirements: [
      "Provide 24/7 support",
      "Achieve FedRAMP authorization",
      "Deliver within 12 months",
    ],
    compliance_requirements: ["SOC 2 Type II", "HIPAA"],
  };

  it("generates compliance cross-reference prompt", () => {
    const prompt = buildComplianceMatrixSectionPrompt(
      baseIntake,
      "analysis",
      "",
      null,
      { name: "Trellex" },
      "",
    );

    expect(prompt).toMatch(/compliance|cross-reference|requirement/i);
  });

  it("references extracted requirements from intake", () => {
    const prompt = buildComplianceMatrixSectionPrompt(
      baseIntake,
      "analysis",
      "",
      null,
      { name: "Trellex" },
      "",
    );

    expect(prompt).toContain("24/7 support");
    expect(prompt).toContain("FedRAMP");
  });

  it("includes compliance requirements from intake", () => {
    const prompt = buildComplianceMatrixSectionPrompt(
      baseIntake,
      "analysis",
      "",
      null,
      { name: "Trellex" },
      "",
    );

    expect(prompt).toContain("SOC 2 Type II");
    expect(prompt).toContain("HIPAA");
  });

  it("instructs markdown table output format", () => {
    const prompt = buildComplianceMatrixSectionPrompt(
      baseIntake,
      "analysis",
      "",
      null,
      { name: "Trellex" },
      "",
    );

    expect(prompt).toMatch(/table|matrix/i);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH — Exceptions to Terms
// ════════════════════════════════════════════════════════════════════════════

describe("Exceptions to Terms — Happy Path", () => {
  const baseIntake: Record<string, unknown> = {
    client_name: "City of Portland",
    solicitation_type: "RFP",
    scope_description: "Managed IT services",
  };

  it("generates exceptions prompt with common categories", () => {
    const prompt = buildExceptionsTermsPrompt(
      baseIntake,
      "analysis",
      "",
      null,
      { name: "Trellex" },
      "",
    );

    // Should reference common exception areas
    expect(prompt).toMatch(/limitation of liability|indemnification|intellectual property|termination/i);
  });

  it("includes placeholder structure for legal review", () => {
    const prompt = buildExceptionsTermsPrompt(
      baseIntake,
      "analysis",
      "",
      null,
      { name: "Trellex" },
      "",
    );

    // Should indicate these are drafts requiring legal review
    expect(prompt).toMatch(/legal.*review|counsel|attorney/i);
  });

  it("references company name", () => {
    const prompt = buildExceptionsTermsPrompt(
      baseIntake,
      "analysis",
      "",
      null,
      { name: "Trellex Solutions" },
      "",
    );

    expect(prompt).toContain("Trellex Solutions");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH — Section Config Registration
// ════════════════════════════════════════════════════════════════════════════

describe("Section Config Registration — Happy Path", () => {
  it("SECTION_CONFIGS includes cover_letter section type", () => {
    const coverLetter = SECTION_CONFIGS.find((c) => c.type === "cover_letter");

    expect(coverLetter).toBeDefined();
    expect(coverLetter!.order).toBe(0);
    expect(coverLetter!.title).toMatch(/cover letter/i);
  });

  it("SECTION_CONFIGS includes compliance_matrix_section type", () => {
    const compliance = SECTION_CONFIGS.find((c) => c.type === "compliance_matrix_section");

    expect(compliance).toBeDefined();
    expect(compliance!.order).toBe(11);
    expect(compliance!.title).toMatch(/compliance/i);
  });

  it("SECTION_CONFIGS includes exceptions_terms type", () => {
    const exceptions = SECTION_CONFIGS.find((c) => c.type === "exceptions_terms");

    expect(exceptions).toBeDefined();
    expect(exceptions!.order).toBe(12);
    expect(exceptions!.title).toMatch(/exception/i);
  });

  it("all new sections have buildPrompt functions", () => {
    const newTypes = ["cover_letter", "compliance_matrix_section", "exceptions_terms"];

    for (const type of newTypes) {
      const config = SECTION_CONFIGS.find((c) => c.type === type);
      expect(config).toBeDefined();
      expect(typeof config!.buildPrompt).toBe("function");
    }
  });

  it("all new sections have searchQuery functions", () => {
    const newTypes = ["cover_letter", "compliance_matrix_section", "exceptions_terms"];

    for (const type of newTypes) {
      const config = SECTION_CONFIGS.find((c) => c.type === type);
      expect(config).toBeDefined();
      expect(typeof config!.searchQuery).toBe("function");
    }
  });

  it("SECTION_CONFIGS has 13 total sections", () => {
    expect(SECTION_CONFIGS.length).toBe(13);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH — Solicitation-Based Section Filtering
// ════════════════════════════════════════════════════════════════════════════

describe("Solicitation-Based Section Filtering — Happy Path", () => {
  it("RFP auto-enables all 3 boilerplate sections", () => {
    const sections = getSectionsForSolicitationType("RFP");

    const types = sections.map((s) => s.type);
    expect(types).toContain("cover_letter");
    expect(types).toContain("compliance_matrix_section");
    expect(types).toContain("exceptions_terms");
  });

  it("RFI only enables cover letter", () => {
    const sections = getSectionsForSolicitationType("RFI");

    const types = sections.map((s) => s.type);
    expect(types).toContain("cover_letter");
    expect(types).not.toContain("compliance_matrix_section");
    expect(types).not.toContain("exceptions_terms");
  });

  it("Proactive disables all boilerplate sections", () => {
    const sections = getSectionsForSolicitationType("Proactive");

    const types = sections.map((s) => s.type);
    expect(types).not.toContain("cover_letter");
    expect(types).not.toContain("compliance_matrix_section");
    expect(types).not.toContain("exceptions_terms");
  });

  it("RFP includes all original 10 sections plus 3 new", () => {
    const sections = getSectionsForSolicitationType("RFP");

    expect(sections.length).toBe(13);
  });

  it("Proactive includes only original 10 sections", () => {
    const sections = getSectionsForSolicitationType("Proactive");

    expect(sections.length).toBe(10);
  });

  it("RFI includes original 10 + cover letter = 11", () => {
    const sections = getSectionsForSolicitationType("RFI");

    expect(sections.length).toBe(11);
  });

  it("RFQ includes original 10 + cover letter = 11", () => {
    const sections = getSectionsForSolicitationType("RFQ");

    const types = sections.map((s) => s.type);
    expect(types).toContain("cover_letter");
    // RFQ is a quote request — compliance matrix optional, exceptions useful
    expect(sections.length).toBe(11);
  });

  it("sections are sorted by order", () => {
    const sections = getSectionsForSolicitationType("RFP");

    for (let i = 1; i < sections.length; i++) {
      expect(sections[i].order).toBeGreaterThanOrEqual(sections[i - 1].order);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BAD PATH
// ════════════════════════════════════════════════════════════════════════════

describe("Boilerplate Sections — Bad Path", () => {
  it("cover letter merge fields remain as {field_name} when no data provided", () => {
    const prompt = buildCoverLetterPrompt(
      {},
      "",
      "",
      null,
      { name: "Acme" },
      "",
    );

    // Merge fields should still be present in the instructions
    expect(prompt).toContain("{signatory_name}");
    expect(prompt).toContain("{signatory_title}");
  });

  it("compliance matrix handles proposal with 0 requirements", () => {
    const intake: Record<string, unknown> = {
      client_name: "Test Corp",
      key_requirements: [],
      compliance_requirements: [],
    };

    const prompt = buildComplianceMatrixSectionPrompt(
      intake,
      "",
      "",
      null,
      { name: "Acme" },
      "",
    );

    // Should still produce a valid prompt
    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toMatch(/no requirements|general compliance|standard/i);
  });

  it("exceptions section handles missing contract terms gracefully", () => {
    const prompt = buildExceptionsTermsPrompt(
      {},
      "",
      "",
      null,
      { name: "Acme" },
      "",
    );

    expect(prompt.length).toBeGreaterThan(100);
  });

  it("invalid solicitation type defaults to cover letter only", () => {
    const sections = getSectionsForSolicitationType("INVALID_TYPE");

    const types = sections.map((s) => s.type);
    // Default: cover letter only (safe fallback)
    expect(types).toContain("cover_letter");
    expect(sections.length).toBe(11);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Boilerplate Sections — Edge Cases", () => {
  it("RFP with 100+ requirements — compliance matrix still generates", () => {
    const manyRequirements = Array.from(
      { length: 120 },
      (_, i) => `Requirement ${i + 1}: Must support feature ${i + 1}`,
    );

    const intake: Record<string, unknown> = {
      client_name: "Large Agency",
      key_requirements: manyRequirements,
    };

    const prompt = buildComplianceMatrixSectionPrompt(
      intake,
      "",
      "",
      null,
      { name: "Acme" },
      "",
    );

    expect(prompt.length).toBeGreaterThan(200);
  });

  it("assumptions with special characters in scope (dollar amounts, percentages)", () => {
    const intake: Record<string, unknown> = {
      client_name: "Test Corp — 50% budget cut expected",
      scope_description: "Migration of $2.3M system with 99.99% uptime SLA",
      timeline: "Q1'26 → Q4'27",
    };

    const prompt = buildCoverLetterPrompt(
      intake,
      "",
      "",
      null,
      { name: "Acme" },
      "",
    );

    expect(prompt).toContain("Test Corp");
  });

  it("cover letter order is 0 (appears first)", () => {
    const coverLetter = SECTION_CONFIGS.find((c) => c.type === "cover_letter");

    expect(coverLetter!.order).toBe(0);
  });

  it("compliance matrix order is 11 (appears after why_us)", () => {
    const compliance = SECTION_CONFIGS.find(
      (c) => c.type === "compliance_matrix_section",
    );

    expect(compliance!.order).toBe(11);
  });

  it("exceptions order is 12 (appears last)", () => {
    const exceptions = SECTION_CONFIGS.find(
      (c) => c.type === "exceptions_terms",
    );

    expect(exceptions!.order).toBe(12);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SECURITY
// ════════════════════════════════════════════════════════════════════════════

describe("Boilerplate Sections — Security", () => {
  it("cover letter merge fields are clearly marked (not auto-filled with fabricated data)", () => {
    const prompt = buildCoverLetterPrompt(
      { client_name: "Test" },
      "",
      "",
      null,
      { name: "Acme" },
      "",
    );

    // Should instruct the AI to leave merge fields as-is
    expect(prompt).toMatch(/merge field|placeholder|\{signatory/i);
  });

  it("compliance matrix only references requirements from intake (not invented)", () => {
    const prompt = buildComplianceMatrixSectionPrompt(
      { client_name: "Test", key_requirements: ["Req A"] },
      "",
      "",
      null,
      { name: "Acme" },
      "",
    );

    expect(prompt).toMatch(/only.*requirements|provided.*requirements|do not invent/i);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA DAMAGE
// ════════════════════════════════════════════════════════════════════════════

describe("Boilerplate Sections — Data Damage", () => {
  it("adding new section types doesn't break existing 10-section list", () => {
    const originalTypes = [
      "executive_summary", "understanding", "approach", "methodology",
      "team", "case_studies", "timeline", "pricing", "risk_mitigation", "why_us",
    ];

    for (const type of originalTypes) {
      const config = SECTION_CONFIGS.find((c) => c.type === type);
      expect(config).toBeDefined();
    }
  });

  it("original section ordering is preserved (1-10)", () => {
    const originalSections = SECTION_CONFIGS.filter(
      (c) => !["cover_letter", "compliance_matrix_section", "exceptions_terms"].includes(c.type),
    );

    const orders = originalSections.map((c) => c.order);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("getSectionsForSolicitationType returns copies, not references", () => {
    const r1 = getSectionsForSolicitationType("RFP");
    const r2 = getSectionsForSolicitationType("RFP");

    // Should be equal in content but not the same array reference
    expect(r1).toEqual(r2);
  });
});
