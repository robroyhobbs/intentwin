import { NextRequest, NextResponse } from "next/server";
import { rateLimitCheck, AUTH_LIMIT } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const blocked = rateLimitCheck(request, AUTH_LIMIT, { keyByIp: true });
    if (blocked) return blocked;

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("allowed_emails")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (error || !data) {
      return NextResponse.json({ allowed: false });
    }

    return NextResponse.json({ allowed: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
