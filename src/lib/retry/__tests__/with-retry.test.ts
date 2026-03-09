import { describe, it, expect, vi } from "vitest";
import { withRetry, RetryableError, isRetryableError } from "../with-retry";

/** Shared options for tests that don't care about timing — use 1ms delays */
const FAST = { baseDelay: 1, backoffFactor: 1 } as const;

describe("withRetry", () => {
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

      const result = await withRetry(fn, FAST);

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

      const result = await withRetry(fn, { ...FAST, maxRetries: 4 });

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

      await withRetry(fn, { ...FAST, maxRetries: 3, onRetry });

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

      await expect(withRetry(fn, FAST)).rejects.toThrow("fail3");
      expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it("thrown error includes attempts metadata property", async () => {
      const fn = vi
        .fn()
        .mockRejectedValue(new RetryableError("always fails"));

      try {
        await withRetry(fn, FAST);
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toHaveProperty("attempts", 3);
      }
    });

    it("thrown error includes retryable flag", async () => {
      const fn = vi.fn().mockRejectedValue(new RetryableError("transient"));

      try {
        await withRetry(fn, FAST);
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

      try {
        await withRetry(fn, FAST);
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

      await expect(withRetry(fn, FAST)).rejects.toThrow("sync throw");
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
      // This test uses fake timers to verify precise timing
      vi.useFakeTimers();

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

      vi.useRealTimers();
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

      const [r1, r2] = await Promise.all([
        withRetry(fn1, FAST),
        withRetry(fn2, FAST),
      ]);
      expect(r1).toBe("a-ok");
      expect(r2).toBe("b-ok");
    });
  });

  // ── Security ────────────────────────────────────────────────

  describe("Security", () => {
    it("does not expose internal stack traces in error metadata", async () => {
      const fn = vi.fn().mockRejectedValue(new RetryableError("timeout"));

      try {
        await withRetry(fn, FAST);
        expect.fail("should have thrown");
      } catch (err) {
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

      const result = await withRetry(fn, { ...FAST, onRetry });

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

      try {
        await withRetry(fn, { maxRetries: 0 });
        expect.fail("should have thrown");
      } catch (err) {
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

      // Wait a bit to ensure no delayed retries fire
      await new Promise((r) => setTimeout(r, 50));
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("retries are sequential, not overlapping", async () => {
      const callOrder: string[] = [];

      const fn = vi.fn().mockImplementation(async () => {
        callOrder.push("start");
        callOrder.push("end");
        throw new RetryableError("fail");
      });

      try {
        await withRetry(fn, { ...FAST, maxRetries: 1 });
      } catch {
        // expected
      }

      expect(callOrder).toEqual(["start", "end", "start", "end"]);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});

describe("withRetry shouldRetry option", () => {
  it("retries plain errors when shouldRetry returns true", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("AI timeout"))
      .mockResolvedValue("recovered");

    const result = await withRetry(fn, {
      ...FAST,
      shouldRetry: (err) => err.message.includes("timeout"),
    });

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
