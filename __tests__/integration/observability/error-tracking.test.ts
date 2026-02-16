import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Test error tracking without Sentry installed
describe("Error Tracking (no Sentry)", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.resetModules();
    // Ensure Sentry is not configured
    delete process.env.SENTRY_DSN;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("captureError", () => {
    it("should log error to console.error when Sentry is not configured", async () => {
      const { captureError } = await import("@/lib/observability/error-tracking");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await captureError(new Error("test failure"), {
        severity: "error",
        tags: { operation: "test" },
        context: { proposalId: "p-123" },
      });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.level).toBe("error");
      expect(output.message).toBe("test failure");
      expect(output.error_name).toBe("Error");
      expect(output.severity).toBe("error");
      expect(output.operation).toBe("test");
      expect(output.proposalId).toBe("p-123");
    });

    it("should handle string errors", async () => {
      const { captureError } = await import("@/lib/observability/error-tracking");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await captureError("something went wrong");

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.message).toBe("something went wrong");
    });

    it("should include user context when provided", async () => {
      const { captureError } = await import("@/lib/observability/error-tracking");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await captureError(new Error("auth failure"), {
        user: { id: "user-1", organizationId: "org-1" },
      });

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.userId).toBe("user-1");
      expect(output.organizationId).toBe("org-1");
    });
  });

  describe("captureMessage", () => {
    it("should log message to console.warn for info/warning severity", async () => {
      const { captureMessage } = await import("@/lib/observability/error-tracking");
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await captureMessage("approaching rate limit", "warning", {
        currentRate: 95,
        limit: 100,
      });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.level).toBe("warning");
      expect(output.message).toBe("approaching rate limit");
      expect(output.currentRate).toBe(95);
    });

    it("should log to console.error for error/fatal severity", async () => {
      const { captureMessage } = await import("@/lib/observability/error-tracking");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await captureMessage("system is down", "fatal");

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.level).toBe("fatal");
    });
  });

  describe("withErrorTracking", () => {
    it("should pass through successful results", async () => {
      const { withErrorTracking } = await import("@/lib/observability/error-tracking");

      const fn = async (x: number) => x * 2;
      const wrapped = withErrorTracking(fn as (...args: unknown[]) => Promise<unknown>, {
        operation: "multiply",
      });

      const result = await wrapped(5);
      expect(result).toBe(10);
    });

    it("should capture and re-throw errors", async () => {
      const { withErrorTracking } = await import("@/lib/observability/error-tracking");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const fn = async () => {
        throw new Error("wrapped failure");
      };
      const wrapped = withErrorTracking(fn as (...args: unknown[]) => Promise<unknown>, {
        operation: "failing-op",
      });

      await expect(wrapped()).rejects.toThrow("wrapped failure");
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("setUser / clearUser (no-op without Sentry)", () => {
    it("should not throw without Sentry", async () => {
      const { setUser, clearUser } = await import("@/lib/observability/error-tracking");

      // These should be no-ops without Sentry
      await expect(setUser({ id: "user-1", organizationId: "org-1" })).resolves.not.toThrow();
      await expect(clearUser()).resolves.not.toThrow();
    });
  });

  describe("addBreadcrumb (no-op without Sentry)", () => {
    it("should not throw without Sentry", async () => {
      const { addBreadcrumb } = await import("@/lib/observability/error-tracking");

      await expect(
        addBreadcrumb({
          category: "navigation",
          message: "User navigated to /proposals",
        }),
      ).resolves.not.toThrow();
    });
  });
});
