import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, checkProposalAccess } from "@/lib/supabase/auth-api";
import { ReviewStageStatus, REVIEW_STAGE_STATUSES } from "@/lib/constants/statuses";
import { unauthorized, notFound, badRequest, ok, serverError } from "@/lib/api/response";

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
      return unauthorized();
    }

    const hasAccess = await checkProposalAccess(context, id);
    if (!hasAccess) {
      return notFound("Proposal not found");
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !REVIEW_STAGE_STATUSES.includes(status)) {
      return badRequest(`Invalid status. Must be one of: ${REVIEW_STAGE_STATUSES.join(", ")}`);
    }

    const adminClient = createAdminClient();

    // Verify stage exists and belongs to this proposal/org
    const { data: existingStage, error: fetchError } = await adminClient
      .from("proposal_review_stages")
      .select("id, proposal_id, organization_id, stage, stage_order, status, started_at, completed_at, completed_by, created_at")
      .eq("id", stageId)
      .eq("proposal_id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (fetchError || !existingStage) {
      return notFound("Review stage not found");
    }

    const updateData: Record<string, unknown> = { status };

    // If completing, set completed_at and completed_by
    if (status === ReviewStageStatus.COMPLETED) {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = context.user.id;
    }

    // If activating, set started_at if not already set
    if (status === ReviewStageStatus.ACTIVE && !existingStage.started_at) {
      updateData.started_at = new Date().toISOString();
    }

    const { data: updatedStage, error: updateError } = await adminClient
      .from("proposal_review_stages")
      .update(updateData)
      .eq("id", stageId)
      .eq("organization_id", context.organizationId)
      .select("id, proposal_id, organization_id, stage, stage_order, status, started_at, completed_at, completed_by, created_at")
      .single();

    if (updateError) {
      return serverError("Failed to update review stage", updateError);
    }

    return ok({ stage: updatedStage });
  } catch (error) {
    return serverError("Internal server error", error);
  }
}
