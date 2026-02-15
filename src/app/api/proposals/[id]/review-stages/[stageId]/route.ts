import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";

const VALID_STATUSES = ["pending", "active", "completed", "skipped"] as const;

/**
 * PATCH /api/proposals/[id]/review-stages/[stageId]
 * Update a review stage's status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id, stageId } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verify stage exists and belongs to this proposal/org
    const { data: existingStage, error: fetchError } = await adminClient
      .from("proposal_review_stages")
      .select("*")
      .eq("id", stageId)
      .eq("proposal_id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (fetchError || !existingStage) {
      return NextResponse.json({ error: "Review stage not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { status };

    // If completing, set completed_at and completed_by
    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = context.user.id;
    }

    // If activating, set started_at if not already set
    if (status === "active" && !existingStage.started_at) {
      updateData.started_at = new Date().toISOString();
    }

    const { data: updatedStage, error: updateError } = await adminClient
      .from("proposal_review_stages")
      .update(updateData)
      .eq("id", stageId)
      .eq("organization_id", context.organizationId)
      .select("*")
      .single();

    if (updateError) {
      console.error("Update review stage error:", updateError);
      return NextResponse.json({ error: "Failed to update review stage" }, { status: 500 });
    }

    return NextResponse.json({ stage: updatedStage });
  } catch (error) {
    console.error("Update review stage error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
