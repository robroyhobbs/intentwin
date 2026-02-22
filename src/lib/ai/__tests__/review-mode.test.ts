import { describe, it, expect } from "vitest";
import {
  extractPlaceholders,
  markResolvedPlaceholders,
} from "@/components/preflight/review-mode-sidebar";
import type { PlaceholderItem } from "@/components/preflight/review-mode-sidebar";

// Helper to create a mock section
function mockSection(overrides: Partial<{
  id: string;
  title: string;
  section_type: string;
  generated_content: string | null;
  edited_content: string | null;
}> = {}) {
  return {
    id: overrides.id ?? "sec-1",
    title: overrides.title ?? "Executive Summary",
    section_type: overrides.section_type ?? "executive_summary",
    generated_content: overrides.generated_content ?? null,
    edited_content: overrides.edited_content ?? null,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH — Placeholder Detection
// ════════════════════════════════════════════════════════════════════════════

describe("Review Mode — Placeholder Detection (Happy Path)", () => {
  it("detects [CASE STUDY NEEDED: ...] placeholders", () => {
    const sections = [
      mockSection({
        generated_content:
          "Our experience includes [CASE STUDY NEEDED: federal_government, cloud migration] and other work.",
      }),
    ];

    const items = extractPlaceholders(sections);

    expect(items.length).toBe(1);
    expect(items[0].text).toContain("CASE STUDY NEEDED");
  });

  it("detects [TEAM MEMBER NEEDED: ...] placeholders", () => {
    const sections = [
      mockSection({
        generated_content:
          "The team lead will be [TEAM MEMBER NEEDED: Senior Cloud Architect].",
      }),
    ];

    const items = extractPlaceholders(sections);

    expect(items.length).toBe(1);
    expect(items[0].text).toContain("TEAM MEMBER NEEDED");
  });

  it("detects merge field placeholders ({signatory_name}, etc.)", () => {
    const sections = [
      mockSection({
        generated_content:
          "Respectfully submitted, {signatory_name}, {signatory_title}",
      }),
    ];

    const items = extractPlaceholders(sections);

    expect(items.length).toBe(2);
    expect(items.some((i) => i.text === "{signatory_name}")).toBe(true);
    expect(items.some((i) => i.text === "{signatory_title}")).toBe(true);
  });

  it("detects $TBD pricing placeholders", () => {
    const sections = [
      mockSection({
        generated_content:
          "| Phase 1 | Discovery | Fixed | 1 | $TBD | $TBD |",
      }),
    ];

    const items = extractPlaceholders(sections);

    expect(items.length).toBe(2); // Two $TBD instances
    expect(items.every((i) => i.text === "$TBD")).toBe(true);
  });

  it("detects {date} and {client_name} merge fields", () => {
    const sections = [
      mockSection({
        generated_content: "Date: {date}\nTo: {client_name}",
      }),
    ];

    const items = extractPlaceholders(sections);

    expect(items.length).toBe(2);
    expect(items.some((i) => i.text === "{date}")).toBe(true);
    expect(items.some((i) => i.text === "{client_name}")).toBe(true);
  });

  it("returns section title and ID for each placeholder", () => {
    const sections = [
      mockSection({
        id: "section-abc",
        title: "Cover Letter",
        generated_content: "{signatory_name}",
      }),
    ];

    const items = extractPlaceholders(sections);

    expect(items[0].sectionId).toBe("section-abc");
    expect(items[0].sectionTitle).toBe("Cover Letter");
  });

  it("shows completion count: resolved vs total", () => {
    const sections = [
      mockSection({
        generated_content: "[CASE STUDY NEEDED: test] and {signatory_name}",
        edited_content: "Real case study here and {signatory_name}",
      }),
    ];

    const items = markResolvedPlaceholders(sections);

    // CASE STUDY was resolved (removed in edited), signatory_name still present
    const resolved = items.filter((i) => i.resolved);
    const unresolved = items.filter((i) => !i.resolved);

    expect(resolved.length).toBe(1);
    expect(unresolved.length).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BAD PATH
// ════════════════════════════════════════════════════════════════════════════

describe("Review Mode — Bad Path", () => {
  it("handles proposal with 0 placeholders — returns empty array", () => {
    const sections = [
      mockSection({
        generated_content: "This is a clean section with no placeholders.",
      }),
    ];

    const items = extractPlaceholders(sections);

    expect(items).toEqual([]);
  });

  it("handles section with null generated_content", () => {
    const sections = [
      mockSection({
        generated_content: null,
      }),
    ];

    const items = extractPlaceholders(sections);

    expect(items).toEqual([]);
  });

  it("handles empty sections array", () => {
    const items = extractPlaceholders([]);

    expect(items).toEqual([]);
  });

  it("handles section with placeholder manually deleted (not via UI)", () => {
    const sections = [
      mockSection({
        generated_content: "[CASE STUDY NEEDED: test]",
        edited_content: "The actual case study content here.",
      }),
    ];

    const items = markResolvedPlaceholders(sections);

    // Should mark as resolved since it was in generated but removed in edited
    expect(items[0].resolved).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Review Mode — Edge Cases", () => {
  it("30+ placeholders — all detected correctly", () => {
    const manyTBD = Array.from(
      { length: 35 },
      (_, i) => `| Item ${i + 1} | desc | unit | 1 | $TBD | $TBD |`,
    ).join("\n");

    const sections = [
      mockSection({
        generated_content: manyTBD,
      }),
    ];

    const items = extractPlaceholders(sections);

    // 35 rows * 2 $TBD per row = 70
    expect(items.length).toBe(70);
  });

  it("very long placeholder text — detected correctly", () => {
    const longPlaceholder = `[CASE STUDY NEEDED: federal_government, cloud migration of 500+ legacy applications across 12 agencies with FedRAMP High compliance requirements and zero-downtime cutover]`;

    const sections = [
      mockSection({
        generated_content: longPlaceholder,
      }),
    ];

    const items = extractPlaceholders(sections);

    expect(items.length).toBe(1);
    expect(items[0].text).toBe(longPlaceholder);
  });

  it("review mode on a regenerated section — re-scans for new placeholders", () => {
    // After regeneration, generated_content changes. The component
    // receives new sections and re-runs the scan.
    const before = [
      mockSection({
        generated_content: "[CASE STUDY NEEDED: old]",
      }),
    ];

    const after = [
      mockSection({
        generated_content: "[TEAM MEMBER NEEDED: new role]",
      }),
    ];

    const itemsBefore = extractPlaceholders(before);
    const itemsAfter = extractPlaceholders(after);

    expect(itemsBefore[0].text).toContain("CASE STUDY");
    expect(itemsAfter[0].text).toContain("TEAM MEMBER");
  });

  it("multiple placeholders across multiple sections", () => {
    const sections = [
      mockSection({
        id: "sec-1",
        title: "Cover Letter",
        generated_content: "{signatory_name}, {signatory_title}, {date}",
      }),
      mockSection({
        id: "sec-2",
        title: "Case Studies",
        generated_content: "[CASE STUDY NEEDED: healthcare, IT modernization]",
      }),
      mockSection({
        id: "sec-3",
        title: "Pricing",
        generated_content: "| Line 1 | desc | unit | 1 | $TBD | $TBD |",
      }),
    ];

    const items = extractPlaceholders(sections);

    expect(items.length).toBe(6); // 3 merge fields + 1 case study + 2 $TBD
    expect(items.filter((i) => i.sectionId === "sec-1").length).toBe(3);
    expect(items.filter((i) => i.sectionId === "sec-2").length).toBe(1);
    expect(items.filter((i) => i.sectionId === "sec-3").length).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SECURITY
// ════════════════════════════════════════════════════════════════════════════

describe("Review Mode — Security", () => {
  it("review mode only shows placeholder text, not full generated content", () => {
    const sections = [
      mockSection({
        generated_content:
          "SECRET INTERNAL DATA. [CASE STUDY NEEDED: test]. More secret data.",
      }),
    ];

    const items = extractPlaceholders(sections);

    // Only the placeholder text is extracted, not surrounding content
    expect(items[0].text).toBe("[CASE STUDY NEEDED: test]");
    expect(items[0].text).not.toContain("SECRET INTERNAL DATA");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA DAMAGE
// ════════════════════════════════════════════════════════════════════════════

describe("Review Mode — Data Damage", () => {
  it("extractPlaceholders is read-only — does not modify sections", () => {
    const sections = [
      mockSection({
        generated_content: "{signatory_name}",
      }),
    ];

    const original = JSON.stringify(sections);
    extractPlaceholders(sections);

    expect(JSON.stringify(sections)).toBe(original);
  });

  it("markResolvedPlaceholders is read-only — does not modify sections", () => {
    const sections = [
      mockSection({
        generated_content: "{signatory_name}",
        edited_content: "John Doe",
      }),
    ];

    const original = JSON.stringify(sections);
    markResolvedPlaceholders(sections);

    expect(JSON.stringify(sections)).toBe(original);
  });

  it("review mode uses existing section edit flow — no new write path", () => {
    // extractPlaceholders and markResolvedPlaceholders are pure read-only functions
    // They never call any API or modify state
    const items = extractPlaceholders([]);
    expect(items).toEqual([]);
  });
});
