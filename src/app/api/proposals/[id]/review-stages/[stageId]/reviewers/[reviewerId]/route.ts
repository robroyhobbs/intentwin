import { createAdminClient } from "@/lib/supabase/admin";
import { withProposalRoute, notFound, ok, serverError } from "@/lib/api/response";

/**
 * DELETE /api/proposals/[id]/review-stages/[stageId]/reviewers/[reviewerId]
 * Remove a reviewer from a review stage
 */
export const DELETE = withProposalRoute(async (request, { id, stageId, reviewerId }, context) => {
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
    return notFound("Review stage not found");
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
    return notFound("Reviewer assignment not found");
  }

  // Delete the reviewer assignment
  const { error: deleteError } = await adminClient
    .from("stage_reviewers")
    .delete()
    .eq("id", reviewerId)
    .eq("organization_id", context.organizationId);

  if (deleteError) {
    return serverError("Failed to remove reviewer", deleteError);
  }

  return ok({ deleted: true });
});
