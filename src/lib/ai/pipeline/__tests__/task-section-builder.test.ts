import { describe, it, expect } from "vitest";
import type { RfpTaskStructure, SectionConfig } from "../types";

// ════════════════════════════════════════════════════════════════════════════
// buildSectionList — Task Mode vs Fixed Mode
// ════════════════════════════════════════════════════════════════════════════

const makeStructure = (
  tasks: RfpTaskStructure["tasks"],
): RfpTaskStructure => ({
  tasks,
  extracted_at: "2026-02-22T12:00:00Z",
});

const makeTask = (
  task_number: string,
  title: string,
  parent: string | null = null,
  category: "technical" | "support-operations" | "management" = "technical",
) => ({
  task_number,
  title,
  description: `Description for ${title}`,
  category,
  parent_task_number: parent,
});

/** The 4 approach-related section types that task mode replaces */
const REPLACED_TYPES = ["approach", "methodology", "understanding", "timeline"];

/** The 9 fixed section types that remain in task mode */
const KEPT_FIXED_TYPES = [
  "cover_letter",
  "executive_summary",
  "team",
  "case_studies",
  "pricing",
  "risk_mitigation",
  "why_us",
  "compliance_matrix_section",
  "exceptions_terms",
];

describe("buildSectionList — Task Mode (≥3 tasks)", () => {
  it("returns fixed sections + task sections, without approach/methodology/understanding/timeline", async () => {
    const { buildSectionList } = await import("../section-configs");
    const structure = makeStructure([
      makeTask("1", "Help Desk"),
      makeTask("2", "Network Ops"),
      makeTask("3", "Security"),
    ]);

    const sections = buildSectionList(structure, "RFP");
    const types = sections.map((s) => s.type);

    // Should NOT contain the replaced types
    for (const replaced of REPLACED_TYPES) {
      expect(types).not.toContain(replaced);
    }

    // Should contain rfp_task sections
    const taskSections = sections.filter((s) => s.type === "rfp_task");
    expect(taskSections.length).toBe(3);
  });

  it("orders task sections by RFP task number", async () => {
    const { buildSectionList } = await import("../section-configs");
    const structure = makeStructure([
      makeTask("2", "Second"),
      makeTask("1", "First"),
      makeTask("3", "Third"),
    ]);

    const sections = buildSectionList(structure, "RFP");
    const taskSections = sections.filter((s) => s.type === "rfp_task");
    const taskTitles = taskSections.map((s) => s.title);

    // Should be ordered by task number, not input order
    expect(taskTitles[0]).toContain("First");
    expect(taskTitles[1]).toContain("Second");
    expect(taskTitles[2]).toContain("Third");
  });

  it("keeps fixed bookend sections in correct positions", async () => {
    const { buildSectionList } = await import("../section-configs");
    const structure = makeStructure([
      makeTask("1", "T1"),
      makeTask("2", "T2"),
      makeTask("3", "T3"),
    ]);

    const sections = buildSectionList(structure, "RFP");
    // cover_letter should be first (order 0)
    expect(sections[0].type).toBe("cover_letter");
    // executive_summary should be second (order 1)
    expect(sections[1].type).toBe("executive_summary");
    // why_us should be near the end
    const whyUs = sections.find((s) => s.type === "why_us");
    expect(whyUs).toBeDefined();
  });

  it("resolves leaf nodes: parent with subtasks excluded, subtasks included", async () => {
    const { buildSectionList } = await import("../section-configs");
    const structure = makeStructure([
      makeTask("1", "Parent", null),
      makeTask("1.1", "Child A", "1"),
      makeTask("1.2", "Child B", "1"),
      makeTask("2", "Standalone", null),
    ]);

    const sections = buildSectionList(structure, "RFP");
    const taskSections = sections.filter((s) => s.type === "rfp_task");

    // Only leaves: 1.1, 1.2, 2 — NOT "1" (it has children)
    expect(taskSections.length).toBe(3);
    const taskTitles = taskSections.map((s) => s.title);
    expect(taskTitles.some((t) => t.includes("Child A"))).toBe(true);
    expect(taskTitles.some((t) => t.includes("Child B"))).toBe(true);
    expect(taskTitles.some((t) => t.includes("Standalone"))).toBe(true);
    // Parent should NOT have a section
    expect(taskTitles.some((t) => t.includes("Parent") && !t.includes("Child"))).toBe(false);
  });

  it("top-level task with no subtasks is itself a leaf", async () => {
    const { buildSectionList } = await import("../section-configs");
    const structure = makeStructure([
      makeTask("1", "Lone Task A"),
      makeTask("2", "Lone Task B"),
      makeTask("3", "Lone Task C"),
    ]);

    const sections = buildSectionList(structure, "RFP");
    const taskSections = sections.filter((s) => s.type === "rfp_task");
    expect(taskSections.length).toBe(3);
  });

  it("3-level nesting: only deepest leaves get sections", async () => {
    const { buildSectionList } = await import("../section-configs");
    const structure = makeStructure([
      makeTask("1", "Grandparent", null),
      makeTask("1.1", "Parent", "1"),
      makeTask("1.1.1", "Leaf A", "1.1"),
      makeTask("1.1.2", "Leaf B", "1.1"),
      makeTask("2", "Standalone", null),
      makeTask("3", "Also Standalone", null),
    ]);

    const sections = buildSectionList(structure, "RFP");
    const taskSections = sections.filter((s) => s.type === "rfp_task");

    // Only leaves: 1.1.1, 1.1.2, 2, 3
    expect(taskSections.length).toBe(4);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// buildSectionList — Fixed Mode (fallback)
// ════════════════════════════════════════════════════════════════════════════

describe("buildSectionList — Fixed Mode (fallback)", () => {
  it("returns standard fixed template for null rfpTaskStructure", async () => {
    const { buildSectionList, getSectionsForSolicitationType } = await import("../section-configs");
    const fixedSections = getSectionsForSolicitationType("RFP");
    const result = buildSectionList(null, "RFP");

    expect(result).toHaveLength(fixedSections.length);
    // Should contain approach/methodology/understanding/timeline
    const types = result.map((s) => s.type);
    expect(types).toContain("approach");
    expect(types).toContain("methodology");
  });

  it("returns standard fixed template for 0 tasks", async () => {
    const { buildSectionList } = await import("../section-configs");
    const structure = makeStructure([]);
    const result = buildSectionList(structure, "RFP");

    const types = result.map((s) => s.type);
    expect(types).toContain("approach");
  });

  it("returns standard fixed template for 2 tasks (below threshold)", async () => {
    const { buildSectionList } = await import("../section-configs");
    const structure = makeStructure([
      makeTask("1", "T1"),
      makeTask("2", "T2"),
    ]);

    const result = buildSectionList(structure, "RFP");
    const types = result.map((s) => s.type);
    expect(types).toContain("approach");
    expect(types).not.toContain("rfp_task");
  });

  it("returns standard fixed template for empty tasks array", async () => {
    const { buildSectionList } = await import("../section-configs");
    const structure = makeStructure([]);
    const result = buildSectionList(structure, "RFP");

    const types = result.map((s) => s.type);
    expect(types).toContain("approach");
    expect(types).not.toContain("rfp_task");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// buildSectionList — Edge Cases
// ════════════════════════════════════════════════════════════════════════════

describe("buildSectionList — Edge Cases", () => {
  it("handles 20 leaf subtasks", async () => {
    const { buildSectionList } = await import("../section-configs");
    const tasks = Array.from({ length: 20 }, (_, i) => makeTask(String(i + 1), `Task ${i + 1}`));
    const structure = makeStructure(tasks);

    const sections = buildSectionList(structure, "RFP");
    const taskSections = sections.filter((s) => s.type === "rfp_task");
    expect(taskSections.length).toBe(20);
  });

  it("single parent with 10 subtasks — parent excluded, 10 subtasks created", async () => {
    const { buildSectionList } = await import("../section-configs");
    const tasks = [
      makeTask("1", "Parent"),
      ...Array.from({ length: 10 }, (_, i) =>
        makeTask(`1.${i + 1}`, `Sub ${i + 1}`, "1"),
      ),
    ];
    const structure = makeStructure(tasks);

    const sections = buildSectionList(structure, "RFP");
    const taskSections = sections.filter((s) => s.type === "rfp_task");
    expect(taskSections.length).toBe(10);
  });

  it("is a pure function — does not mutate SECTION_CONFIGS", async () => {
    const { buildSectionList, SECTION_CONFIGS } = await import("../section-configs");
    const originalLength = SECTION_CONFIGS.length;
    const structure = makeStructure([
      makeTask("1", "T1"),
      makeTask("2", "T2"),
      makeTask("3", "T3"),
    ]);

    buildSectionList(structure, "RFP");
    expect(SECTION_CONFIGS).toHaveLength(originalLength);
  });

  it("task sections have correct metadata in the config", async () => {
    const { buildSectionList } = await import("../section-configs");
    const structure = makeStructure([
      makeTask("1", "Help Desk", null, "support-operations"),
      makeTask("2", "Security", null, "compliance-security"),
      makeTask("3", "Training", null, "training"),
    ]);

    const sections = buildSectionList(structure, "RFP");
    const taskSections = sections.filter((s) => s.type === "rfp_task");

    // Each task section should have taskMeta
    for (const section of taskSections) {
      expect(section.taskMeta).toBeDefined();
      expect(section.taskMeta!.task_number).toBeTruthy();
      expect(section.taskMeta!.title).toBeTruthy();
      expect(section.taskMeta!.category).toBeTruthy();
    }
  });

  it("respects solicitation type for non-task fixed sections", async () => {
    const { buildSectionList } = await import("../section-configs");
    const structure = makeStructure([
      makeTask("1", "T1"),
      makeTask("2", "T2"),
      makeTask("3", "T3"),
    ]);

    // Proactive solicitation type should exclude boilerplate
    const sections = buildSectionList(structure, "Proactive");
    const types = sections.map((s) => s.type);
    expect(types).not.toContain("cover_letter");
    expect(types).not.toContain("compliance_matrix_section");
    expect(types).toContain("rfp_task");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// buildTaskSectionL1Context
// ════════════════════════════════════════════════════════════════════════════

describe("buildTaskSectionL1Context", () => {
  it("returns a non-empty string when L1 context has data", async () => {
    const { buildTaskSectionL1Context } = await import("../context");
    const l1 = {
      companyContext: [
        {
          id: "1",
          category: "brand" as const,
          key: "name",
          title: "Brand Name",
          content: "TestCorp provides enterprise solutions",
          is_locked: true,
        },
      ],
      productContexts: [
        {
          id: "2",
          product_name: "TestProduct",
          service_line: "IT",
          description: "A test product",
          capabilities: [],
          specifications: {},
          pricing_models: [],
          constraints: {},
          supported_outcomes: [],
          is_locked: true,
        },
      ],
      evidenceLibrary: [
        {
          id: "3",
          evidence_type: "case_study" as const,
          title: "Case Study A",
          summary: "Delivered success",
          full_content: "Full details here",
          is_verified: true,
          outcomes_demonstrated: [],
          metrics: [],
        },
      ],
      teamMembers: [
        {
          id: "4",
          name: "John Doe",
          role: "Lead Engineer",
          skills: ["TypeScript"],
          certifications: ["AWS"],
          project_history: [],
          is_verified: true,
        },
      ],
    };

    const result = buildTaskSectionL1Context(l1);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain("TestCorp");
  });

  it("returns empty string when L1 context is empty", async () => {
    const { buildTaskSectionL1Context } = await import("../context");
    const l1 = {
      companyContext: [],
      productContexts: [],
      evidenceLibrary: [],
      teamMembers: [],
    };

    const result = buildTaskSectionL1Context(l1);
    expect(result).toBe("");
  });

  it("truncates context to ~4K tokens when exceeding budget", async () => {
    const { buildTaskSectionL1Context } = await import("../context");

    // Create a very large L1 context
    const largeEvidence = Array.from({ length: 50 }, (_, i) => ({
      id: String(i),
      evidence_type: "case_study" as const,
      title: `Case Study ${i}`,
      summary: "A".repeat(500),
      full_content: "B".repeat(1000),
      is_verified: true,
      outcomes_demonstrated: [],
      metrics: [],
    }));

    const l1 = {
      companyContext: [],
      productContexts: [],
      evidenceLibrary: largeEvidence,
      teamMembers: [],
    };

    const result = buildTaskSectionL1Context(l1);
    // ~4K tokens ≈ ~16K chars. Allow some overhead for headers.
    expect(result.length).toBeLessThan(20_000);
  });

  it("includes all L1 context types (company, products, evidence, team)", async () => {
    const { buildTaskSectionL1Context } = await import("../context");
    const l1 = {
      companyContext: [
        {
          id: "1",
          category: "brand" as const,
          key: "name",
          title: "CompanyName",
          content: "We are CompanyName",
          is_locked: true,
        },
      ],
      productContexts: [
        {
          id: "2",
          product_name: "UniqueProduct",
          service_line: "IT",
          description: "Product desc",
          capabilities: [],
          specifications: {},
          pricing_models: [],
          constraints: {},
          supported_outcomes: [],
          is_locked: true,
        },
      ],
      evidenceLibrary: [
        {
          id: "3",
          evidence_type: "case_study" as const,
          title: "UniqueEvidence",
          summary: "Evidence summary",
          full_content: "Full evidence",
          is_verified: true,
          outcomes_demonstrated: [],
          metrics: [],
        },
      ],
      teamMembers: [
        {
          id: "4",
          name: "UniqueTeamMember",
          role: "Architect",
          skills: [],
          certifications: [],
          project_history: [],
          is_verified: true,
        },
      ],
    };

    const result = buildTaskSectionL1Context(l1);
    expect(result).toContain("CompanyName");
    expect(result).toContain("UniqueProduct");
    expect(result).toContain("UniqueEvidence");
    expect(result).toContain("UniqueTeamMember");
  });
});
