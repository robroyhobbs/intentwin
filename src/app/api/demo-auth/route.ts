import { NextRequest, NextResponse } from "next/server";

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "capgemini2024";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password === DEMO_PASSWORD) {
    const response = NextResponse.json({ success: true });

    // Set cookie for 7 days
    response.cookies.set("demo_auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
