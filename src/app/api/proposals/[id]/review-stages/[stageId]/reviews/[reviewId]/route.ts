import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, checkProposalAccess } from "@/lib/supabase/auth-api";
import { unauthorized, notFound, badRequest, forbidden, ok, serverError } from "@/lib/api/response";

/**
 * PATCH /api/proposals/[id]/review-stages/[stageId]/reviews/[reviewId]
 * Update an existing section review
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string; reviewId: string }> }
) {
  try {
    const { id, stageId, reviewId } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    const hasAccess = await checkProposalAccess(context, id);
    if (!hasAccess) {
      return notFound("Proposal not found");
    }

    const body = await request.json();
    const { score, comment, strengths, weaknesses, recommendations } = body;

    if (score != null && (typeof score !== "number" || score < 0 || score > 100)) {
      return badRequest("score must be a number between 0 and 100");
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
      return notFound("Review stage not found");
    }

    // Get the review and verify it belongs to the current user's stage_reviewer record
    const { data: existingReview, error: reviewError } = await adminClient
      .from("section_reviews")
      .select("id, stage_id, reviewer_id, section_id, organization_id, score, comment, strengths, weaknesses, recommendations, created_at, updated_at")
      .eq("id", reviewId)
      .eq("stage_id", stageId)
      .eq("organization_id", context.organizationId)
      .single();

    if (reviewError || !existingReview) {
      return notFound("Review not found");
    }

    // Verify the review's stage_reviewer record belongs to the current user
    const { data: stageReviewer, error: srError } = await adminClient
      .from("stage_reviewers")
      .select("id, reviewer_id")
      .eq("id", existingReview.reviewer_id)
      .single();

    if (srError || !stageReviewer || stageReviewer.reviewer_id !== context.user.id) {
      return forbidden("You can only update your own reviews");
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (score !== undefined) updateData.score = score;
    if (comment !== undefined) updateData.comment = comment || null;
    if (strengths !== undefined) updateData.strengths = strengths || null;
    if (weaknesses !== undefined) updateData.weaknesses = weaknesses || null;
    if (recommendations !== undefined) updateData.recommendations = recommendations || null;

    if (Object.keys(updateData).length === 0) {
      return badRequest("No fields to update");
    }

    const { data: updatedReview, error: updateError } = await adminClient
      .from("section_reviews")
      .update(updateData)
      .eq("id", reviewId)
      .eq("organization_id", context.organizationId)
      .select("id, stage_id, reviewer_id, section_id, organization_id, score, comment, strengths, weaknesses, recommendations, created_at, updated_at")
      .single();

    if (updateError) {
      return serverError("Failed to update review", updateError);
    }

    return ok({ review: updatedReview });
  } catch (error) {
    return serverError("Internal server error", error);
  }
}
