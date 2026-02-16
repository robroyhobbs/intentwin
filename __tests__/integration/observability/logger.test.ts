import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to test the logger module's behavior, so we mock the env
// and spy on console methods.

describe("Logger", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Reset module cache so logger re-evaluates env vars
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("createLogger (context-aware)", () => {
    it("should include base context in all log messages", async () => {
      process.env.NODE_ENV = "production";
      process.env.LOG_LEVEL = "debug";

      const { createLogger } = await import("@/lib/utils/logger");
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const log = createLogger({
        requestId: "req-123",
        organizationId: "org-456",
      });

      log.info("test message", { extra: "data" });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.requestId).toBe("req-123");
      expect(output.organizationId).toBe("org-456");
      expect(output.extra).toBe("data");
      expect(output.message).toBe("test message");
      expect(output.level).toBe("info");
    });

    it("should support child loggers that inherit parent context", async () => {
      process.env.NODE_ENV = "production";
      process.env.LOG_LEVEL = "debug";

      const { createLogger } = await import("@/lib/utils/logger");
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const parentLog = createLogger({ requestId: "req-123" });
      const childLog = parentLog.child({ sectionType: "executive_summary" });

      childLog.info("generating section");

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.requestId).toBe("req-123");
      expect(output.sectionType).toBe("executive_summary");
    });
  });

  describe("createRequestLogger", () => {
    it("should generate a correlation ID when none provided", async () => {
      process.env.NODE_ENV = "production";
      process.env.LOG_LEVEL = "debug";

      const { createRequestLogger } = await import("@/lib/utils/logger");

      const { log, requestId } = createRequestLogger();

      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe("string");
      expect(requestId.length).toBeGreaterThan(0);
      expect(log).toBeDefined();
      expect(typeof log.info).toBe("function");
    });

    it("should use incoming request ID if provided", async () => {
      process.env.NODE_ENV = "production";
      process.env.LOG_LEVEL = "debug";

      const { createRequestLogger } = await import("@/lib/utils/logger");

      const mockRequest = {
        headers: {
          get: (key: string) => (key === "x-request-id" ? "incoming-req-789" : null),
        },
      };

      const { requestId } = createRequestLogger(mockRequest);
      expect(requestId).toBe("incoming-req-789");
    });

    it("should include requestId in all log output", async () => {
      process.env.NODE_ENV = "production";
      process.env.LOG_LEVEL = "debug";

      const { createRequestLogger } = await import("@/lib/utils/logger");
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const { log, requestId } = createRequestLogger(undefined, {
        organizationId: "org-123",
      });

      log.info("processing request");

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.requestId).toBe(requestId);
      expect(output.organizationId).toBe("org-123");
    });
  });

  describe("sensitive data redaction", () => {
    it("should redact sensitive keys in context", async () => {
      process.env.NODE_ENV = "production";
      process.env.LOG_LEVEL = "debug";

      const { logger } = await import("@/lib/utils/logger");
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      logger.info("test", {
        password: "secret123",
        token: "abc",
        api_key: "key-xyz",
        safe_value: "visible",
      });

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.password).toBe("[REDACTED]");
      expect(output.token).toBe("[REDACTED]");
      expect(output.api_key).toBe("[REDACTED]");
      expect(output.safe_value).toBe("visible");
    });

    it("should redact nested sensitive keys", async () => {
      process.env.NODE_ENV = "production";
      process.env.LOG_LEVEL = "debug";

      const { logger } = await import("@/lib/utils/logger");
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      logger.info("test", {
        config: {
          apiKey: "secret-key",
          endpoint: "https://api.example.com",
        },
      });

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.config.apiKey).toBe("[REDACTED]");
      expect(output.config.endpoint).toBe("https://api.example.com");
    });
  });

  describe("log levels", () => {
    it("should suppress debug logs in production without LOG_LEVEL", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.LOG_LEVEL;

      const { logger } = await import("@/lib/utils/logger");
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      logger.debug("should not appear");

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should show error logs in all environments", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.LOG_LEVEL;

      const { logger } = await import("@/lib/utils/logger");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      logger.error("critical failure", new Error("test"));

      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("timer", () => {
    it("should return duration in milliseconds", async () => {
      process.env.NODE_ENV = "production";
      process.env.LOG_LEVEL = "debug";

      const { logger } = await import("@/lib/utils/logger");
      vi.spyOn(console, "log").mockImplementation(() => {});

      const end = logger.time("test-operation");

      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 10) {
        // busy wait ~10ms
      }

      const duration = end();
      expect(duration).toBeGreaterThanOrEqual(5); // Allow some tolerance
      expect(typeof duration).toBe("number");
    });

    it("should accept additional context on end", async () => {
      process.env.NODE_ENV = "production";
      process.env.LOG_LEVEL = "debug";

      const { createLogger } = await import("@/lib/utils/logger");
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const log = createLogger({ requestId: "req-timer" });
      const end = log.time("operation", { phase: "init" });
      end({ result: "success" });

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.requestId).toBe("req-timer");
      expect(output.phase).toBe("init");
      expect(output.result).toBe("success");
      expect(output.duration_ms).toBeDefined();
    });
  });

  describe("event logging", () => {
    it("should include base context in events", async () => {
      process.env.NODE_ENV = "production";
      process.env.LOG_LEVEL = "debug";

      const { createLogger } = await import("@/lib/utils/logger");
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const log = createLogger({ organizationId: "org-event" });
      log.event("proposal.created", { proposalId: "p-123" });

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.event).toBe("proposal.created");
      expect(output.details.organizationId).toBe("org-event");
      expect(output.details.proposalId).toBe("p-123");
    });
  });
});
