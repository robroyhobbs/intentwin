import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";

/**
 * GET /api/admin/waitlist
 * Returns all waitlist entries sorted by created_at desc.
 * Requires authenticated user with admin role.
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (context.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminClient = createAdminClient();
    const { data: entries, error } = await adminClient
      .from("waitlist")
      .select("id, name, email, company, company_size, status, notes, nurture_step, nurture_last_sent_at, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin waitlist fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch waitlist entries" },
        { status: 500 },
      );
    }

    return NextResponse.json({ entries: entries || [] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
