import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withRetry, RetryableError, isRetryableError } from "../with-retry";

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    // Drain all pending timers to avoid unhandled rejection warnings
    await vi.runAllTimersAsync().catch(() => {});
    vi.useRealTimers();
  });

  // ── Happy Path ──────────────────────────────────────────────

  describe("Happy Path", () => {
    it("executes function once when it succeeds on first attempt", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const result = await withRetry(fn);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("returns the successful result value", async () => {
      const data = { id: 1, name: "test" };
      const fn = vi.fn().mockResolvedValue(data);
      const result = await withRetry(fn);

      expect(result).toEqual(data);
    });

    it("retries on failure and returns result when second attempt succeeds", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new RetryableError("transient"))
        .mockResolvedValue("recovered");

      const promise = withRetry(fn);
      await vi.advanceTimersByTimeAsync(2000);
      const result = await promise;

      expect(result).toBe("recovered");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("respects custom maxRetries option", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new RetryableError("fail1"))
        .mockRejectedValueOnce(new RetryableError("fail2"))
        .mockRejectedValueOnce(new RetryableError("fail3"))
        .mockResolvedValue("finally");

      const promise = withRetry(fn, { maxRetries: 4 });
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);
      await vi.advanceTimersByTimeAsync(8000);
      const result = await promise;

      expect(result).toBe("finally");
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it("calls onRetry callback with attempt number and error on each retry", async () => {
      const onRetry = vi.fn();
      const error1 = new RetryableError("fail1");
      const error2 = new RetryableError("fail2");
      const fn = vi
        .fn()
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2)
        .mockResolvedValue("ok");

      const promise = withRetry(fn, { maxRetries: 3, onRetry });
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);
      await promise;

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(1, error1);
      expect(onRetry).toHaveBeenCalledWith(2, error2);
    });
  });

  // ── Bad Path ────────────────────────────────────────────────

  describe("Bad Path", () => {
    it("throws last error after exhausting all retries (2x default)", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new RetryableError("fail1"))
        .mockRejectedValueOnce(new RetryableError("fail2"))
        .mockRejectedValueOnce(new RetryableError("fail3"));

      const promise = withRetry(fn);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      await expect(promise).rejects.toThrow("fail3");
      expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it("thrown error includes attempts metadata property", async () => {
      const fn = vi.fn().mockRejectedValue(new RetryableError("always fails"));

      const promise = withRetry(fn);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      try {
        await promise;
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toHaveProperty("attempts", 3);
      }
    });

    it("thrown error includes retryable flag", async () => {
      const fn = vi.fn().mockRejectedValue(new RetryableError("transient"));

      const promise = withRetry(fn);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      try {
        await promise;
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toHaveProperty("retryable", true);
      }
    });

    it("does NOT retry non-retryable errors", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("validation error"));

      await expect(withRetry(fn)).rejects.toThrow("validation error");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("does NOT retry when maxRetries is 0", async () => {
      const fn = vi.fn().mockRejectedValue(new RetryableError("fail"));

      await expect(withRetry(fn, { maxRetries: 0 })).rejects.toThrow("fail");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("error response includes structured diagnostic format", async () => {
      const fn = vi
        .fn()
        .mockRejectedValue(new RetryableError("AI service timeout"));

      const promise = withRetry(fn);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      try {
        await promise;
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toHaveProperty("attempts");
        expect(err).toHaveProperty("retryable");
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toBe("AI service timeout");
      }
    });

    it("throws immediately for invalid RetryOptions", async () => {
      const fn = vi.fn().mockResolvedValue("ok");
      await expect(withRetry(fn, { maxRetries: -1 })).rejects.toThrow(
        "maxRetries must be >= 0",
      );
      await expect(withRetry(fn, { baseDelay: 0 })).rejects.toThrow(
        "baseDelay must be > 0",
      );
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────

  describe("Edge Cases", () => {
    it("handles async functions that reject vs throw", async () => {
      const fn = vi.fn().mockImplementation(() => {
        throw new RetryableError("sync throw");
      });

      const promise = withRetry(fn);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      await expect(promise).rejects.toThrow("sync throw");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("handles functions that return undefined on success", async () => {
      const fn = vi.fn().mockResolvedValue(undefined);
      const result = await withRetry(fn);

      expect(result).toBeUndefined();
    });

    it("handles functions that return null on success", async () => {
      const fn = vi.fn().mockResolvedValue(null);
      const result = await withRetry(fn);

      expect(result).toBeNull();
    });

    it("backoff timing doubles per attempt", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new RetryableError("fail1"))
        .mockRejectedValueOnce(new RetryableError("fail2"))
        .mockResolvedValue("ok");

      const promise = withRetry(fn, { baseDelay: 1000, backoffFactor: 2 });

      // First retry after 1000ms
      await vi.advanceTimersByTimeAsync(999);
      expect(fn).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(fn).toHaveBeenCalledTimes(2);

      // Second retry after 2000ms (doubled)
      await vi.advanceTimersByTimeAsync(1999);
      expect(fn).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);

      await promise;
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("concurrent retries don't interfere", async () => {
      let callCount = 0;
      const fn1 = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 1) return Promise.reject(new RetryableError("a"));
        return Promise.resolve("a-ok");
      });

      let callCount2 = 0;
      const fn2 = vi.fn().mockImplementation(() => {
        callCount2++;
        if (callCount2 <= 1) return Promise.reject(new RetryableError("b"));
        return Promise.resolve("b-ok");
      });

      const p1 = withRetry(fn1);
      const p2 = withRetry(fn2);

      await vi.advanceTimersByTimeAsync(2000);

      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1).toBe("a-ok");
      expect(r2).toBe("b-ok");
    });
  });

  // ── Security ────────────────────────────────────────────────

  describe("Security", () => {
    it("does not expose internal stack traces in error metadata", async () => {
      const fn = vi.fn().mockRejectedValue(new RetryableError("timeout"));

      const promise = withRetry(fn);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      try {
        await promise;
        expect.fail("should have thrown");
      } catch (err) {
        // The error has message and attempts, but the consumer
        // should sanitize before sending to client
        expect(err).toHaveProperty("attempts");
        expect(err).not.toHaveProperty("internalStack");
      }
    });

    it("onRetry callback errors don't break the retry loop", async () => {
      const onRetry = vi.fn().mockImplementation(() => {
        throw new Error("callback crashed");
      });
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new RetryableError("fail"))
        .mockResolvedValue("ok");

      const promise = withRetry(fn, { onRetry });
      await vi.advanceTimersByTimeAsync(2000);
      const result = await promise;

      expect(result).toBe("ok");
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  // ── Data Leak ───────────────────────────────────────────────

  describe("Data Leak", () => {
    it("final error does not carry arbitrary properties from original error", async () => {
      const providerError = new RetryableError("model overloaded");
      (providerError as Record<string, unknown>).apiKey = "sk-secret";

      const fn = vi.fn().mockRejectedValue(providerError);
      const promise = withRetry(fn, { maxRetries: 0 });

      try {
        await promise;
        expect.fail("should have thrown");
      } catch (err) {
        // withRetry wraps in a new RetryableError, so apiKey should not be present
        expect(err).toHaveProperty("message", "model overloaded");
        expect(err).toHaveProperty("attempts");
        expect(err).toHaveProperty("retryable");
        expect(err).not.toHaveProperty("apiKey");
      }
    });
  });

  // ── Data Damage ─────────────────────────────────────────────

  describe("Data Damage", () => {
    it("does not call fn again after successful attempt", async () => {
      const fn = vi.fn().mockResolvedValue("done");
      await withRetry(fn);

      // Advance time to ensure no delayed retries fire
      await vi.advanceTimersByTimeAsync(10000);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("retries are sequential, not overlapping", async () => {
      const callOrder: string[] = [];

      const fn = vi.fn().mockImplementation(async () => {
        callOrder.push("start");
        callOrder.push("end");
        throw new RetryableError("fail");
      });

      const promise = withRetry(fn, { maxRetries: 1 });
      await vi.advanceTimersByTimeAsync(2000);

      try {
        await promise;
      } catch {
        // expected
      }

      // Each call fully completes before next starts
      expect(callOrder).toEqual(["start", "end", "start", "end"]);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});

describe("withRetry shouldRetry option", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    await vi.runAllTimersAsync().catch(() => {});
    vi.useRealTimers();
  });

  it("retries plain errors when shouldRetry returns true", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("AI timeout"))
      .mockResolvedValue("recovered");

    const promise = withRetry(fn, {
      shouldRetry: (err) => err.message.includes("timeout"),
    });
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;

    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry when shouldRetry returns false", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("validation error"));

    await expect(withRetry(fn, { shouldRetry: () => false })).rejects.toThrow(
      "validation error",
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("shouldRetry overrides RetryableError check", async () => {
    const fn = vi.fn().mockRejectedValue(new RetryableError("retryable"));

    // shouldRetry says no even though it's a RetryableError
    await expect(withRetry(fn, { shouldRetry: () => false })).rejects.toThrow(
      "retryable",
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("RetryableError", () => {
  it("is identified by isRetryableError", () => {
    expect(isRetryableError(new RetryableError("test"))).toBe(true);
    expect(isRetryableError(new Error("test"))).toBe(false);
    expect(isRetryableError(null)).toBe(false);
  });
});
