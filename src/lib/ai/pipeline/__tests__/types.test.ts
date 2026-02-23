import { describe, it, expect } from "vitest";

// ════════════════════════════════════════════════════════════════════════════
// RFP Task Structure Types — Phase 0
// ════════════════════════════════════════════════════════════════════════════

describe("RfpTask types", () => {
  // Happy Path
  it("accepts valid task with all fields", async () => {
    const { isValidRfpTask } = await import("../types");
    const task = {
      task_number: "1",
      title: "Help Desk Services",
      description: "Provide Tier 1-3 help desk support for agency staff.",
      category: "support-operations" as const,
      parent_task_number: null,
    };
    expect(isValidRfpTask(task)).toBe(true);
  });

  it("accepts valid structure with tasks array and extracted_at", async () => {
    const { isValidRfpTaskStructure } = await import("../types");
    const structure = {
      tasks: [
        {
          task_number: "1",
          title: "Help Desk Services",
          description: "Provide help desk support.",
          category: "support-operations" as const,
          parent_task_number: null,
        },
      ],
      extracted_at: "2026-02-22T12:00:00Z",
    };
    expect(isValidRfpTaskStructure(structure)).toBe(true);
  });

  it("validates all 10 task categories", async () => {
    const { TASK_CATEGORIES } = await import("../types");
    expect(TASK_CATEGORIES).toHaveLength(10);
    expect(TASK_CATEGORIES).toContain("technical");
    expect(TASK_CATEGORIES).toContain("staffing");
    expect(TASK_CATEGORIES).toContain("management");
    expect(TASK_CATEGORIES).toContain("support-operations");
    expect(TASK_CATEGORIES).toContain("compliance-security");
    expect(TASK_CATEGORIES).toContain("transition-onboarding");
    expect(TASK_CATEGORIES).toContain("training");
    expect(TASK_CATEGORIES).toContain("reporting-analytics");
    expect(TASK_CATEGORIES).toContain("quality-assurance");
    expect(TASK_CATEGORIES).toContain("infrastructure");
  });

  it("exports types from pipeline types module", async () => {
    const mod = await import("../types");
    expect(mod.isValidRfpTask).toBeDefined();
    expect(mod.isValidRfpTaskStructure).toBeDefined();
    expect(mod.TASK_CATEGORIES).toBeDefined();
  });

  // Bad Path
  it("rejects task with missing required fields", async () => {
    const { isValidRfpTask } = await import("../types");
    // Missing title
    expect(
      isValidRfpTask({
        task_number: "1",
        description: "desc",
        category: "technical",
        parent_task_number: null,
      }),
    ).toBe(false);

    // Missing task_number
    expect(
      isValidRfpTask({
        title: "Title",
        description: "desc",
        category: "technical",
        parent_task_number: null,
      }),
    ).toBe(false);

    // Missing description
    expect(
      isValidRfpTask({
        task_number: "1",
        title: "Title",
        category: "technical",
        parent_task_number: null,
      }),
    ).toBe(false);
  });

  it("rejects invalid category string", async () => {
    const { isValidRfpTask } = await import("../types");
    expect(
      isValidRfpTask({
        task_number: "1",
        title: "Title",
        description: "desc",
        category: "invalid-category",
        parent_task_number: null,
      }),
    ).toBe(false);
  });

  it("rejects task_number as number (must be string)", async () => {
    const { isValidRfpTask } = await import("../types");
    expect(
      isValidRfpTask({
        task_number: 1,
        title: "Title",
        description: "desc",
        category: "technical",
        parent_task_number: null,
      }),
    ).toBe(false);
  });

  // Edge Cases
  it("accepts null parent_task_number for top-level tasks", async () => {
    const { isValidRfpTask } = await import("../types");
    expect(
      isValidRfpTask({
        task_number: "1",
        title: "Top Level",
        description: "desc",
        category: "technical",
        parent_task_number: null,
      }),
    ).toBe(true);
  });

  it("accepts string parent_task_number for subtasks", async () => {
    const { isValidRfpTask } = await import("../types");
    expect(
      isValidRfpTask({
        task_number: "1.1",
        title: "Subtask",
        description: "desc",
        category: "technical",
        parent_task_number: "1",
      }),
    ).toBe(true);
  });

  it("accepts empty tasks array (no tasks detected)", async () => {
    const { isValidRfpTaskStructure } = await import("../types");
    expect(
      isValidRfpTaskStructure({
        tasks: [],
        extracted_at: "2026-02-22T12:00:00Z",
      }),
    ).toBe(true);
  });

  it("accepts 3-level deep task_number format", async () => {
    const { isValidRfpTask } = await import("../types");
    expect(
      isValidRfpTask({
        task_number: "2.3.1",
        title: "Deep Subtask",
        description: "desc",
        category: "management",
        parent_task_number: "2.3",
      }),
    ).toBe(true);
  });

  it("rejects structure with missing extracted_at", async () => {
    const { isValidRfpTaskStructure } = await import("../types");
    expect(
      isValidRfpTaskStructure({
        tasks: [],
      }),
    ).toBe(false);
  });

  it("rejects structure with invalid task in array", async () => {
    const { isValidRfpTaskStructure } = await import("../types");
    expect(
      isValidRfpTaskStructure({
        tasks: [{ task_number: 123 }], // invalid task
        extracted_at: "2026-02-22T12:00:00Z",
      }),
    ).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// IDD types re-export
// ════════════════════════════════════════════════════════════════════════════

describe("idd.ts re-exports task structure types", () => {
  it("exports RfpTaskStructure, RfpTask, TaskCategory types from idd.ts", async () => {
    const mod = await import("@/types/idd");
    // These are type-only exports — we verify the runtime validators are also re-exported
    expect(mod.TASK_CATEGORIES).toBeDefined();
    expect(mod.isValidRfpTask).toBeDefined();
    expect(mod.isValidRfpTaskStructure).toBeDefined();
  });
});
