import { NextRequest, NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api/response";

const DEMO_PASSWORD = process.env.DEMO_PASSWORD;

export async function POST(request: NextRequest) {
  if (!DEMO_PASSWORD) {
    return apiError({ message: "Demo auth not configured", status: 503, code: "SERVICE_UNAVAILABLE" });
  }

  const { password } = await request.json();

  if (password === DEMO_PASSWORD) {
    // Cookie-setting response — can't use ok() since we need to modify response headers
    const response = NextResponse.json({ success: true });

    response.cookies.set("demo_auth", "authenticated", {
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
