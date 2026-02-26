import { NextRequest, NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api/response";
import { createHmac } from "crypto";

const DEMO_PASSWORD = process.env.DEMO_PASSWORD;

/** Sign demo auth token with HMAC-SHA256 so the cookie value can't be forged */
function signDemoToken(): string {
  const secret = process.env.DEMO_PASSWORD || "fallback";
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `demo:${timestamp}`;
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
    .slice(0, 32);
  return `${payload}:${signature}`;
}

export async function POST(request: NextRequest) {
  if (!DEMO_PASSWORD) {
    return apiError({ message: "Demo auth not configured", status: 503, code: "SERVICE_UNAVAILABLE" });
  }

  const { password } = await request.json();

  if (password === DEMO_PASSWORD) {
    const response = NextResponse.json({ success: true });

    response.cookies.set("demo_auth", signDemoToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  }

  return unauthorized("Invalid password");
}
