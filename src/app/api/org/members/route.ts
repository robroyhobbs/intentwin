import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { unauthorized, ok, serverError } from "@/lib/api/response";

/**
 * GET /api/org/members
 * List organization members for reviewer dropdowns and assignments
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    const adminClient = createAdminClient();
    const { data: members, error } = await adminClient
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("organization_id", context.organizationId)
      .order("full_name", { ascending: true });

    if (error) {
      return serverError("Failed to fetch members", error);
    }

    return ok({ members: members || [] });
  } catch (error) {
    return serverError("Internal server error", error);
  }
}
