import { describe, it, expect } from "vitest";

// ════════════════════════════════════════════════════════════════════════════
// buildTaskResponsePrompt — Phase 3
// ════════════════════════════════════════════════════════════════════════════

describe("buildTaskResponsePrompt — Happy Path", () => {
  it("includes RFP task number and title in prompt", async () => {
    const { buildTaskResponsePrompt } = await import(
      "../prompts/task-response"
    );
    const prompt = buildTaskResponsePrompt({
      taskNumber: "1.1",
      taskTitle: "Tier 1 Support",
      taskDescription: "Handle initial user contacts.",
      intakeData: { client_industry: "government" },
      analysis: "Strategic analysis here",
      l1Context: "Company context here",
    });

    expect(prompt).toContain("1.1");
    expect(prompt).toContain("Tier 1 Support");
  });

  it("includes task description verbatim as requirements", async () => {
    const { buildTaskResponsePrompt } = await import(
      "../prompts/task-response"
    );
    const desc = "Handle initial user contacts via phone, email, and chat.";
    const prompt = buildTaskResponsePrompt({
      taskNumber: "1",
      taskTitle: "Support",
      taskDescription: desc,
      intakeData: {},
      analysis: "",
      l1Context: "",
    });

    expect(prompt).toContain(desc);
  });

  it("includes editorial standards block", async () => {
    const { buildTaskResponsePrompt } = await import(
      "../prompts/task-response"
    );
    const prompt = buildTaskResponsePrompt({
      taskNumber: "1",
      taskTitle: "T",
      taskDescription: "d",
      intakeData: {},
      analysis: "",
      l1Context: "",
    });

    // Editorial standards include FORMATTING_RULES and ANTI_FLUFF_RULES
    expect(prompt).toContain("OUTPUT FORMAT RULES");
    expect(prompt).toContain("WRITING QUALITY RULES");
  });

  it("includes anti-fabrication rules", async () => {
    const { buildTaskResponsePrompt } = await import(
      "../prompts/task-response"
    );
    const prompt = buildTaskResponsePrompt({
      taskNumber: "1",
      taskTitle: "T",
      taskDescription: "d",
      intakeData: {},
      analysis: "",
      l1Context: "",
    });

    // Anti-fabrication = no brackets + evidence requirement
    expect(prompt).toContain("NEVER USE BRACKETS");
    expect(prompt).toContain("EVIDENCE REQUIREMENT");
  });

  it("includes L1 context", async () => {
    const { buildTaskResponsePrompt } = await import(
      "../prompts/task-response"
    );
    const l1 = "=== COMPANY CONTEXT (L1 - Verified Truth) ===\nOur capabilities...";
    const prompt = buildTaskResponsePrompt({
      taskNumber: "1",
      taskTitle: "T",
      taskDescription: "d",
      intakeData: {},
      analysis: "",
      l1Context: l1,
    });

    expect(prompt).toContain("COMPANY CONTEXT");
    expect(prompt).toContain("Our capabilities");
  });

  it("includes win strategy when available", async () => {
    const { buildTaskResponsePrompt } = await import(
      "../prompts/task-response"
    );
    const prompt = buildTaskResponsePrompt({
      taskNumber: "1",
      taskTitle: "T",
      taskDescription: "d",
      intakeData: {},
      analysis: "",
      l1Context: "",
      winStrategy: {
        win_themes: ["Speed to value", "Cost reduction"],
        differentiators: ["47 federal migrations"],
      },
    });

    expect(prompt).toContain("Speed to value");
    expect(prompt).toContain("47 federal migrations");
  });

  it("includes company info", async () => {
    const { buildTaskResponsePrompt } = await import(
      "../prompts/task-response"
    );
    const prompt = buildTaskResponsePrompt({
      taskNumber: "1",
      taskTitle: "T",
      taskDescription: "d",
      intakeData: {},
      analysis: "",
      l1Context: "",
      companyInfo: { name: "AcmeCorp", description: "Enterprise IT" },
    });

    expect(prompt).toContain("AcmeCorp");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// buildTaskResponsePrompt — Bad Path
// ════════════════════════════════════════════════════════════════════════════

describe("buildTaskResponsePrompt — Bad Path", () => {
  it("produces valid prompt with empty description", async () => {
    const { buildTaskResponsePrompt } = await import(
      "../prompts/task-response"
    );
    const prompt = buildTaskResponsePrompt({
      taskNumber: "1",
      taskTitle: "Empty Task",
      taskDescription: "",
      intakeData: {},
      analysis: "",
      l1Context: "",
    });

    expect(prompt).toBeTruthy();
    expect(prompt).toContain("Empty Task");
    // Should still have editorial standards
    expect(prompt).toContain("OUTPUT FORMAT RULES");
  });

  it("omits win strategy section when null", async () => {
    const { buildTaskResponsePrompt } = await import(
      "../prompts/task-response"
    );
    const prompt = buildTaskResponsePrompt({
      taskNumber: "1",
      taskTitle: "T",
      taskDescription: "d",
      intakeData: {},
      analysis: "",
      l1Context: "",
      winStrategy: null,
    });

    // Should not contain win strategy content block (Win Strategy & Target Outcomes header)
    expect(prompt).not.toContain("Win Strategy & Target Outcomes");
  });

  it("handles null L1 context gracefully", async () => {
    const { buildTaskResponsePrompt } = await import(
      "../prompts/task-response"
    );
    const prompt = buildTaskResponsePrompt({
      taskNumber: "1",
      taskTitle: "T",
      taskDescription: "d",
      intakeData: {},
      analysis: "",
      l1Context: "",
    });

    expect(prompt).toBeTruthy();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// buildTaskResponsePrompt — Edge Cases
// ════════════════════════════════════════════════════════════════════════════

describe("buildTaskResponsePrompt — Edge Cases", () => {
  it("preserves markdown formatting in task description", async () => {
    const { buildTaskResponsePrompt } = await import(
      "../prompts/task-response"
    );
    const desc = "# Main Task\n- Item 1\n- Item 2\n\n**Bold requirement**";
    const prompt = buildTaskResponsePrompt({
      taskNumber: "1",
      taskTitle: "Markdown Task",
      taskDescription: desc,
      intakeData: {},
      analysis: "",
      l1Context: "",
    });

    expect(prompt).toContain("**Bold requirement**");
    expect(prompt).toContain("- Item 1");
  });

  it("truncates very long task descriptions (>2000 chars) but keeps number and title", async () => {
    const { buildTaskResponsePrompt } = await import(
      "../prompts/task-response"
    );
    const longDesc = "a".repeat(3000);
    const prompt = buildTaskResponsePrompt({
      taskNumber: "99",
      taskTitle: "Long Task",
      taskDescription: longDesc,
      intakeData: {},
      analysis: "",
      l1Context: "",
    });

    // Task number and title always present
    expect(prompt).toContain("99");
    expect(prompt).toContain("Long Task");
    // The full 3000-char description should NOT appear
    expect(prompt).not.toContain(longDesc);
  });

  it("includes differentiators in repetition limiter when provided", async () => {
    const { buildTaskResponsePrompt } = await import(
      "../prompts/task-response"
    );
    const prompt = buildTaskResponsePrompt({
      taskNumber: "1",
      taskTitle: "T",
      taskDescription: "d",
      intakeData: {},
      analysis: "",
      l1Context: "",
      differentiators: ["47 federal migrations", "99.9% uptime SLA"],
    });

    expect(prompt).toContain("47 federal migrations");
    expect(prompt).toContain("REPETITION LIMITER");
  });
});
