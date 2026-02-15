import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";

/**
 * DELETE /api/proposals/[id]/review-stages/[stageId]/reviewers/[reviewerId]
 * Remove a reviewer from a review stage
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string; reviewerId: string }> }
) {
  try {
    const { id, stageId, reviewerId } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const adminClient = createAdminClient();

    // Verify stage exists and belongs to this proposal/org
    const { data: stage, error: stageError } = await adminClient
      .from("proposal_review_stages")
      .select("id")
      .eq("id", stageId)
      .eq("proposal_id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (stageError || !stage) {
      return NextResponse.json({ error: "Review stage not found" }, { status: 404 });
    }

    // Verify reviewer assignment exists
    const { data: existing, error: checkError } = await adminClient
      .from("stage_reviewers")
      .select("id")
      .eq("id", reviewerId)
      .eq("stage_id", stageId)
      .eq("organization_id", context.organizationId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Reviewer assignment not found" }, { status: 404 });
    }

    // Delete the reviewer assignment
    const { error: deleteError } = await adminClient
      .from("stage_reviewers")
      .delete()
      .eq("id", reviewerId)
      .eq("organization_id", context.organizationId);

    if (deleteError) {
      console.error("Remove reviewer error:", deleteError);
      return NextResponse.json({ error: "Failed to remove reviewer" }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Remove reviewer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
