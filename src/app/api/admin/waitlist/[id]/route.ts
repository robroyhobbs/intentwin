import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { WaitlistStatus, WAITLIST_STATUSES, type WaitlistStatusType } from "@/lib/constants/statuses";
import { unauthorized, forbidden, badRequest, notFound, ok, serverError } from "@/lib/api/response";

/**
 * PATCH /api/admin/waitlist/[id]
 * Updates the status and/or notes for a waitlist entry.
 * Requires authenticated user with admin role.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    if (context.role !== "admin") {
      return forbidden();
    }

    const { id } = await params;

    const body = await request.json();
    const { status, notes } = body;

    // Build update payload — at least one field must be provided
    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      if (!WAITLIST_STATUSES.includes(status as WaitlistStatusType)) {
        return badRequest(
          `Invalid status. Must be one of: ${WAITLIST_STATUSES.join(", ")}`,
        );
      }
      updateData.status = status;
    }

    if (notes !== undefined) {
      if (typeof notes !== "string") {
        return badRequest("Notes must be a string");
      }
      updateData.notes = notes;
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest("At least one of status or notes must be provided");
    }

    const adminClient = createAdminClient();
    const { data: entry, error } = await adminClient
      .from("waitlist")
      .update(updateData)
      .eq("id", id)
      .select("id, name, email, company, company_size, status, notes, nurture_step, nurture_last_sent_at, created_at")
      .single();

    if (error || !entry) {
      if (error?.code === "PGRST116" || !entry) {
        return notFound("Waitlist entry not found");
      }
      return serverError("Failed to update waitlist entry", error);
    }

    // When approved, auto-add email to allowed_emails so the user can sign up
    if (status === WaitlistStatus.APPROVED && entry.email) {
      await adminClient
        .from("allowed_emails")
        .upsert({ email: entry.email }, { onConflict: "email" });
    }

    return ok({ entry });
  } catch {
    return serverError("Internal server error");
  }
}
