import { describe, expect, it, vi } from "vitest";

import {
  fetchProposalGenerationSnapshot,
  summarizeProposalGeneration,
} from "../proposal-generation-status";

describe("summarizeProposalGeneration", () => {
  it("reports generating while sections are still in progress", () => {
    const summary = summarizeProposalGeneration({
      proposal: { status: "generating" },
      sections: [
        { generation_status: "completed" },
        { generation_status: "generating" },
      ],
    });

    expect(summary).toMatchObject({
      phase: "generating",
      completedCount: 1,
      failedCount: 0,
      totalCount: 2,
    });
  });

  it("reports complete when at least one section succeeded and all sections are terminal", () => {
    const summary = summarizeProposalGeneration({
      proposal: { status: "review" },
      sections: [
        { generation_status: "completed" },
        { generation_status: "failed" },
      ],
    });

    expect(summary).toMatchObject({
      phase: "complete",
      completedCount: 1,
      failedCount: 1,
      totalCount: 2,
    });
  });

  it("reports failed when every section has failed", () => {
    const summary = summarizeProposalGeneration({
      proposal: { status: "draft" },
      sections: [
        { generation_status: "failed" },
        { generation_status: "failed" },
      ],
    });

    expect(summary).toMatchObject({
      phase: "failed",
      completedCount: 0,
      failedCount: 2,
      totalCount: 2,
    });
  });

  it("stays generating when no sections exist yet", () => {
    const summary = summarizeProposalGeneration({
      proposal: { status: "review" },
      sections: [],
    });

    expect(summary.phase).toBe("generating");
    expect(summary.totalCount).toBe(0);
  });
});

describe("fetchProposalGenerationSnapshot", () => {
  it("returns null for non-OK responses", async () => {
    const fetchFn = vi.fn<
      (url: string, options?: RequestInit) => Promise<Response>
    >().mockResolvedValue(new Response("nope", { status: 503 }));

    await expect(
      fetchProposalGenerationSnapshot("proposal-1", fetchFn),
    ).resolves.toBeNull();
  });

  it("returns parsed proposal snapshot data", async () => {
    const fetchFn = vi.fn<
      (url: string, options?: RequestInit) => Promise<Response>
    >().mockResolvedValue(
      new Response(
        JSON.stringify({
          proposal: { status: "review" },
          sections: [{ id: "sec-1", generation_status: "completed" }],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(
      fetchProposalGenerationSnapshot("proposal-1", fetchFn),
    ).resolves.toEqual({
      proposal: { status: "review" },
      sections: [{ id: "sec-1", generation_status: "completed" }],
    });
  });
});
