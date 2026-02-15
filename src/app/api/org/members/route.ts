import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";

/**
 * GET /api/org/members
 * List organization members for reviewer dropdowns and assignments
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: members, error } = await adminClient
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("organization_id", context.organizationId)
      .order("full_name", { ascending: true });

    if (error) {
      console.error("Fetch org members error:", error);
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    }

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error("Fetch org members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
