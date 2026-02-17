import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkRateLimit, type RateLimitResult } from "@/lib/rate-limit/limiter";
import { getRouteLimit } from "@/lib/rate-limit/config";

/**
 * Extract a rate limit key from the request.
 * Uses X-Organization-Id header when available, otherwise falls back to IP.
 */
function extractRateLimitKey(request: NextRequest, keyByIp: boolean): string {
  if (keyByIp) {
    return `ip:${getClientIp(request)}`;
  }
  const orgHeader = request.headers.get("x-organization-id");
  if (orgHeader) return `org:${orgHeader}`;
  return `ip:${getClientIp(request)}`;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

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

export async function middleware(request: NextRequest) {
  // Skip middleware if Supabase env vars are not set (build time)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  // ── Rate limiting for API routes (before session refresh — cheap & fast) ──
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api")) {
    const { config, keyByIp } = getRouteLimit(pathname);
    const key = extractRateLimitKey(request, keyByIp);
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
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
