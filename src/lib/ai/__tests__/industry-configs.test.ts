import { describe, it, expect } from "vitest";
import {
  getIndustryConfig,
  buildIndustryContext,
  type IndustryConfig,
} from "../industry-configs/index";

// ════════════════════════════════════════════════════════════════════════════
// getIndustryConfig — Lookup
// ════════════════════════════════════════════════════════════════════════════

describe("getIndustryConfig — Happy Path", () => {
  it("returns config for financial_services", () => {
    const config = getIndustryConfig("financial_services");
    expect(config).not.toBeNull();
    expect(config!.key).toBe("financial_services");
    expect(config!.displayName).toBe("Financial Services");
  });

  it("returns config for healthcare", () => {
    const config = getIndustryConfig("healthcare");
    expect(config).not.toBeNull();
    expect(config!.key).toBe("healthcare");
  });

  it("returns config for public_sector", () => {
    const config = getIndustryConfig("public_sector");
    expect(config).not.toBeNull();
    expect(config!.key).toBe("public_sector");
  });

  it("returns config for manufacturing", () => {
    const config = getIndustryConfig("manufacturing");
    expect(config).not.toBeNull();
    expect(config!.key).toBe("manufacturing");
  });

  it("each config has required fields populated", () => {
    const keys = ["financial_services", "healthcare", "public_sector", "manufacturing"];
    for (const key of keys) {
      const config = getIndustryConfig(key);
      expect(config).not.toBeNull();
      expect(config!.painPoints.length).toBeGreaterThan(0);
      expect(config!.keywords.length).toBeGreaterThan(0);
      expect(config!.priorities.length).toBeGreaterThan(0);
      expect(config!.winThemes.length).toBeGreaterThan(0);
      expect(Object.keys(config!.sectionGuidance).length).toBeGreaterThan(0);
    }
  });
});

describe("getIndustryConfig — Unknown/Missing Keys", () => {
  it("returns null for unknown industry key", () => {
    expect(getIndustryConfig("aerospace")).toBeNull();
  });

  it("returns null for 'other'", () => {
    expect(getIndustryConfig("other")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getIndustryConfig("")).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// buildIndustryContext — Prompt builder
// ════════════════════════════════════════════════════════════════════════════

describe("buildIndustryContext — Happy Path", () => {
  let config: IndustryConfig;

  beforeAll(() => {
    config = getIndustryConfig("financial_services")!;
  });

  it("returns non-empty string for valid config", () => {
    const context = buildIndustryContext(config);
    expect(context).toBeTruthy();
    expect(context.length).toBeGreaterThan(50);
  });

  it("includes industry intelligence header", () => {
    const context = buildIndustryContext(config);
    expect(context).toContain("## Industry Intelligence");
  });

  it("includes display name", () => {
    const context = buildIndustryContext(config);
    expect(context).toContain("Financial Services");
  });

  it("includes pain points", () => {
    const context = buildIndustryContext(config);
    expect(context).toContain("Key industry pain points to address");
    // Check at least one pain point is present
    expect(context).toContain(config.painPoints[0]);
  });

  it("includes keywords", () => {
    const context = buildIndustryContext(config);
    expect(context).toContain("Use this terminology naturally");
    expect(context).toContain("risk management");
  });

  it("includes priorities", () => {
    const context = buildIndustryContext(config);
    expect(context).toContain("Buyer priorities in this sector");
    expect(context).toContain(config.priorities[0]);
  });

  it("includes section-specific guidance when sectionType is provided", () => {
    const context = buildIndustryContext(config, "executive_summary");
    expect(context).toContain("Section-specific guidance");
    expect(context).toContain(config.sectionGuidance["executive_summary"]);
  });

  it("omits section guidance when sectionType is not provided", () => {
    const context = buildIndustryContext(config);
    expect(context).not.toContain("Section-specific guidance");
  });

  it("omits section guidance when sectionType has no matching guidance", () => {
    const context = buildIndustryContext(config, "nonexistent_section");
    expect(context).not.toContain("Section-specific guidance");
  });
});

describe("buildIndustryContext — Null config (graceful degradation)", () => {
  it("returns empty string for null config", () => {
    expect(buildIndustryContext(null)).toBe("");
  });

  it("returns empty string for null config even with sectionType", () => {
    expect(buildIndustryContext(null, "executive_summary")).toBe("");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("buildIndustryContext — Edge Cases", () => {
  it("handles config with empty arrays gracefully", () => {
    const emptyConfig: IndustryConfig = {
      key: "test",
      displayName: "Test Industry",
      painPoints: [],
      keywords: [],
      priorities: [],
      winThemes: [],
      sectionGuidance: {},
    };

    const context = buildIndustryContext(emptyConfig);
    expect(context).toContain("## Industry Intelligence");
    expect(context).toContain("Test Industry");
    // Should NOT include section headers for empty arrays
    expect(context).not.toContain("Key industry pain points");
    expect(context).not.toContain("Use this terminology");
    expect(context).not.toContain("Buyer priorities");
  });
});
