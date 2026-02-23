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

import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";

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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Intelligence service not configured", configured: false },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path || !path.startsWith("/api/v1/")) {
    return NextResponse.json(
      { error: "Invalid path parameter" },
      { status: 400 },
    );
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
        Authorization: `Bearer ${INTELLIGENCE_SERVICE_KEY}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Intelligence service error", status: response.status },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Intelligence service timeout" },
        { status: 504 },
      );
    }
    console.error("Intelligence proxy error:", err);
    return NextResponse.json(
      { error: "Intelligence service unavailable" },
      { status: 502 },
    );
  }
}
