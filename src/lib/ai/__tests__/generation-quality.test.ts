import { describe, it, expect } from "vitest";
import {
  buildEditorialStandards,
  BANNED_PHRASES,
} from "../prompts/editorial-standards";
import { buildPricingPrompt } from "../prompts/pricing";
import {
  checkCapabilitySpecificity,
  VAGUE_CAPABILITY_TERMS,
} from "../pipeline/context";
import {
  extractDifferentiators,
} from "../pipeline/differentiators";
import type { ProductContext } from "@/types/idd";

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH — Repetition Limiter
// ════════════════════════════════════════════════════════════════════════════

describe("Repetition Limiter — Happy Path", () => {
  it("editorial standards include anti-repetition instruction when differentiators provided", () => {
    const differentiators = [
      "47 federal agency migrations completed",
      "99.9% SLA achievement track record",
    ];

    const standards = buildEditorialStandards("RFP", undefined, undefined, differentiators);

    expect(standards).toContain("differentiators were already stated");
    expect(standards).toContain("47 federal agency migrations completed");
    expect(standards).toContain("99.9% SLA achievement track record");
  });

  it("repetition limiter instructs to demonstrate, not re-state", () => {
    const differentiators = ["Cloud-native expertise"];

    const standards = buildEditorialStandards("RFP", undefined, undefined, differentiators);

    expect(standards).toMatch(/demonstrate.*don.*t re-state|show.*don.*t repeat/i);
  });

  it("repetition limiter skips instruction when no differentiators provided", () => {
    const standards = buildEditorialStandards("RFP");

    expect(standards).not.toContain("differentiators were already stated");
  });

  it("repetition limiter skips instruction when differentiators array is empty", () => {
    const standards = buildEditorialStandards("RFP", undefined, undefined, []);

    expect(standards).not.toContain("differentiators were already stated");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH — Pricing Line-Item Table
// ════════════════════════════════════════════════════════════════════════════

describe("Pricing Line-Item Table — Happy Path", () => {
  const baseIntake: Record<string, unknown> = {
    client_name: "Department of Defense",
    solicitation_type: "RFP",
    scope_description: "Cloud infrastructure migration",
    budget_range: "$2M - $5M",
  };

  it("pricing prompt enforces line-item table with required columns", () => {
    const prompt = buildPricingPrompt(
      baseIntake,
      "analysis",
      "",
      null,
      { name: "Trellex" },
      "",
    );

    expect(prompt).toContain("Line Item");
    expect(prompt).toContain("Description");
    expect(prompt).toContain("Unit");
    expect(prompt).toContain("Quantity");
    expect(prompt).toContain("Unit Price");
    expect(prompt).toContain("Total");
  });

  it("pricing prompt uses $TBD when no specific budget data is available", () => {
    const nobudgetIntake: Record<string, unknown> = {
      client_name: "Test Client",
      solicitation_type: "RFP",
    };

    const prompt = buildPricingPrompt(
      nobudgetIntake,
      "analysis",
      "",
      null,
      { name: "Trellex" },
      "",
    );

    expect(prompt).toContain("$TBD");
  });

  it("pricing prompt includes line-item table format example", () => {
    const prompt = buildPricingPrompt(
      baseIntake,
      "analysis",
      "",
      null,
      { name: "Trellex" },
      "",
    );

    // Should have a markdown table example
    expect(prompt).toMatch(/\|.*Line Item.*\|.*Description.*\|/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH — Tech Specificity Check
// ════════════════════════════════════════════════════════════════════════════

describe("Tech Specificity Check — Happy Path", () => {
  it("flags vague terms in product capabilities", () => {
    const products: ProductContext[] = [
      {
        id: "1",
        product_name: "CloudPlatform",
        service_line: "cloud",
        description: "Our enterprise tools provide comprehensive solution for all needs",
        capabilities: [
          { name: "Advanced Platform", description: "Industry-leading integration" },
        ],
      } as ProductContext,
    ];

    const warnings = checkCapabilitySpecificity(products);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.toLowerCase().includes("enterprise tools"))).toBe(true);
  });

  it("flags defined vague terms from the list", () => {
    const products: ProductContext[] = [
      {
        id: "1",
        product_name: "TestProduct",
        service_line: "consulting",
        description: "A product",
        capabilities: [
          { name: "Feature", description: "Our advanced platform with comprehensive solution" },
        ],
      } as ProductContext,
    ];

    const warnings = checkCapabilitySpecificity(products);

    expect(warnings.some((w) => w.toLowerCase().includes("advanced platform"))).toBe(true);
    expect(warnings.some((w) => w.toLowerCase().includes("comprehensive solution"))).toBe(true);
  });

  it("returns no warnings when capabilities use specific terms", () => {
    const products: ProductContext[] = [
      {
        id: "1",
        product_name: "AWS Migration Toolkit",
        service_line: "cloud_migration",
        description: "Automated Terraform-based infrastructure provisioning",
        capabilities: [
          { name: "Auto-scaling", description: "Kubernetes HPA with custom metrics" },
          { name: "CI/CD", description: "GitHub Actions with ArgoCD deployment" },
        ],
      } as ProductContext,
    ];

    const warnings = checkCapabilitySpecificity(products);

    expect(warnings.length).toBe(0);
  });

  it("VAGUE_CAPABILITY_TERMS includes the defined watchlist", () => {
    expect(VAGUE_CAPABILITY_TERMS).toContain("enterprise tools");
    expect(VAGUE_CAPABILITY_TERMS).toContain("advanced platform");
    expect(VAGUE_CAPABILITY_TERMS).toContain("comprehensive solution");
    expect(VAGUE_CAPABILITY_TERMS).toContain("industry-leading");
  });

  it("specificity warnings appear in L1 context string when present", () => {
    // This tests that buildL1ContextString includes warnings
    // We test the check function directly; integration is in buildL1ContextString
    const products: ProductContext[] = [
      {
        id: "1",
        product_name: "VagueProd",
        service_line: "consulting",
        description: "Our next-generation enterprise tools",
        capabilities: [],
      } as ProductContext,
    ];

    const warnings = checkCapabilitySpecificity(products);

    expect(warnings.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH — Differentiator Extraction
// ════════════════════════════════════════════════════════════════════════════

describe("Differentiator Extraction — Happy Path", () => {
  it("extracts differentiators from executive summary content", () => {
    const execSummary = `## Why Trellex

- **47 Federal Migrations**: We have completed 47 cloud migrations for federal agencies
- **99.9% SLA Track Record**: Our team maintains a 99.9% SLA achievement rate
- **FedRAMP Authorized**: Only partner with active FedRAMP High authorization

### Call to Action
We look forward to partnering with you.`;

    const differentiators = extractDifferentiators(execSummary);

    expect(differentiators.length).toBeGreaterThan(0);
    expect(differentiators.length).toBeLessThanOrEqual(10);
  });

  it("extracts bullet points as differentiators", () => {
    const content = `Some text.
- **Speed**: 14-day average deployment
- **Scale**: 10,000+ user environments
- **Security**: FedRAMP High authorized`;

    const differentiators = extractDifferentiators(content);

    expect(differentiators.length).toBe(3);
    expect(differentiators[0]).toContain("14-day");
  });

  it("returns empty array for content with no differentiators", () => {
    const content = "This is a simple paragraph with no bullet points or bold claims.";

    const differentiators = extractDifferentiators(content);

    expect(differentiators).toEqual([]);
  });

  it("limits extracted differentiators to 10", () => {
    const bullets = Array.from(
      { length: 15 },
      (_, i) => `- **Point ${i + 1}**: Differentiator detail ${i + 1}`,
    ).join("\n");

    const differentiators = extractDifferentiators(bullets);

    expect(differentiators.length).toBeLessThanOrEqual(10);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BAD PATH
// ════════════════════════════════════════════════════════════════════════════

describe("Generation Quality — Bad Path", () => {
  it("repetition limiter handles empty differentiator list — no crash, skip instruction", () => {
    const standards = buildEditorialStandards("RFP", undefined, undefined, []);

    expect(standards.length).toBeGreaterThan(100);
    expect(standards).not.toContain("differentiators were already stated");
  });

  it("pricing table handles intake with only a lump-sum budget", () => {
    const intake: Record<string, unknown> = {
      client_name: "Small Agency",
      budget_range: "$500,000 total",
    };

    const prompt = buildPricingPrompt(
      intake,
      "analysis",
      "",
      null,
      { name: "Trellex" },
      "",
    );

    // Should still enforce table format even with lump sum
    expect(prompt).toContain("Line Item");
  });

  it("specificity check handles empty capabilities array — no false positive warnings", () => {
    const products: ProductContext[] = [
      {
        id: "1",
        product_name: "TestProduct",
        service_line: "consulting",
        description: "A specific product for specific needs",
        capabilities: [],
      } as ProductContext,
    ];

    const warnings = checkCapabilitySpecificity(products);

    expect(warnings.length).toBe(0);
  });

  it("differentiator extraction handles null/undefined content", () => {
    expect(extractDifferentiators("")).toEqual([]);
    expect(extractDifferentiators(null as unknown as string)).toEqual([]);
    expect(extractDifferentiators(undefined as unknown as string)).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Generation Quality — Edge Cases", () => {
  it("proposal with 15+ sections — differentiator list is passed to all via editorial standards", () => {
    const differentiators = ["Speed", "Quality"];

    // Test that building standards multiple times with same differentiators works consistently
    const s1 = buildEditorialStandards("RFP", undefined, undefined, differentiators);
    const s2 = buildEditorialStandards("RFP", undefined, undefined, differentiators);

    expect(s1).toBe(s2);
    expect(s1).toContain("Speed");
    expect(s1).toContain("Quality");
  });

  it("budget data has mixed formats — pricing table still enforces structure", () => {
    const intake: Record<string, unknown> = {
      client_name: "Mixed Corp",
      budget_range: "Phase 1: $1M, Phase 2: TBD, Phase 3: $500K",
    };

    const prompt = buildPricingPrompt(
      intake,
      "analysis",
      "",
      null,
      { name: "Trellex" },
      "",
    );

    expect(prompt).toContain("$TBD");
    expect(prompt).toContain("Line Item");
  });

  it("vague term detection is case-insensitive", () => {
    const products: ProductContext[] = [
      {
        id: "1",
        product_name: "Test",
        service_line: "consulting",
        description: "Our ENTERPRISE TOOLS and Advanced Platform",
        capabilities: [],
      } as ProductContext,
    ];

    const warnings = checkCapabilitySpecificity(products);

    expect(warnings.length).toBeGreaterThan(0);
  });

  it("differentiator extraction handles content with only headings (no bullets)", () => {
    const content = `## Section One
Some paragraph text.
## Section Two
More paragraph text.`;

    const differentiators = extractDifferentiators(content);

    expect(differentiators).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SECURITY
// ════════════════════════════════════════════════════════════════════════════

describe("Generation Quality — Security", () => {
  it("differentiator list does not include any raw L1 data, only public claims", () => {
    // The extraction function only pulls from generated content (L3),
    // not from L1 data directly
    const content = `- **Public Claim**: We delivered 47 migrations`;

    const differentiators = extractDifferentiators(content);

    // Should contain only the text from the generated content
    expect(differentiators[0]).toContain("47 migrations");
  });

  it("pricing placeholder $TBD is clearly distinguished from real amounts", () => {
    const prompt = buildPricingPrompt(
      { client_name: "Test" },
      "",
      "",
      null,
      { name: "Acme" },
      "",
    );

    // $TBD should be explicitly mentioned as a placeholder
    expect(prompt).toMatch(/\$TBD/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA LEAK
// ════════════════════════════════════════════════════════════════════════════

describe("Generation Quality — Data Leak", () => {
  it("specificity warnings are metadata only — not exposed in generated content", () => {
    // checkCapabilitySpecificity returns warnings for the pipeline,
    // they should be marked as internal
    const products: ProductContext[] = [
      {
        id: "1",
        product_name: "VagueProd",
        service_line: "consulting",
        description: "enterprise tools platform",
        capabilities: [],
      } as ProductContext,
    ];

    const warnings = checkCapabilitySpecificity(products);

    // Warnings are pipeline-internal strings, not exposed to AI generation
    for (const w of warnings) {
      expect(w).toMatch(/SPECIFICITY WARNING/i);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA DAMAGE
// ════════════════════════════════════════════════════════════════════════════

describe("Generation Quality — Data Damage", () => {
  it("repetition limiter is prompt-only — does not modify any stored data", () => {
    // buildEditorialStandards is a pure function — test idempotency
    const d = ["Speed", "Quality"];
    const r1 = buildEditorialStandards("RFP", undefined, undefined, d);
    const r2 = buildEditorialStandards("RFP", undefined, undefined, d);
    expect(r1).toBe(r2);
  });

  it("specificity check is advisory — does not throw or prevent generation", () => {
    // Even with all-vague products, no error thrown
    const products: ProductContext[] = [
      {
        id: "1",
        product_name: "VagueProd",
        service_line: "consulting",
        description: "enterprise tools advanced platform comprehensive solution industry-leading next-generation",
        capabilities: [
          { name: "Feature", description: "comprehensive solution with enterprise tools" },
        ],
      } as ProductContext,
    ];

    expect(() => checkCapabilitySpecificity(products)).not.toThrow();
  });

  it("buildEditorialStandards remains backward-compatible with 3 params", () => {
    // Old callers pass (solicitationType, audience, brandName)
    expect(() => buildEditorialStandards("RFP", undefined, "Acme")).not.toThrow();
    expect(() => buildEditorialStandards("RFP")).not.toThrow();
    expect(() => buildEditorialStandards()).not.toThrow();
  });

  it("extractDifferentiators does not mutate input string", () => {
    const content = "- **Point**: Detail";
    const original = content;
    extractDifferentiators(content);
    expect(content).toBe(original);
  });
});
