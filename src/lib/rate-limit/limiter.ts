/**
 * Rate Limiter — Sliding Window with In-Memory Store
 *
 * Provides per-key rate limiting using a sliding window algorithm.
 * Uses in-memory Map by default (works in Vercel serverless with warm instances).
 * Can be swapped to Upstash Redis for distributed limiting.
 *
 * @module rate-limit/limiter
 */

interface RateLimitEntry {
  timestamps: number[];
  blockedUntil?: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp (ms) when the window resets
  retryAfter?: number; // Seconds until client should retry
}

export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Max requests allowed per window */
  maxRequests: number;
  /** Optional key prefix for namespacing */
  keyPrefix?: string;
}

// Global store (survives across requests in the same serverless instance)
const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks (every 60 seconds)
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      // Remove entries with no recent timestamps
      if (entry.timestamps.length === 0 && (!entry.blockedUntil || entry.blockedUntil < now)) {
        store.delete(key);
      }
    }
  }, 60_000);

  // Don't prevent Node from exiting
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * Check and consume a rate limit token.
 *
 * Uses sliding window: counts requests within the last `windowMs` milliseconds.
 * If under limit, adds the current request timestamp and returns success.
 * If over limit, returns failure with retry-after information.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  ensureCleanup();

  const now = Date.now();
  const windowStart = now - config.windowMs;
  const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;

  let entry = store.get(fullKey);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(fullKey, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  // Check if currently blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    const retryAfterMs = entry.blockedUntil - now;
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.blockedUntil,
      retryAfter: Math.ceil(retryAfterMs / 1000),
    };
  }

  // Check if under limit
  if (entry.timestamps.length >= config.maxRequests) {
    // Calculate when the earliest request in the window expires
    const oldestInWindow = entry.timestamps[0] ?? now;
    const resetTime = oldestInWindow + config.windowMs;
    const retryAfterMs = resetTime - now;

    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: resetTime,
      retryAfter: Math.ceil(retryAfterMs / 1000),
    };
  }

  // Allow request — add timestamp
  entry.timestamps.push(now);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.timestamps.length,
    reset: now + config.windowMs,
  };
}

/**
 * Reset rate limit for a specific key (e.g., after successful auth)
 */
export function resetRateLimit(key: string, keyPrefix?: string): void {
  const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key;
  store.delete(fullKey);
}

/**
 * Get current rate limit status without consuming a token
 */
export function getRateLimitStatus(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;

  const entry = store.get(fullKey);
  if (!entry) {
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: now + config.windowMs,
    };
  }

  const activeTimestamps = entry.timestamps.filter((t) => t > windowStart);
  const remaining = Math.max(0, config.maxRequests - activeTimestamps.length);

  return {
    success: remaining > 0,
    limit: config.maxRequests,
    remaining,
    reset: activeTimestamps.length > 0
      ? activeTimestamps[0]! + config.windowMs
      : now + config.windowMs,
  };
}

// Export for testing
export const _testStore = store;
