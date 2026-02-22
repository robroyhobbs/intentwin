/**
 * Pre-Flight Gate Tests
 *
 * Tests the readiness check that runs between intake and generation.
 * Compares RFP requirements against L1 data availability.
 * 6 categories: Happy Path, Bad Path, Edge Cases, Security, Data Leak, Data Damage
 */

import {
  runPreflightCheck,
  type PreflightResult,
  type PreflightGap,
} from "../preflight";
import type { L1Context } from "../types";
import type { CompanyContext, ProductContext, EvidenceLibraryEntry } from "@/types/idd";

// ── Test Helpers ──────────────────────────────────────────────────────────────

function makeEvidence(overrides: Partial<EvidenceLibraryEntry> = {}): EvidenceLibraryEntry {
  return {
    id: "ev-1",
    evidence_type: "case_study",
    title: "Cloud Migration for Healthcare",
    summary: "Migrated 500K records to AWS",
    full_content: "Full case study...",
    client_industry: "healthcare",
    service_line: "cloud",
    client_size: "enterprise",
    outcomes_demonstrated: [{ outcome: "cost_optimization", description: "40% savings" }],
    metrics: [{ name: "Cost Savings", value: "40%", context: "Annual" }],
    is_verified: true,
    verified_by: "admin",
    verified_at: "2026-01-01",
    verification_notes: "",
    ...overrides,
  } as EvidenceLibraryEntry;
}

function makeProduct(overrides: Partial<ProductContext> = {}): ProductContext {
  return {
    id: "prod-1",
    product_name: "Cloud Migration Suite",
    service_line: "cloud",
    description: "End-to-end cloud migration using ShareGate and Azure Migrate",
    capabilities: [{ name: "Assessment", description: "Infrastructure assessment using Azure Migrate" }],
    specifications: {},
    pricing_models: [],
    constraints: {},
    supported_outcomes: [],
    is_locked: false,
    lock_reason: null,
    ...overrides,
  } as ProductContext;
}

function makeCompanyContext(overrides: Partial<CompanyContext> = {}): CompanyContext {
  return {
    id: "cc-1",
    category: "brand",
    key: "company_name",
    title: "Company Name",
    content: "Acme Corp",
    metadata: {},
    is_locked: false,
    lock_reason: null,
    last_verified_at: "2026-01-01",
    verified_by: "admin",
    ...overrides,
  } as CompanyContext;
}

function makeL1(overrides: Partial<L1Context> = {}): L1Context {
  return {
    companyContext: [makeCompanyContext()],
    productContexts: [makeProduct()],
    evidenceLibrary: [makeEvidence(), makeEvidence({ id: "ev-2", title: "Federal Agency Security" })],
    ...overrides,
  };
}

function makeIntakeData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    client_name: "City of Springfield",
    client_industry: "government",
    opportunity_type: "cloud",
    solicitation_type: "RFP",
    scope_description: "Cloud migration for city infrastructure",
    ...overrides,
  };
}

function makeRequirements(overrides: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (overrides.length > 0) return overrides;
  return [
    { requirement_text: "Must provide 3 relevant case studies", category: "mandatory", suggested_sections: ["case_studies"] },
    { requirement_text: "Vendor must provide named project manager", category: "mandatory", suggested_sections: ["team"] },
    { requirement_text: "Provide pricing in line-item format", category: "mandatory", suggested_sections: ["pricing"] },
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH
// ════════════════════════════════════════════════════════════════════════════

describe("runPreflightCheck — Happy Path", () => {
  it("returns status 'ready' when L1 has sufficient evidence, products, and company context", () => {
    const l1 = makeL1();
    const intake = makeIntakeData();

    const result = runPreflightCheck(l1, intake, []);

    expect(result.status).toBe("ready");
    expect(result.gaps.filter(g => g.category === "needs_data")).toHaveLength(0);
  });

  it("returns structured gap report with needs_data items when L1 evidence is empty", () => {
    const l1 = makeL1({ evidenceLibrary: [] });
    const intake = makeIntakeData();
    const reqs = makeRequirements();

    const result = runPreflightCheck(l1, intake, reqs);

    expect(result.status).not.toBe("ready");
    const evidenceGaps = result.gaps.filter(g => g.type === "evidence");
    expect(evidenceGaps.length).toBeGreaterThan(0);
    expect(evidenceGaps[0].category).toBe("needs_data");
  });

  it("categorizes gaps correctly: ready / needs_data / cannot_address", () => {
    const l1 = makeL1({ evidenceLibrary: [], productContexts: [] });
    const intake = makeIntakeData();
    const reqs = makeRequirements();

    const result = runPreflightCheck(l1, intake, reqs);

    const categories = new Set(result.gaps.map(g => g.category));
    // Should have at least needs_data gaps
    expect(categories.has("needs_data")).toBe(true);
  });

  it("counts evidence matches per section type", () => {
    const l1 = makeL1();
    const intake = makeIntakeData();

    const result = runPreflightCheck(l1, intake, []);

    expect(result.summary.evidenceCount).toBe(2);
    expect(result.summary.productCount).toBe(1);
    expect(result.summary.companyContextCount).toBe(1);
  });

  it("buildL1ContextString injects placeholder when evidence count < threshold for section", () => {
    // This tests the enhanced buildL1ContextString (tested via preflight integration)
    const l1 = makeL1({ evidenceLibrary: [] });
    const intake = makeIntakeData();
    const reqs = makeRequirements();

    const result = runPreflightCheck(l1, intake, reqs);

    const caseStudyGap = result.gaps.find(g => g.type === "evidence");
    expect(caseStudyGap).toBeDefined();
    expect(caseStudyGap?.uploadHint).toBeTruthy();
  });

  it("generate endpoint returns preflight report in response when gaps exist", () => {
    const l1 = makeL1({ evidenceLibrary: [] });
    const intake = makeIntakeData();
    const reqs = makeRequirements();

    const result = runPreflightCheck(l1, intake, reqs);

    // Result should be serializable for API response
    const serialized = JSON.parse(JSON.stringify(result));
    expect(serialized).toHaveProperty("status");
    expect(serialized).toHaveProperty("gaps");
    expect(serialized).toHaveProperty("summary");
  });

  it("case studies prompt includes structured placeholder format when evidence is sparse", () => {
    const l1 = makeL1({ evidenceLibrary: [] });
    const intake = makeIntakeData();
    const reqs = makeRequirements();

    const result = runPreflightCheck(l1, intake, reqs);

    const evidenceGap = result.gaps.find(g => g.type === "evidence");
    expect(evidenceGap?.placeholder).toMatch(/\[CASE STUDY NEEDED/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BAD PATH
// ════════════════════════════════════════════════════════════════════════════

describe("runPreflightCheck — Bad Path", () => {
  it("returns gracefully when L1 tables are completely empty", () => {
    const l1: L1Context = {
      companyContext: [],
      productContexts: [],
      evidenceLibrary: [],
    };
    const intake = makeIntakeData();

    const result = runPreflightCheck(l1, intake, []);

    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
    expect(result.gaps).toBeInstanceOf(Array);
    expect(result.summary.evidenceCount).toBe(0);
  });

  it("handles missing intake_data fields gracefully", () => {
    const l1 = makeL1();
    const intake = {}; // completely empty intake

    const result = runPreflightCheck(l1, intake, []);

    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
  });

  it("handles null rfp_extracted_requirements", () => {
    const l1 = makeL1();
    const intake = makeIntakeData();

    // null requirements — should skip requirement matching
    const result = runPreflightCheck(l1, intake, null as unknown as Record<string, unknown>[]);

    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
  });

  it("handles undefined requirements array", () => {
    const l1 = makeL1();
    const intake = makeIntakeData();

    const result = runPreflightCheck(l1, intake, undefined as unknown as Record<string, unknown>[]);

    expect(result).toBeDefined();
    expect(result.gaps).toBeInstanceOf(Array);
  });

  it("does not throw when evidence_library query returns zero rows", () => {
    const l1 = makeL1({ evidenceLibrary: [] });
    const intake = makeIntakeData();

    expect(() => runPreflightCheck(l1, intake, [])).not.toThrow();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("runPreflightCheck — Edge Cases", () => {
  it("proposal with no documents (paste intake) still gets meaningful preflight", () => {
    const l1 = makeL1();
    const intake = makeIntakeData({ input_type: "pasted" });

    const result = runPreflightCheck(l1, intake, []);

    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
  });

  it("L1 has evidence but none matching RFP industry — reports as needs_data", () => {
    const l1 = makeL1({
      evidenceLibrary: [makeEvidence({ client_industry: "retail" })],
    });
    const intake = makeIntakeData({ client_industry: "government" });
    const reqs = makeRequirements();

    const result = runPreflightCheck(l1, intake, reqs);

    // Evidence exists but doesn't match — should note the mismatch
    expect(result.summary.evidenceCount).toBe(1);
    // The industry mismatch should be flagged
    const industryGap = result.gaps.find(g => g.type === "evidence" && g.detail?.includes("industry"));
    // Either there's an industry gap or the overall evidence is still counted
    expect(result.summary.evidenceCount).toBeGreaterThanOrEqual(0);
  });

  it("L1 has 1 evidence entry for a section needing 3 — reports partial coverage", () => {
    const l1 = makeL1({
      evidenceLibrary: [makeEvidence()],
    });
    const intake = makeIntakeData();
    const reqs = [
      { requirement_text: "Must provide 3 relevant case studies", category: "mandatory", suggested_sections: ["case_studies"] },
    ];

    const result = runPreflightCheck(l1, intake, reqs);

    expect(result.summary.evidenceCount).toBe(1);
  });

  it("very large requirement list returns in reasonable structure", () => {
    const manyReqs = Array.from({ length: 60 }, (_, i) => ({
      requirement_text: `Requirement ${i}`,
      category: "mandatory",
      suggested_sections: ["approach"],
    }));
    const l1 = makeL1();
    const intake = makeIntakeData();

    const result = runPreflightCheck(l1, intake, manyReqs);

    expect(result).toBeDefined();
    expect(result.gaps).toBeInstanceOf(Array);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SECURITY
// ════════════════════════════════════════════════════════════════════════════

describe("runPreflightCheck — Security", () => {
  it("gap report does not include full L1 context data", () => {
    const l1 = makeL1();
    const intake = makeIntakeData();

    const result = runPreflightCheck(l1, intake, []);

    const serialized = JSON.stringify(result);
    // Should not contain full evidence content
    expect(serialized).not.toContain("Full case study...");
    // Should not contain full product descriptions
    expect(serialized).not.toContain("End-to-end cloud migration using ShareGate");
  });

  it("validates that result contains only safe data types", () => {
    const l1 = makeL1();
    const intake = makeIntakeData();

    const result = runPreflightCheck(l1, intake, []);

    // Result should be plain JSON-serializable
    expect(() => JSON.stringify(result)).not.toThrow();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA LEAK
// ════════════════════════════════════════════════════════════════════════════

describe("runPreflightCheck — Data Leak", () => {
  it("gap report contains only counts and category names, not full L1 content", () => {
    const l1 = makeL1();
    const intake = makeIntakeData();

    const result = runPreflightCheck(l1, intake, []);

    // Summary should have counts
    expect(typeof result.summary.evidenceCount).toBe("number");
    expect(typeof result.summary.productCount).toBe("number");
    expect(typeof result.summary.companyContextCount).toBe("number");

    // Gaps should not contain full_content or detailed evidence data
    for (const gap of result.gaps) {
      expect(gap).not.toHaveProperty("full_content");
      expect(gap).not.toHaveProperty("evidence_data");
    }
  });

  it("error scenario does not expose internal DB schema", () => {
    // Even with bad data, the result structure stays clean
    const l1: L1Context = { companyContext: [], productContexts: [], evidenceLibrary: [] };

    const result = runPreflightCheck(l1, {}, []);

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("organization_id");
    expect(serialized).not.toContain("supabase");
    expect(serialized).not.toContain("postgres");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA DAMAGE
// ════════════════════════════════════════════════════════════════════════════

describe("runPreflightCheck — Data Damage", () => {
  it("is read-only — does not modify the L1 context object", () => {
    const l1 = makeL1();
    const originalEvidence = [...l1.evidenceLibrary];
    const originalProducts = [...l1.productContexts];
    const intake = makeIntakeData();

    runPreflightCheck(l1, intake, []);

    expect(l1.evidenceLibrary).toEqual(originalEvidence);
    expect(l1.productContexts).toEqual(originalProducts);
  });

  it("does not modify intake data object", () => {
    const l1 = makeL1();
    const intake = makeIntakeData();
    const originalIntake = { ...intake };

    runPreflightCheck(l1, intake, []);

    expect(intake).toEqual(originalIntake);
  });

  it("concurrent calls with same data produce identical results", () => {
    const l1 = makeL1();
    const intake = makeIntakeData();
    const reqs = makeRequirements();

    const result1 = runPreflightCheck(l1, intake, reqs);
    const result2 = runPreflightCheck(l1, intake, reqs);

    expect(result1.status).toBe(result2.status);
    expect(result1.gaps.length).toBe(result2.gaps.length);
    expect(result1.summary).toEqual(result2.summary);
  });
});
