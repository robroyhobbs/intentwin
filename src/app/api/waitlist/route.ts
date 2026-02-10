import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { email, full_name, company } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const adminClient = createAdminClient();

    const { error } = await adminClient.from("waitlist_signups").upsert(
      {
        email: normalizedEmail,
        full_name: full_name?.trim() || null,
        company: company?.trim() || null,
      },
      { onConflict: "email" },
    );

    if (error) {
      console.error("Waitlist error:", error);
      return NextResponse.json(
        { error: "Failed to join waitlist" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
