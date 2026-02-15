import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const body = await request.json();
    const { score, comment, strengths, weaknesses, recommendations } = body;

    if (score != null && (typeof score !== "number" || score < 0 || score > 100)) {
      return NextResponse.json(
        { error: "score must be a number between 0 and 100" },
        { status: 400 }
      );
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

    // Get the review and verify it belongs to the current user's stage_reviewer record
    const { data: existingReview, error: reviewError } = await adminClient
      .from("section_reviews")
      .select("*, reviewer_id")
      .eq("id", reviewId)
      .eq("stage_id", stageId)
      .eq("organization_id", context.organizationId)
      .single();

    if (reviewError || !existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify the review's stage_reviewer record belongs to the current user
    const { data: stageReviewer, error: srError } = await adminClient
      .from("stage_reviewers")
      .select("id, reviewer_id")
      .eq("id", existingReview.reviewer_id)
      .single();

    if (srError || !stageReviewer || stageReviewer.reviewer_id !== context.user.id) {
      return NextResponse.json(
        { error: "You can only update your own reviews" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (score !== undefined) updateData.score = score;
    if (comment !== undefined) updateData.comment = comment || null;
    if (strengths !== undefined) updateData.strengths = strengths || null;
    if (weaknesses !== undefined) updateData.weaknesses = weaknesses || null;
    if (recommendations !== undefined) updateData.recommendations = recommendations || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data: updatedReview, error: updateError } = await adminClient
      .from("section_reviews")
      .update(updateData)
      .eq("id", reviewId)
      .eq("organization_id", context.organizationId)
      .select("*")
      .single();

    if (updateError) {
      console.error("Update section review error:", updateError);
      return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
    }

    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    console.error("Update section review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
