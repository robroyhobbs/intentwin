import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { unauthorized, forbidden, ok, serverError } from "@/lib/api/response";

/**
 * GET /api/admin/waitlist
 * Returns all waitlist entries sorted by created_at desc.
 * Requires authenticated user with admin role.
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    if (context.role !== "admin") {
      return forbidden();
    }

    // Pagination params
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const adminClient = createAdminClient();
    const { data: entries, error, count } = await adminClient
      .from("waitlist")
      .select("id, name, email, company, company_size, status, notes, nurture_step, nurture_last_sent_at, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return serverError("Failed to fetch waitlist entries", error);
    }

    const total = count ?? 0;
    return ok({
      entries: entries || [],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return serverError("Internal server error");
  }
}
