import { describe, it, expect } from "vitest";
import type { RfpTaskStructure } from "../pipeline/types";

// ════════════════════════════════════════════════════════════════════════════
// Task Structure Extraction — Phase 1
// ════════════════════════════════════════════════════════════════════════════

describe("buildExtractTaskStructurePrompt", () => {
  it("returns a non-empty prompt string", async () => {
    const { buildExtractTaskStructurePrompt } = await import(
      "../prompts/extract-task-structure"
    );
    const prompt = buildExtractTaskStructurePrompt("Some RFP text here.");
    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(100);
  });

  it("includes the document text in the prompt", async () => {
    const { buildExtractTaskStructurePrompt } = await import(
      "../prompts/extract-task-structure"
    );
    const rfpText = "Task 1: Help Desk Services\nProvide Tier 1-3 support.";
    const prompt = buildExtractTaskStructurePrompt(rfpText);
    expect(prompt).toContain(rfpText);
  });

  it("truncates very long documents", async () => {
    const { buildExtractTaskStructurePrompt } = await import(
      "../prompts/extract-task-structure"
    );
    const longText = "x".repeat(600_000);
    const prompt = buildExtractTaskStructurePrompt(longText);
    expect(prompt).toContain("[Document truncated");
    // Should not contain the full text
    expect(prompt.length).toBeLessThan(600_000);
  });

  it("includes all 10 valid categories in the prompt", async () => {
    const { buildExtractTaskStructurePrompt } = await import(
      "../prompts/extract-task-structure"
    );
    const { TASK_CATEGORIES } = await import("../pipeline/types");
    const prompt = buildExtractTaskStructurePrompt("sample text");
    for (const cat of TASK_CATEGORIES) {
      expect(prompt).toContain(cat);
    }
  });

  it("specifies JSON output format", async () => {
    const { buildExtractTaskStructurePrompt } = await import(
      "../prompts/extract-task-structure"
    );
    const prompt = buildExtractTaskStructurePrompt("sample text");
    expect(prompt.toLowerCase()).toContain("json");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// parseTaskStructureResponse — Happy Path
// ════════════════════════════════════════════════════════════════════════════

describe("parseTaskStructureResponse — Happy Path", () => {
  it("parses valid JSON with multiple tasks", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const response = JSON.stringify([
      {
        task_number: "1",
        title: "Help Desk Services",
        description: "Provide Tier 1-3 help desk support.",
        category: "support-operations",
        parent_task_number: null,
      },
      {
        task_number: "1.1",
        title: "Tier 1 Support",
        description: "Handle initial user contacts.",
        category: "support-operations",
        parent_task_number: "1",
      },
      {
        task_number: "2",
        title: "Network Operations",
        description: "Manage WAN/LAN infrastructure.",
        category: "infrastructure",
        parent_task_number: null,
      },
    ]);

    const result = parseTaskStructureResponse(response);
    expect(result.tasks).toHaveLength(3);
    expect(result.extracted_at).toBeTruthy();
    expect(result.tasks[0].task_number).toBe("1");
    expect(result.tasks[0].title).toBe("Help Desk Services");
    expect(result.tasks[1].parent_task_number).toBe("1");
    expect(result.tasks[2].category).toBe("infrastructure");
  });

  it("preserves exact task numbering from RFP", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const response = JSON.stringify([
      {
        task_number: "A",
        title: "Section A",
        description: "desc",
        category: "technical",
        parent_task_number: null,
      },
      {
        task_number: "A.i",
        title: "Subsection A.i",
        description: "desc",
        category: "technical",
        parent_task_number: "A",
      },
    ]);

    const result = parseTaskStructureResponse(response);
    expect(result.tasks[0].task_number).toBe("A");
    expect(result.tasks[1].task_number).toBe("A.i");
  });

  it("sets extracted_at to a valid ISO timestamp", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const response = JSON.stringify([
      {
        task_number: "1",
        title: "T",
        description: "d",
        category: "technical",
        parent_task_number: null,
      },
    ]);

    const result = parseTaskStructureResponse(response);
    expect(new Date(result.extracted_at).toISOString()).toBe(result.extracted_at);
  });

  it("handles code-fenced JSON response", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const tasks = [
      {
        task_number: "1",
        title: "T",
        description: "d",
        category: "technical",
        parent_task_number: null,
      },
    ];
    const response = "```json\n" + JSON.stringify(tasks) + "\n```";

    const result = parseTaskStructureResponse(response);
    expect(result.tasks).toHaveLength(1);
  });

  it("handles RFP with 20+ tasks", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const tasks = Array.from({ length: 25 }, (_, i) => ({
      task_number: String(i + 1),
      title: `Task ${i + 1}`,
      description: `Description for task ${i + 1}`,
      category: "technical",
      parent_task_number: null,
    }));

    const result = parseTaskStructureResponse(JSON.stringify(tasks));
    expect(result.tasks).toHaveLength(25);
  });

  it("handles 3-level nesting", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const response = JSON.stringify([
      {
        task_number: "2",
        title: "Parent",
        description: "d",
        category: "management",
        parent_task_number: null,
      },
      {
        task_number: "2.3",
        title: "Child",
        description: "d",
        category: "management",
        parent_task_number: "2",
      },
      {
        task_number: "2.3.1",
        title: "Grandchild",
        description: "d",
        category: "management",
        parent_task_number: "2.3",
      },
    ]);

    const result = parseTaskStructureResponse(response);
    expect(result.tasks).toHaveLength(3);
    expect(result.tasks[2].task_number).toBe("2.3.1");
    expect(result.tasks[2].parent_task_number).toBe("2.3");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// parseTaskStructureResponse — Bad Path
// ════════════════════════════════════════════════════════════════════════════

describe("parseTaskStructureResponse — Bad Path", () => {
  it("returns empty tasks array for empty string", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const result = parseTaskStructureResponse("");
    expect(result.tasks).toHaveLength(0);
    expect(result.extracted_at).toBeTruthy();
  });

  it("returns empty tasks for malformed JSON", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const result = parseTaskStructureResponse("not valid json {{{");
    expect(result.tasks).toHaveLength(0);
  });

  it("returns empty tasks for non-array JSON", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const result = parseTaskStructureResponse('{"tasks": []}');
    expect(result.tasks).toHaveLength(0);
  });

  it("skips tasks with missing required fields", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const response = JSON.stringify([
      // Valid
      {
        task_number: "1",
        title: "Valid",
        description: "d",
        category: "technical",
        parent_task_number: null,
      },
      // Missing title
      {
        task_number: "2",
        description: "d",
        category: "technical",
        parent_task_number: null,
      },
      // Missing task_number
      {
        title: "No Number",
        description: "d",
        category: "technical",
        parent_task_number: null,
      },
    ]);

    const result = parseTaskStructureResponse(response);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].title).toBe("Valid");
  });

  it("normalizes invalid category to 'technical'", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const response = JSON.stringify([
      {
        task_number: "1",
        title: "T",
        description: "d",
        category: "not-a-real-category",
        parent_task_number: null,
      },
    ]);

    const result = parseTaskStructureResponse(response);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].category).toBe("technical");
  });

  it("truncates very long descriptions to 2000 chars", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const longDesc = "a".repeat(3000);
    const response = JSON.stringify([
      {
        task_number: "1",
        title: "T",
        description: longDesc,
        category: "technical",
        parent_task_number: null,
      },
    ]);

    const result = parseTaskStructureResponse(response);
    expect(result.tasks[0].description.length).toBeLessThanOrEqual(2000);
  });

  it("deduplicates tasks with same task_number", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const response = JSON.stringify([
      {
        task_number: "1",
        title: "First",
        description: "d",
        category: "technical",
        parent_task_number: null,
      },
      {
        task_number: "1",
        title: "Duplicate",
        description: "d",
        category: "technical",
        parent_task_number: null,
      },
    ]);

    const result = parseTaskStructureResponse(response);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].title).toBe("First");
  });

  it("never throws — always returns a valid RfpTaskStructure", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );

    // Various bad inputs — none should throw
    const badInputs = [
      "",
      "null",
      "undefined",
      "42",
      "[]",
      "true",
      "[null, null]",
      '[{"garbage": true}]',
      "```\nnot json\n```",
    ];

    for (const input of badInputs) {
      const result = parseTaskStructureResponse(input);
      expect(result).toBeDefined();
      expect(Array.isArray(result.tasks)).toBe(true);
      expect(typeof result.extracted_at).toBe("string");
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// parseTaskStructureResponse — Edge Cases
// ════════════════════════════════════════════════════════════════════════════

describe("parseTaskStructureResponse — Edge Cases", () => {
  it("handles task_number as numeric string correctly", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const response = JSON.stringify([
      {
        task_number: "01",
        title: "Zero-prefixed",
        description: "d",
        category: "technical",
        parent_task_number: null,
      },
    ]);

    const result = parseTaskStructureResponse(response);
    expect(result.tasks[0].task_number).toBe("01");
  });

  it("handles non-standard numbering (A, B, C)", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const response = JSON.stringify([
      {
        task_number: "A",
        title: "Section A",
        description: "d",
        category: "technical",
        parent_task_number: null,
      },
      {
        task_number: "B",
        title: "Section B",
        description: "d",
        category: "management",
        parent_task_number: null,
      },
    ]);

    const result = parseTaskStructureResponse(response);
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].task_number).toBe("A");
  });

  it("handles tasks where parent_task_number is missing (treats as null)", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const response = JSON.stringify([
      {
        task_number: "1",
        title: "T",
        description: "d",
        category: "technical",
        // parent_task_number not included
      },
    ]);

    const result = parseTaskStructureResponse(response);
    expect(result.tasks[0].parent_task_number).toBeNull();
  });

  it("validates return type shape matches RfpTaskStructure", async () => {
    const { parseTaskStructureResponse } = await import(
      "../prompts/extract-task-structure"
    );
    const { isValidRfpTaskStructure } = await import("../pipeline/types");

    const response = JSON.stringify([
      {
        task_number: "1",
        title: "T",
        description: "d",
        category: "technical",
        parent_task_number: null,
      },
    ]);

    const result: RfpTaskStructure = parseTaskStructureResponse(response);
    expect(isValidRfpTaskStructure(result)).toBe(true);
  });
});
