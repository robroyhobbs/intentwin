import { describe, it, expect } from "vitest";
import {
  buildAssumptionsPrompt,
  ASSUMPTION_CATEGORIES,
  type Assumption,
  type AssumptionCategory,
} from "../prompts/assumptions";

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH — Assumptions Prompt Generation
// ════════════════════════════════════════════════════════════════════════════

describe("Assumptions — Happy Path", () => {
  const baseIntake: Record<string, unknown> = {
    client_name: "Department of Health and Human Services",
    scope_description: "Cloud migration of legacy mainframe applications",
    timeline: "18 months starting Q3 2026",
    solicitation_type: "RFP",
    opportunity_type: "cloud_migration",
    client_industry: "federal_government",
  };

  it("generates prompt with client name and scope from intake data", () => {
    const prompt = buildAssumptionsPrompt(baseIntake, "Strategic analysis text");

    expect(prompt).toContain("Department of Health and Human Services");
    expect(prompt).toContain("Cloud migration of legacy mainframe applications");
  });

  it("includes solicitation type in prompt", () => {
    const prompt = buildAssumptionsPrompt(baseIntake, "analysis");

    expect(prompt).toContain("RFP");
  });

  it("includes all 10 assumption categories in prompt", () => {
    const prompt = buildAssumptionsPrompt(baseIntake, "analysis");

    for (const category of ASSUMPTION_CATEGORIES) {
      expect(prompt).toContain(category);
    }
  });

  it("includes timeline reference when timeline is provided", () => {
    const prompt = buildAssumptionsPrompt(baseIntake, "analysis");

    expect(prompt).toContain("18 months starting Q3 2026");
  });

  it("includes JSON output format specification", () => {
    const prompt = buildAssumptionsPrompt(baseIntake, "analysis");

    expect(prompt).toContain("category");
    expect(prompt).toContain("text");
    expect(prompt).toContain("is_ai_generated");
    expect(prompt).toContain("JSON array");
  });

  it("requests 10-20 assumptions", () => {
    const prompt = buildAssumptionsPrompt(baseIntake, "analysis");

    expect(prompt).toMatch(/10.*20.*assumptions/i);
  });

  it("includes strategic analysis in context", () => {
    const analysisText = "Key risk: tight timeline requires parallel workstreams";
    const prompt = buildAssumptionsPrompt(baseIntake, analysisText);

    expect(prompt).toContain(analysisText);
  });

  it("Assumption type has correct shape", () => {
    const assumption: Assumption = {
      category: "working_hours",
      text: "Standard business hours Monday-Friday",
      is_ai_generated: true,
    };

    expect(assumption.category).toBe("working_hours");
    expect(assumption.is_ai_generated).toBe(true);
  });

  it("ASSUMPTION_CATEGORIES includes all required categories", () => {
    const required: AssumptionCategory[] = [
      "working_hours",
      "site_access",
      "customer_responsibilities",
      "change_control",
      "out_of_scope",
      "staffing",
      "technology",
      "timeline",
      "compliance",
      "general",
    ];

    for (const cat of required) {
      expect(ASSUMPTION_CATEGORIES).toContain(cat);
    }
    expect(ASSUMPTION_CATEGORIES.length).toBe(10);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BAD PATH — Missing or sparse input
// ════════════════════════════════════════════════════════════════════════════

describe("Assumptions — Bad Path", () => {
  it("handles RFPs with no timeline info — produces generic defaults", () => {
    const intake: Record<string, unknown> = {
      client_name: "Acme Corp",
      scope_description: "IT modernization",
    };

    const prompt = buildAssumptionsPrompt(intake, "");

    // Should still produce a valid prompt without crashing
    expect(prompt).toContain("Acme Corp");
    expect(prompt.length).toBeGreaterThan(200);
  });

  it("handles empty intake data gracefully", () => {
    const prompt = buildAssumptionsPrompt({}, "");

    // Should fall back to defaults
    expect(prompt).toContain("the client"); // default client name
    expect(prompt).toContain("the engagement"); // default scope
  });

  it("handles missing scope_description", () => {
    const intake: Record<string, unknown> = {
      client_name: "State of California",
    };

    const prompt = buildAssumptionsPrompt(intake, "analysis");

    expect(prompt).toContain("State of California");
    expect(prompt).toContain("the engagement"); // default scope
  });

  it("handles missing solicitation_type — defaults to RFP", () => {
    const intake: Record<string, unknown> = {
      client_name: "Test Corp",
    };

    const prompt = buildAssumptionsPrompt(intake, "analysis");

    expect(prompt).toContain("RFP");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Assumptions — Edge Cases", () => {
  it("handles very short RFP context — still generates valid prompt", () => {
    const intake: Record<string, unknown> = {
      client_name: "X",
      scope_description: "consulting",
    };

    const prompt = buildAssumptionsPrompt(intake, "short");

    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toContain("consulting");
  });

  it("handles special characters in client name (dollar amounts, etc.)", () => {
    const intake: Record<string, unknown> = {
      client_name: "O'Brien & Associates, LLC — $50M budget",
      scope_description: "Re-platforming: 100% SaaS migration",
    };

    const prompt = buildAssumptionsPrompt(intake, "analysis");

    expect(prompt).toContain("O'Brien & Associates, LLC — $50M budget");
    expect(prompt).toContain("Re-platforming: 100% SaaS migration");
  });

  it("includes out_of_scope and customer_responsibilities as mandatory categories", () => {
    const prompt = buildAssumptionsPrompt({ client_name: "Test" }, "analysis");

    expect(prompt).toContain("out_of_scope");
    expect(prompt).toContain("customer_responsibilities");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SECURITY — No prompt injection or data leak
// ════════════════════════════════════════════════════════════════════════════

describe("Assumptions — Security", () => {
  it("assumptions JSONB structure enforces is_ai_generated flag", () => {
    // Validate that the type requires is_ai_generated
    const valid: Assumption = {
      category: "general",
      text: "test",
      is_ai_generated: true,
    };

    // TypeScript enforces the shape — this is a compile-time check
    expect(valid).toHaveProperty("is_ai_generated");
  });

  it("prompt instructs JSON-only output (no additional text)", () => {
    const prompt = buildAssumptionsPrompt({ client_name: "Test" }, "");

    expect(prompt).toMatch(/respond only with.*json/i);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA DAMAGE — Idempotency and backward compatibility
// ════════════════════════════════════════════════════════════════════════════

describe("Assumptions — Data Damage", () => {
  it("calling buildAssumptionsPrompt twice with same input returns consistent output", () => {
    const intake: Record<string, unknown> = {
      client_name: "Test Corp",
      scope_description: "testing",
      timeline: "6 months",
    };
    const analysis = "Test analysis";

    const r1 = buildAssumptionsPrompt(intake, analysis);
    const r2 = buildAssumptionsPrompt(intake, analysis);

    expect(r1).toBe(r2);
  });

  it("does not mutate the intake data object", () => {
    const intake: Record<string, unknown> = {
      client_name: "Test",
      scope_description: "testing",
    };
    const original = JSON.stringify(intake);

    buildAssumptionsPrompt(intake, "analysis");

    expect(JSON.stringify(intake)).toBe(original);
  });
});
