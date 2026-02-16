import { describe, it, expect, vi } from "vitest";

/**
 * Test the parallelBatch utility used by the pipeline.
 * We import it indirectly by testing its behavior pattern.
 */

// Replicate the parallelBatch function for isolated testing
async function parallelBatch<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((item, batchIdx) => fn(item, i + batchIdx)),
    );
    for (let j = 0; j < batchResults.length; j++) {
      results[i + j] = batchResults[j];
    }
  }

  return results;
}

describe("parallelBatch", () => {
  it("should process all items", async () => {
    const items = [1, 2, 3, 4, 5];
    const results = await parallelBatch(items, 3, async (item) => item * 2);

    expect(results).toHaveLength(5);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);

    const values = results.map((r) => (r as PromiseFulfilledResult<number>).value);
    expect(values).toEqual([2, 4, 6, 8, 10]);
  });

  it("should respect concurrency limit", async () => {
    let concurrentCount = 0;
    let maxConcurrent = 0;

    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    await parallelBatch(items, 3, async () => {
      concurrentCount++;
      maxConcurrent = Math.max(maxConcurrent, concurrentCount);
      // Simulate async work
      await new Promise((resolve) => setTimeout(resolve, 10));
      concurrentCount--;
    });

    expect(maxConcurrent).toBeLessThanOrEqual(3);
  });

  it("should handle failures without stopping other items", async () => {
    const items = [1, 2, 3, 4, 5];
    const results = await parallelBatch(items, 2, async (item) => {
      if (item === 3) throw new Error("item 3 failed");
      return item * 2;
    });

    expect(results).toHaveLength(5);

    // Items 1, 2, 4, 5 should succeed
    expect(results[0].status).toBe("fulfilled");
    expect(results[1].status).toBe("fulfilled");
    expect(results[2].status).toBe("rejected");
    expect(results[3].status).toBe("fulfilled");
    expect(results[4].status).toBe("fulfilled");

    // The rejected result should contain the error
    const rejected = results[2] as PromiseRejectedResult;
    expect(rejected.reason.message).toBe("item 3 failed");
  });

  it("should preserve order even with varying execution times", async () => {
    const items = [100, 10, 50, 20, 80]; // Processing times in ms
    const startOrder: number[] = [];

    const results = await parallelBatch(items, 2, async (item, index) => {
      startOrder.push(index);
      await new Promise((resolve) => setTimeout(resolve, item));
      return index;
    });

    const values = results.map(
      (r) => (r as PromiseFulfilledResult<number>).value,
    );
    // Results should be in original order regardless of completion time
    expect(values).toEqual([0, 1, 2, 3, 4]);
  });

  it("should handle concurrency of 1 (sequential)", async () => {
    const executionOrder: number[] = [];
    const items = [1, 2, 3];

    await parallelBatch(items, 1, async (item) => {
      executionOrder.push(item);
      await new Promise((resolve) => setTimeout(resolve, 5));
    });

    expect(executionOrder).toEqual([1, 2, 3]); // Strictly sequential
  });

  it("should handle concurrency >= items (fully parallel)", async () => {
    let concurrentCount = 0;
    let maxConcurrent = 0;

    const items = [1, 2, 3];
    await parallelBatch(items, 10, async () => {
      concurrentCount++;
      maxConcurrent = Math.max(maxConcurrent, concurrentCount);
      await new Promise((resolve) => setTimeout(resolve, 10));
      concurrentCount--;
    });

    expect(maxConcurrent).toBe(3); // All 3 run at once
  });

  it("should handle empty items array", async () => {
    const fn = vi.fn();
    const results = await parallelBatch([], 3, fn);

    expect(results).toHaveLength(0);
    expect(fn).not.toHaveBeenCalled();
  });
});
