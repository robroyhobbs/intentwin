/**
 * Rate Limit Middleware — Next.js API Route Wrapper
 *
 * Usage in API routes:
 * ```ts
 * import { withRateLimit } from "@/lib/rate-limit/middleware";
 * import { AI_GENERATION_LIMIT } from "@/lib/rate-limit/config";
 *
 * // Option 1: Auto-detect from route path
 * export const POST = withRateLimit(async (request) => {
 *   // your handler
 * });
 *
 * // Option 2: Explicit config
 * export const POST = withRateLimit(async (request) => {
 *   // your handler
 * }, { config: AI_GENERATION_LIMIT });
 * ```
 *
 * @module rate-limit/middleware
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, type RateLimitConfig, type RateLimitResult } from "./limiter";
import { getRouteLimit } from "./config";

interface WithRateLimitOptions {
  /** Override the auto-detected config */
  config?: RateLimitConfig;
  /** Force key-by-IP instead of org */
  keyByIp?: boolean;
  /** Custom key generator */
  keyGenerator?: (request: NextRequest) => string;
}

type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
) => Promise<Response> | Response;

/**
 * Extract a rate limit key from the request.
 * Uses organization ID from auth headers/cookies when available,
 * falls back to IP address.
 */
function extractKey(request: NextRequest, keyByIp: boolean): string {
  if (keyByIp) {
    return getClientIp(request);
  }

  // Try to extract org ID from common patterns:
  // 1. X-Organization-Id header (set by some clients)
  const orgHeader = request.headers.get("x-organization-id");
  if (orgHeader) return `org:${orgHeader}`;

  // 2. Fall back to IP (org ID gets resolved in the handler, not here)
  return `ip:${getClientIp(request)}`;
}

function getClientIp(request: NextRequest): string {
  // Vercel/Cloudflare headers
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

/**
 * Build rate-limit response headers
 */
function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
  };

  if (result.retryAfter) {
    headers["Retry-After"] = String(result.retryAfter);
  }

  return headers;
}

/**
 * Wraps a Next.js API route handler with automatic rate limiting.
 * Auto-detects the rate limit config from the route path, or accepts an explicit config.
 * Returns a 429 JSON response with `Retry-After` headers when the limit is exceeded.
 * Appends `X-RateLimit-*` headers to all successful responses.
 *
 * @param handler - The API route handler function to protect
 * @param options - Optional overrides for config, key strategy, or custom key generator
 * @returns A wrapped route handler with rate limiting applied
 *
 * @example
 * export const POST = withRateLimit(async (request) => {
 *   return NextResponse.json({ ok: true });
 * }, { config: AI_GENERATION_LIMIT });
 */
export function withRateLimit(
  handler: RouteHandler,
  options?: WithRateLimitOptions,
): RouteHandler {
  return async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> },
  ) => {
    // Determine config from route path or explicit options
    const pathname = new URL(request.url).pathname;
    const routeLimit = options?.config
      ? { config: options.config, keyByIp: options.keyByIp ?? false }
      : getRouteLimit(pathname);

    // Generate rate limit key
    const key = options?.keyGenerator
      ? options.keyGenerator(request)
      : extractKey(request, routeLimit.keyByIp);

    // Check rate limit
    const result = checkRateLimit(key, routeLimit.config);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: rateLimitHeaders(result),
        },
      );
    }

    // Execute the actual handler
    const response = await handler(request, context);

    // Add rate limit headers to successful responses
    const headers = rateLimitHeaders(result);
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });

    for (const [header, value] of Object.entries(headers)) {
      newResponse.headers.set(header, value);
    }

    return newResponse;
  };
}

/**
 * Performs a standalone rate limit check for use inside route handlers.
 * Useful when you need to execute logic (e.g., auth) before applying the rate limit.
 *
 * @param request - The incoming Next.js request
 * @param config - Rate limit configuration to apply
 * @param options - Optional key generation strategy overrides
 * @returns A 429 Response if rate limited, or null if the request is allowed
 *
 * @example
 * const blocked = rateLimitCheck(request, AUTH_LIMIT, { keyByIp: true });
 * if (blocked) return blocked;
 * // proceed with handler logic
 */
export function rateLimitCheck(
  request: NextRequest,
  config: RateLimitConfig,
  options?: { keyGenerator?: (req: NextRequest) => string; keyByIp?: boolean },
): Response | null {
  const key = options?.keyGenerator
    ? options.keyGenerator(request)
    : extractKey(request, options?.keyByIp ?? false);

  const result = checkRateLimit(key, config);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: rateLimitHeaders(result),
      },
    );
  }

  return null;
}
