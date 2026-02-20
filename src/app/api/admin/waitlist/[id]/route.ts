import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { WaitlistStatus, WAITLIST_STATUSES, type WaitlistStatusType } from "@/lib/constants/statuses";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (context.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const body = await request.json();
    const { status, notes } = body;

    // Build update payload — at least one field must be provided
    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      if (!WAITLIST_STATUSES.includes(status as WaitlistStatusType)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${WAITLIST_STATUSES.join(", ")}`,
          },
          { status: 400 },
        );
      }
      updateData.status = status;
    }

    if (notes !== undefined) {
      if (typeof notes !== "string") {
        return NextResponse.json(
          { error: "Notes must be a string" },
          { status: 400 },
        );
      }
      updateData.notes = notes;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one of status or notes must be provided" },
        { status: 400 },
      );
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
        return NextResponse.json(
          { error: "Waitlist entry not found" },
          { status: 404 },
        );
      }
      console.error("Admin waitlist update error:", error);
      return NextResponse.json(
        { error: "Failed to update waitlist entry" },
        { status: 500 },
      );
    }

    // When approved, auto-add email to allowed_emails so the user can sign up
    if (status === WaitlistStatus.APPROVED && entry.email) {
      await adminClient
        .from("allowed_emails")
        .upsert({ email: entry.email }, { onConflict: "email" });
    }

    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
