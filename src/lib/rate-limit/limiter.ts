/**
 * Rate Limiter — Sliding Window with Pluggable Store
 *
 * Provides per-key rate limiting using a sliding window algorithm.
 * Uses in-memory Map by default (works in Vercel serverless with warm instances).
 *
 * To switch to distributed rate limiting (Upstash Redis):
 * 1. Install @upstash/redis and @upstash/ratelimit
 * 2. Implement RateLimitStore using Upstash's sliding window
 * 3. Set the store via setRateLimitStore()
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

/**
 * Abstraction for rate limit storage backend.
 * Implement this interface to swap in Upstash Redis or any external store.
 */
export interface RateLimitStore {
  get(key: string): RateLimitEntry | undefined;
  set(key: string, entry: RateLimitEntry): void;
  delete(key: string): void;
  entries(): IterableIterator<[string, RateLimitEntry]>;
  readonly size: number;
}

// In-memory store adapter (default)
class InMemoryStore implements RateLimitStore {
  private map = new Map<string, RateLimitEntry>();
  get(key: string) { return this.map.get(key); }
  set(key: string, entry: RateLimitEntry) { this.map.set(key, entry); }
  delete(key: string) { this.map.delete(key); }
  entries() { return this.map.entries(); }
  get size() { return this.map.size; }
}

// Global store (survives across requests in the same serverless instance).
// Replace via setRateLimitStore() to use a distributed backend.
let store: RateLimitStore = new InMemoryStore();

/**
 * Replaces the rate limit storage backend at runtime.
 * Use this to swap from the default in-memory store to a distributed backend (e.g., Upstash Redis).
 *
 * @param newStore - A store implementation conforming to the RateLimitStore interface
 *
 * @example
 * import { UpstashStore } from "./upstash-adapter";
 * setRateLimitStore(new UpstashStore());
 */
export function setRateLimitStore(newStore: RateLimitStore): void {
  store = newStore;
}

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
  cleanupTimer.unref?.();
}

function getWindowStart(now: number, windowMs: number): number {
  return now - windowMs;
}

/**
 * Checks and consumes a rate limit token using a sliding window algorithm.
 * Counts requests within the last `windowMs` milliseconds. If under the limit,
 * records the current request and returns success. If over, returns failure
 * with retry-after information.
 *
 * @param key - Unique identifier for the rate limit bucket (e.g., user ID, IP address)
 * @param config - Rate limit configuration (windowMs, maxRequests, optional keyPrefix)
 * @returns Result indicating success/failure, remaining tokens, and reset time
 *
 * @example
 * const result = checkRateLimit("ip:192.168.1.1", { windowMs: 60_000, maxRequests: 10 });
 * if (!result.success) console.log(`Retry in ${result.retryAfter}s`);
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  ensureCleanup();

  const now = Date.now();
  const windowStart = getWindowStart(now, config.windowMs);
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
 * Resets the rate limit for a specific key, removing all tracked timestamps.
 * Useful after successful authentication or when manually clearing limits.
 *
 * @param key - The rate limit bucket key to reset
 * @param keyPrefix - Optional prefix that was used when the limit was set
 *
 * @example
 * resetRateLimit("ip:192.168.1.1", "auth");
 */
export function resetRateLimit(key: string, keyPrefix?: string): void {
  const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key;
  store.delete(fullKey);
}

/**
 * Returns the current rate limit status for a key without consuming a token.
 * Useful for displaying remaining quota in UI or pre-checking before expensive operations.
 *
 * @param key - The rate limit bucket key to inspect
 * @param config - Rate limit configuration matching the one used for checkRateLimit
 * @returns Current limit status including remaining tokens and reset time
 *
 * @example
 * const status = getRateLimitStatus("org:abc123", AI_GENERATION_LIMIT);
 * console.log(`${status.remaining} requests remaining`);
 */
export function getRateLimitStatus(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const windowStart = getWindowStart(now, config.windowMs);
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

// Export for testing (returns the current store instance)
export function _getTestStore(): RateLimitStore {
  return store;
}
