/**
 * Rate Limit Configuration — Per-Route Limits
 *
 * Defines rate limiting tiers for different API routes.
 * Limits are enforced per organization (authenticated) or per IP (unauthenticated).
 *
 * @module rate-limit/config
 */

import type { RateLimitConfig } from "./limiter";

// ── Time Constants ─────────────────────────────────────────────────
const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const _DAY = 24 * HOUR;

// ── Route-Specific Configurations ──────────────────────────────────

/**
 * Auth endpoints — strict limits to prevent brute force.
 * Per-IP, not per-org (unauthenticated).
 */
export const AUTH_LIMIT: RateLimitConfig = {
  windowMs: MINUTE,
  maxRequests: 10,
  keyPrefix: "rl:auth",
};

/**
 * General API — standard rate limit for most endpoints.
 * Per-org for authenticated, per-IP for unauthenticated.
 */
export const API_LIMIT: RateLimitConfig = {
  windowMs: MINUTE,
  maxRequests: 120,
  keyPrefix: "rl:api",
};

/**
 * AI generation — expensive operations, tighter limit.
 * Per-org only.
 */
export const AI_GENERATION_LIMIT: RateLimitConfig = {
  windowMs: HOUR,
  maxRequests: 120,
  keyPrefix: "rl:ai-gen",
};

/**
 * File upload — moderate limit to prevent storage abuse.
 * Per-org only.
 */
export const UPLOAD_LIMIT: RateLimitConfig = {
  windowMs: MINUTE,
  maxRequests: 10,
  keyPrefix: "rl:upload",
};

/**
 * Export generation — moderate limit for resource-intensive exports.
 * Per-org only.
 */
export const EXPORT_LIMIT: RateLimitConfig = {
  windowMs: HOUR,
  maxRequests: 20,
  keyPrefix: "rl:export",
};

/**
 * Waitlist/public endpoints — limit spam.
 * Per-IP.
 */
export const PUBLIC_LIMIT: RateLimitConfig = {
  windowMs: MINUTE,
  maxRequests: 5,
  keyPrefix: "rl:public",
};

/**
 * Health check — generous limit (monitoring tools hit this).
 */
export const HEALTH_LIMIT: RateLimitConfig = {
  windowMs: MINUTE,
  maxRequests: 60,
  keyPrefix: "rl:health",
};

// ── Route Mapping ──────────────────────────────────────────────────

/**
 * Maps API route patterns to their rate limit configs.
 * Patterns are matched from most specific to least specific.
 */
export const ROUTE_LIMITS: Array<{
  pattern: RegExp;
  config: RateLimitConfig;
  /** Whether to key by IP instead of org */
  keyByIp?: boolean;
}> = [
  // Health — generous
  { pattern: /^\/api\/health/, config: HEALTH_LIMIT, keyByIp: true },

  // Auth endpoints — strict, per-IP
  { pattern: /^\/api\/auth\//, config: AUTH_LIMIT, keyByIp: true },
  { pattern: /^\/api\/demo-auth/, config: AUTH_LIMIT, keyByIp: true },

  // Public endpoints — per-IP
  { pattern: /^\/api\/waitlist/, config: PUBLIC_LIMIT, keyByIp: true },

  // AI generation — expensive
  {
    pattern: /^\/api\/proposals\/[^/]+\/generate/,
    config: AI_GENERATION_LIMIT,
  },
  {
    pattern: /^\/api\/proposals\/[^/]+\/quality-review/,
    config: AI_GENERATION_LIMIT,
  },
  {
    pattern: /^\/api\/proposals\/[^/]+\/sections\/[^/]+\/regenerate/,
    config: AI_GENERATION_LIMIT,
  },
  {
    pattern: /^\/api\/proposals\/[^/]+\/auto-fix/,
    config: AI_GENERATION_LIMIT,
  },
  { pattern: /^\/api\/intake\//, config: AI_GENERATION_LIMIT },
  { pattern: /^\/api\/diagrams\/generate/, config: AI_GENERATION_LIMIT },
  { pattern: /^\/api\/evidence\/extract/, config: AI_GENERATION_LIMIT },
  { pattern: /^\/api\/bulk-import\/extract/, config: AI_GENERATION_LIMIT },

  // File upload
  { pattern: /^\/api\/documents\/upload/, config: UPLOAD_LIMIT },

  // Export
  { pattern: /^\/api\/proposals\/[^/]+\/export/, config: EXPORT_LIMIT },

  // Stripe webhooks — no rate limit (Stripe handles its own retry logic)
  {
    pattern: /^\/api\/stripe\/webhook/,
    config: { windowMs: MINUTE, maxRequests: 1000, keyPrefix: "rl:webhook" },
  },

  // Cron jobs — authenticated by CRON_SECRET, generous limit
  { pattern: /^\/api\/cron\//, config: HEALTH_LIMIT, keyByIp: true },

  // Default: general API limit for everything else
  { pattern: /^\/api\//, config: API_LIMIT },
];

/**
 * Get the rate limit config for a given URL path.
 */
export function getRouteLimit(pathname: string): {
  config: RateLimitConfig;
  keyByIp: boolean;
} {
  for (const route of ROUTE_LIMITS) {
    if (route.pattern.test(pathname)) {
      return { config: route.config, keyByIp: route.keyByIp ?? false };
    }
  }
  return { config: API_LIMIT, keyByIp: false };
}
