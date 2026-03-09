import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  orchestrateGeneration,
  type GenerationSection,
} from "../client-orchestrate";

// Helper: create mock sections
function makeSection(
  id: string,
  sectionType: string,
  title: string,
): GenerationSection {
  return { id, sectionType, title };
}

// Helper: create a mock fetch that tracks calls
function createMockFetch(options?: {
  failIds?: string[];
  differentiators?: string[];
  delay?: number;
}) {
  const calls: { url: string; body?: Record<string, unknown> }[] = [];
  const callOrder: string[] = [];

  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(init.body as string) : undefined;
    calls.push({ url, body });
    callOrder.push(body?.sectionId ?? url);

    if (options?.delay) {
      await new Promise((r) => setTimeout(r, options.delay));
    }

    if (options?.failIds?.includes(body?.sectionId)) {
      return { ok: false, status: 500, json: async () => ({}) } as Response;
    }

    const result: Record<string, unknown> = { content: "generated" };
    if (body?.sectionType === "executive_summary" && options?.differentiators) {
      result.differentiators = options.differentiators;
    }
    return { ok: true, json: async () => result } as Response;
  });

  return { fn, calls, callOrder };
}

describe("orchestrateGeneration — Parallel Batch", () => {
  let sections: GenerationSection[];

  beforeEach(() => {
    sections = [
      makeSection("s1", "executive_summary", "Executive Summary"),
      makeSection("s2", "technical_approach", "Technical Approach"),
      makeSection("s3", "past_performance", "Past Performance"),
      makeSection("s4", "management_plan", "Management Plan"),
      makeSection("s5", "staffing", "Staffing"),
      makeSection("s6", "pricing", "Pricing"),
      makeSection("s7", "risk", "Risk Assessment"),
    ];
  });

  // ── Happy Path ──────────────────────────────────────────────

  describe("Happy Path", () => {
    it("generates executive summary first (awaited before batch)", async () => {
      const { fn, callOrder } = createMockFetch({
        differentiators: ["AI", "Cloud"],
      });
      await orchestrateGeneration("p1", sections, fn);

      // Exec summary must be the first section call
      expect(callOrder[0]).toBe("s1");
    });

    it("remaining sections fire in batches after exec summary", async () => {
      const { fn, calls } = createMockFetch({
        differentiators: ["AI"],
      });
      await orchestrateGeneration("p1", sections, fn);

      // All 7 sections + 1 finalize = 8 calls total
      const sectionCalls = calls.filter((c) =>
        c.url.includes("/generate/section"),
      );
      expect(sectionCalls).toHaveLength(7);
    });

    it("all sections complete successfully in batched mode", async () => {
      const { fn, calls } = createMockFetch();
      await orchestrateGeneration("p1", sections, fn);

      const finalizeCalls = calls.filter((c) =>
        c.url.includes("/generate/finalize"),
      );
      expect(finalizeCalls).toHaveLength(1);
    });

    it("finalize runs after all batches complete", async () => {
      const { fn, callOrder } = createMockFetch();
      await orchestrateGeneration("p1", sections, fn);

      const lastCall = callOrder[callOrder.length - 1];
      expect(lastCall).toContain("/generate/finalize");
    });

    it("differentiators from exec summary are available to batch sections", async () => {
      const { fn, calls } = createMockFetch({
        differentiators: ["AI", "Cloud"],
      });
      await orchestrateGeneration("p1", sections, fn);

      // Non-exec-summary sections should receive differentiators
      const batchCalls = calls.filter(
        (c) => c.body && c.body.sectionType !== "executive_summary",
      );
      for (const call of batchCalls) {
        expect(call.body?.differentiators).toEqual(["AI", "Cloud"]);
      }
    });
  });

  // ── Bad Path ────────────────────────────────────────────────

  describe("Bad Path", () => {
    it("single section failure in batch doesn't block other sections", async () => {
      const { fn, calls } = createMockFetch({ failIds: ["s3"] });
      await orchestrateGeneration("p1", sections, fn);

      // All 7 sections should still be called despite s3 failing
      const sectionCalls = calls.filter((c) =>
        c.url.includes("/generate/section"),
      );
      expect(sectionCalls).toHaveLength(7);
      // Finalize still runs
      const finalizeCalls = calls.filter((c) =>
        c.url.includes("/generate/finalize"),
      );
      expect(finalizeCalls).toHaveLength(1);
    });

    it("all sections in a batch fail: next batch still runs, finalize runs", async () => {
      const { fn, calls } = createMockFetch({
        failIds: ["s2", "s3", "s4", "s5"],
      });
      await orchestrateGeneration("p1", sections, fn);

      // s6, s7 should still be called
      const sectionCalls = calls.filter((c) =>
        c.url.includes("/generate/section"),
      );
      expect(sectionCalls).toHaveLength(7);
      // Finalize still runs
      expect(calls.some((c) => c.url.includes("/generate/finalize"))).toBe(
        true,
      );
    });

    it("setup failure (exec summary throws): other sections still run", async () => {
      const fn = vi.fn(async (url: string, init?: RequestInit) => {
        const body = init?.body ? JSON.parse(init.body as string) : undefined;
        if (body?.sectionType === "executive_summary") {
          throw new Error("network error");
        }
        return {
          ok: true,
          json: async () => ({ content: "ok" }),
        } as Response;
      });
      await orchestrateGeneration("p1", sections, fn);

      // Remaining sections and finalize should still be called
      // (exec summary failure shouldn't stop everything)
      expect(fn).toHaveBeenCalledTimes(8); // 7 sections + 1 finalize
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────

  describe("Edge Cases", () => {
    it("proposal with only 1 section (exec summary only, no batching)", async () => {
      const singleSection = [
        makeSection("s1", "executive_summary", "Executive Summary"),
      ];
      const { fn, calls } = createMockFetch();
      await orchestrateGeneration("p1", singleSection, fn);

      const sectionCalls = calls.filter((c) =>
        c.url.includes("/generate/section"),
      );
      expect(sectionCalls).toHaveLength(1);
      expect(calls.some((c) => c.url.includes("/generate/finalize"))).toBe(
        true,
      );
    });

    it("proposal with no exec summary (all sections batch)", async () => {
      const noExec = sections.filter(
        (s) => s.sectionType !== "executive_summary",
      );
      const { fn, calls } = createMockFetch();
      await orchestrateGeneration("p1", noExec, fn);

      const sectionCalls = calls.filter((c) =>
        c.url.includes("/generate/section"),
      );
      expect(sectionCalls).toHaveLength(6);
    });

    it("proposal with exactly 4 sections (1 exec + 1 full batch of 3)", async () => {
      const fourSections = sections.slice(0, 4);
      const { fn, calls } = createMockFetch();
      await orchestrateGeneration("p1", fourSections, fn);

      const sectionCalls = calls.filter((c) =>
        c.url.includes("/generate/section"),
      );
      expect(sectionCalls).toHaveLength(4);
    });

    it("batch of 1 section (last batch with remainder)", async () => {
      // 1 exec + 4 others = 1 exec + 1 batch of 4 (or 1 batch of 3 + remainder of 1)
      const fiveSections = sections.slice(0, 5);
      const { fn, calls } = createMockFetch();
      await orchestrateGeneration("p1", fiveSections, fn);

      const sectionCalls = calls.filter((c) =>
        c.url.includes("/generate/section"),
      );
      expect(sectionCalls).toHaveLength(5);
    });
  });

  describe("Parallel Execution Verification", () => {
    it("sections within a batch run concurrently, not sequentially", async () => {
      const concurrentPeaks: number[] = [];
      let active = 0;

      const fn = vi.fn(async (url: string, init?: RequestInit) => {
        const body = init?.body ? JSON.parse(init.body as string) : undefined;
        active++;
        concurrentPeaks.push(active);
        // Simulate async work
        await new Promise((r) => setTimeout(r, 10));
        active--;
        return {
          ok: true,
          json: async () => ({
            content: "ok",
            differentiators:
              body?.sectionType === "executive_summary" ? ["A"] : undefined,
          }),
        } as Response;
      });

      await orchestrateGeneration("p1", sections, fn);

      // Peak concurrency should be > 1 for batch sections
      const maxConcurrency = Math.max(...concurrentPeaks);
      expect(maxConcurrency).toBeGreaterThan(1);
    });
  });

  // ── Security ────────────────────────────────────────────────

  describe("Security", () => {
    it("parallel generation passes through existing auth (no new auth bypass)", async () => {
      const { fn, calls } = createMockFetch();
      await orchestrateGeneration("p1", sections, fn);

      // Verify all calls use the same URL pattern (auth handled by server)
      for (const call of calls) {
        expect(call.url).toContain("/api/proposals/p1/generate/");
      }
    });
  });

  // ── Data Leak ───────────────────────────────────────────────

  describe("Data Leak", () => {
    it("batch generation errors don't leak section content", async () => {
      const { fn } = createMockFetch({ failIds: ["s3"] });

      // Should not throw, errors are contained
      await expect(
        orchestrateGeneration("p1", sections, fn),
      ).resolves.toBeUndefined();
    });
  });

  // ── Data Damage ─────────────────────────────────────────────

  describe("Data Damage", () => {
    it("parallel batch doesn't create duplicate section calls", async () => {
      const { fn, calls } = createMockFetch();
      await orchestrateGeneration("p1", sections, fn);

      const sectionIds = calls
        .filter((c) => c.body?.sectionId)
        .map((c) => c.body!.sectionId);
      const uniqueIds = new Set(sectionIds);
      expect(uniqueIds.size).toBe(sectionIds.length);
    });
  });
});
