import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  _getTestStore,
  type RateLimitConfig,
} from "@/lib/rate-limit/limiter";
import { getRouteLimit, AI_GENERATION_LIMIT, AUTH_LIMIT, API_LIMIT, PUBLIC_LIMIT } from "@/lib/rate-limit/config";

// Test config: small window for fast tests
const testConfig: RateLimitConfig = {
  windowMs: 1000, // 1 second
  maxRequests: 3,
  keyPrefix: "test",
};

beforeEach(() => {
  // Clear the store between tests
  // Clear via resetRateLimit for each possible key, or use store's clear-like behavior
  const store = _getTestStore();
  // Iterate and delete all entries
  for (const [key] of store.entries()) {
    store.delete(key);
  }
});

// ──────────────────────────────────────────────────────────
// Core Rate Limiter
// ──────────────────────────────────────────────────────────
describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const r1 = checkRateLimit("user-1", testConfig);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit("user-1", testConfig);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit("user-1", testConfig);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests at the limit", () => {
    // Exhaust the limit
    for (let i = 0; i < 3; i++) {
      checkRateLimit("user-2", testConfig);
    }

    const result = checkRateLimit("user-2", testConfig);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("returns proper rate limit headers", () => {
    const result = checkRateLimit("user-3", testConfig);

    expect(result.limit).toBe(3);
    expect(result.remaining).toBe(2);
    expect(result.reset).toBeGreaterThan(Date.now());
  });

  it("includes Retry-After when blocked", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("user-4", testConfig);
    }

    const result = checkRateLimit("user-4", testConfig);
    expect(result.retryAfter).toBeDefined();
    expect(result.retryAfter).toBeGreaterThan(0);
    // Retry-After should be in seconds
    expect(result.retryAfter!).toBeLessThanOrEqual(1);
  });

  it("isolates limits between different keys", () => {
    // User A hits limit
    for (let i = 0; i < 3; i++) {
      checkRateLimit("org-a", testConfig);
    }
    expect(checkRateLimit("org-a", testConfig).success).toBe(false);

    // User B is unaffected
    expect(checkRateLimit("org-b", testConfig).success).toBe(true);
  });

  it("resets after window expires", async () => {
    const shortConfig: RateLimitConfig = {
      windowMs: 50, // 50ms window
      maxRequests: 1,
      keyPrefix: "short",
    };

    checkRateLimit("user-5", shortConfig);
    expect(checkRateLimit("user-5", shortConfig).success).toBe(false);

    // Wait for window to expire
    await new Promise((r) => setTimeout(r, 60));

    expect(checkRateLimit("user-5", shortConfig).success).toBe(true);
  });

  it("uses key prefix for namespacing", () => {
    const configA: RateLimitConfig = {
      windowMs: 1000,
      maxRequests: 1,
      keyPrefix: "ns-a",
    };
    const configB: RateLimitConfig = {
      windowMs: 1000,
      maxRequests: 1,
      keyPrefix: "ns-b",
    };

    checkRateLimit("same-key", configA);
    // Same key, different namespace — should still succeed
    expect(checkRateLimit("same-key", configB).success).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────
// Reset
// ──────────────────────────────────────────────────────────
describe("resetRateLimit", () => {
  it("clears rate limit for a specific key", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("user-reset", testConfig);
    }
    expect(checkRateLimit("user-reset", testConfig).success).toBe(false);

    resetRateLimit("user-reset", testConfig.keyPrefix);

    expect(checkRateLimit("user-reset", testConfig).success).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────
// Status Check (non-consuming)
// ──────────────────────────────────────────────────────────
describe("getRateLimitStatus", () => {
  it("returns status without consuming a token", () => {
    checkRateLimit("user-status", testConfig);

    const status = getRateLimitStatus("user-status", testConfig);
    expect(status.remaining).toBe(2); // Still 2, not 1

    // Another consume
    checkRateLimit("user-status", testConfig);
    const status2 = getRateLimitStatus("user-status", testConfig);
    expect(status2.remaining).toBe(1);
  });

  it("returns full capacity for unknown keys", () => {
    const status = getRateLimitStatus("unknown", testConfig);
    expect(status.remaining).toBe(3);
    expect(status.success).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────
// Route Configuration
// ──────────────────────────────────────────────────────────
describe("getRouteLimit", () => {
  it("returns AI generation limit for generate routes", () => {
    const { config } = getRouteLimit("/api/proposals/abc-123/generate");
    expect(config.keyPrefix).toBe(AI_GENERATION_LIMIT.keyPrefix);
    expect(config.maxRequests).toBe(AI_GENERATION_LIMIT.maxRequests);
  });

  it("returns AI generation limit for quality review routes", () => {
    const { config } = getRouteLimit("/api/proposals/abc/quality-review");
    expect(config.keyPrefix).toBe(AI_GENERATION_LIMIT.keyPrefix);
  });

  it("returns AI generation limit for section regenerate", () => {
    const { config } = getRouteLimit("/api/proposals/abc/sections/sec1/regenerate");
    expect(config.keyPrefix).toBe(AI_GENERATION_LIMIT.keyPrefix);
  });

  it("returns auth limit for auth routes", () => {
    const { config, keyByIp } = getRouteLimit("/api/auth/check-access");
    expect(config.keyPrefix).toBe(AUTH_LIMIT.keyPrefix);
    expect(keyByIp).toBe(true);
  });

  it("returns auth limit for demo-auth", () => {
    const { config, keyByIp } = getRouteLimit("/api/demo-auth");
    expect(config.keyPrefix).toBe(AUTH_LIMIT.keyPrefix);
    expect(keyByIp).toBe(true);
  });

  it("returns public limit for waitlist", () => {
    const { config, keyByIp } = getRouteLimit("/api/waitlist");
    expect(config.keyPrefix).toBe(PUBLIC_LIMIT.keyPrefix);
    expect(keyByIp).toBe(true);
  });

  it("returns default API limit for general routes", () => {
    const { config } = getRouteLimit("/api/proposals");
    expect(config.keyPrefix).toBe(API_LIMIT.keyPrefix);
  });

  it("returns default API limit for unknown routes", () => {
    const { config } = getRouteLimit("/api/some-unknown-route");
    expect(config.keyPrefix).toBe(API_LIMIT.keyPrefix);
  });

  it("matches more specific patterns before general ones", () => {
    // /api/proposals/[id]/generate should match AI_GENERATION_LIMIT, not API_LIMIT
    const { config: genConfig } = getRouteLimit("/api/proposals/p1/generate");
    expect(genConfig.keyPrefix).toBe(AI_GENERATION_LIMIT.keyPrefix);

    // /api/proposals (no sub-path) should match API_LIMIT
    const { config: listConfig } = getRouteLimit("/api/proposals");
    expect(listConfig.keyPrefix).toBe(API_LIMIT.keyPrefix);
  });
});

// ──────────────────────────────────────────────────────────
// Concurrent Request Handling
// ──────────────────────────────────────────────────────────
describe("Concurrent requests", () => {
  it("correctly limits rapid concurrent requests", () => {
    const results = Array.from({ length: 5 }, () =>
      checkRateLimit("concurrent-user", testConfig),
    );

    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);

    expect(successes).toHaveLength(3); // maxRequests
    expect(failures).toHaveLength(2); // over limit
  });
});
