import { describe, expect, it, vi } from "vitest";

import { startBackgroundGeneration } from "../background-generation";

describe("startBackgroundGeneration", () => {
  it("starts orchestration after successful setup", async () => {
    const fetchFn = vi.fn<
      (url: string, options?: RequestInit) => Promise<Response>
    >().mockResolvedValue(
      new Response(
        JSON.stringify({
          sections: [
            {
              id: "sec-1",
              sectionType: "executive_summary",
              title: "Executive Summary",
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    const orchestrateFn = vi.fn().mockResolvedValue(undefined);

    const result = await startBackgroundGeneration(
      "proposal-1",
      fetchFn,
      orchestrateFn,
    );

    expect(fetchFn).toHaveBeenCalledWith(
      "/api/proposals/proposal-1/generate/setup",
      { method: "POST" },
    );
    expect(orchestrateFn).toHaveBeenCalledWith(
      "proposal-1",
      [
        {
          id: "sec-1",
          sectionType: "executive_summary",
          title: "Executive Summary",
        },
      ],
      fetchFn,
    );
    expect(result).toEqual({
      status: "started",
      sections: [
        {
          id: "sec-1",
          sectionType: "executive_summary",
          title: "Executive Summary",
        },
      ],
    });
  });

  it("returns already-generating without re-orchestrating on 409", async () => {
    const fetchFn = vi.fn<
      (url: string, options?: RequestInit) => Promise<Response>
    >().mockResolvedValue(
      new Response(JSON.stringify({ error: "Already generating" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const orchestrateFn = vi.fn().mockResolvedValue(undefined);

    const result = await startBackgroundGeneration(
      "proposal-1",
      fetchFn,
      orchestrateFn,
    );

    expect(orchestrateFn).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "already-generating", sections: [] });
  });

  it("throws the API error message for non-OK setup responses", async () => {
    const fetchFn = vi.fn<
      (url: string, options?: RequestInit) => Promise<Response>
    >().mockResolvedValue(
      new Response(JSON.stringify({ error: "Pipeline context missing" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      startBackgroundGeneration("proposal-1", fetchFn, vi.fn()),
    ).rejects.toThrow("Pipeline context missing");
  });

  it("throws when setup succeeds without any sections", async () => {
    const fetchFn = vi.fn<
      (url: string, options?: RequestInit) => Promise<Response>
    >().mockResolvedValue(
      new Response(JSON.stringify({ sections: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      startBackgroundGeneration("proposal-1", fetchFn, vi.fn()),
    ).rejects.toThrow("Generation setup returned no sections");
  });
});
