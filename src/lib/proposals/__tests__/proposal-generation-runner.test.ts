import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { startProposalGenerationPoll } from "../proposal-generation-runner";

describe("startProposalGenerationPoll", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("polls until generation reaches a terminal complete state", async () => {
    const fetchFn = vi
      .fn<(url: string, options?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            proposal: { status: "generating" },
            sections: [{ id: "sec-1", generation_status: "generating" }],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
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

    const onSnapshot = vi.fn();
    const onTerminal = vi.fn();

    const handle = startProposalGenerationPoll({
      proposalId: "proposal-1",
      fetchFn,
      onSnapshot,
      onTerminal,
    });

    await vi.runAllTimersAsync();
    await handle.promise;

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(onSnapshot).toHaveBeenCalledTimes(2);
    expect(onTerminal).toHaveBeenCalledWith(
      expect.objectContaining({
        proposal: { status: "review" },
      }),
      expect.objectContaining({
        phase: "complete",
        completedCount: 1,
        failedCount: 0,
        totalCount: 1,
      }),
    );
  });

  it("retries after empty snapshots or fetch errors", async () => {
    const fetchFn = vi
      .fn<(url: string, options?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            proposal: { status: "draft" },
            sections: [{ id: "sec-1", generation_status: "failed" }],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    const onError = vi.fn();
    const onTerminal = vi.fn();

    const handle = startProposalGenerationPoll({
      proposalId: "proposal-1",
      fetchFn,
      onError,
      onTerminal,
    });

    await vi.runAllTimersAsync();
    await handle.promise;

    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onTerminal).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ phase: "failed" }),
    );
  });

  it("triggers the timeout callback before the next fetch when the poll window expires", async () => {
    let now = 0;
    const fetchFn = vi
      .fn<(url: string, options?: RequestInit) => Promise<Response>>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            proposal: { status: "generating" },
            sections: [{ id: "sec-1", generation_status: "generating" }],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    const onTimeout = vi.fn();

    const handle = startProposalGenerationPoll({
      proposalId: "proposal-1",
      fetchFn,
      now: () => now,
      startedAt: 0,
      timeoutMs: 1000,
      onTimeout,
    });

    await Promise.resolve();
    await Promise.resolve();
    now = 1001;
    await vi.runAllTimersAsync();
    await handle.promise;

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("stops polling immediately when cancelled", async () => {
    const fetchFn = vi
      .fn<(url: string, options?: RequestInit) => Promise<Response>>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            proposal: { status: "generating" },
            sections: [{ id: "sec-1", generation_status: "generating" }],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    const onTerminal = vi.fn();

    const handle = startProposalGenerationPoll({
      proposalId: "proposal-1",
      fetchFn,
      onTerminal,
    });

    await Promise.resolve();
    handle.cancel();
    await vi.runAllTimersAsync();
    await handle.promise;

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(onTerminal).not.toHaveBeenCalled();
    expect(handle.isCancelled()).toBe(true);
  });
});
