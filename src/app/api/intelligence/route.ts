/**
 * Intelligence Service API proxy.
 *
 * Proxies requests to the intelligence microservice, keeping the
 * service key server-side. All requests require user authentication.
 *
 * GET /api/intelligence?path=/api/v1/awards/stats&limit=10&...
 *
 * The `path` query param specifies which intelligence endpoint to call.
 * All other query params are forwarded to the intelligence service.
 */

import { NextRequest } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { unauthorized, badRequest, ok, serverError, apiError } from "@/lib/api/response";

const INTELLIGENCE_API_URL = process.env.INTELLIGENCE_API_URL?.trim() || null;
const INTELLIGENCE_SERVICE_KEY =
  process.env.INTELLIGENCE_SERVICE_KEY?.trim() || null;

function isConfigured(): boolean {
  return INTELLIGENCE_API_URL !== null && INTELLIGENCE_SERVICE_KEY !== null;
}

export async function GET(request: NextRequest) {
  // Verify user is authenticated
  const context = await getUserContext(request);
  if (!context) {
    return unauthorized();
  }

  if (!isConfigured()) {
    return apiError({
      message: "Intelligence service not configured",
      status: 503,
      code: "SERVICE_UNAVAILABLE",
    });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path || !path.startsWith("/api/v1/")) {
    return badRequest("Invalid path parameter");
  }

  // Build forwarded query string (exclude the `path` param)
  const forwardParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key !== "path") {
      forwardParams.set(key, value);
    }
  }

  const queryString = forwardParams.toString();
  const targetUrl = `${INTELLIGENCE_API_URL}${path}${queryString ? `?${queryString}` : ""}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "X-Service-Key": INTELLIGENCE_SERVICE_KEY!,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return apiError({
        message: "Intelligence service error",
        status: response.status,
        code: "UPSTREAM_ERROR",
      });
    }

    const data = await response.json();
    return ok(data);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return apiError({
        message: "Intelligence service timeout",
        status: 504,
        code: "GATEWAY_TIMEOUT",
      });
    }
    return apiError({
      message: "Intelligence service unavailable",
      status: 502,
      code: "BAD_GATEWAY",
      internal: err,
    });
  }
}
