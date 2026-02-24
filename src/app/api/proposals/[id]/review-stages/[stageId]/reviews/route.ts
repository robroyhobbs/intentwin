import { createAdminClient } from "@/lib/supabase/admin";
import { StageReviewerStatus } from "@/lib/constants/statuses";
import { withProposalRoute, notFound, badRequest, forbidden, conflict, ok, serverError, created } from "@/lib/api/response";

/**
 * GET /api/proposals/[id]/review-stages/[stageId]/reviews
 * List all section reviews for a stage, grouped by section with averages
 */
export const GET = withProposalRoute(async (request, { id, stageId }, context) => {
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

  // Get all reviews for this stage (capped at 200 for safety)
  const { data: reviews, error: reviewsError } = await adminClient
    .from("section_reviews")
    .select("id, stage_id, reviewer_id, section_id, organization_id, score, comment, strengths, weaknesses, recommendations, created_at, updated_at")
    .eq("stage_id", stageId)
    .eq("organization_id", context.organizationId)
    .limit(200)
    .order("created_at", { ascending: true });

  if (reviewsError) {
    return serverError("Failed to fetch reviews", reviewsError);
  }

  // Batch-fetch all related data to avoid N+1 queries
  const reviewerIds = [...new Set((reviews || []).map((r) => r.reviewer_id))];
  const sectionIds = [...new Set((reviews || []).map((r) => r.section_id))];

  // Single query: fetch all stage_reviewers referenced by these reviews
  const { data: stageReviewers } = reviewerIds.length > 0
    ? await adminClient
        .from("stage_reviewers")
        .select("id, reviewer_id")
        .in("id", reviewerIds)
    : { data: [] };

  // Single query: fetch all profiles for those reviewers
  const profileUserIds = [...new Set((stageReviewers || []).map((sr) => sr.reviewer_id))];
  const { data: profiles } = profileUserIds.length > 0
    ? await adminClient
        .from("profiles")
        .select("id, full_name, email")
        .in("id", profileUserIds)
    : { data: [] };

  // Single query: fetch all sections referenced by these reviews
  const { data: sections } = sectionIds.length > 0
    ? await adminClient
        .from("proposal_sections")
        .select("id, section_type, title")
        .in("id", sectionIds)
        .eq("proposal_id", id)
    : { data: [] };

  // Build lookup maps for O(1) joins
  const reviewerMap = new Map((stageReviewers || []).map((sr) => [sr.id, sr.reviewer_id]));
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  const sectionMap = new Map((sections || []).map((s) => [s.id, s]));

  // Enrich reviews using pre-fetched lookup maps (no additional queries)
  const enrichedReviews = (reviews || []).map((review) => {
    const userId = reviewerMap.get(review.reviewer_id);
    const profile = userId ? profileMap.get(userId) : null;
    const section = sectionMap.get(review.section_id);

    return {
      ...review,
      reviewer_name: profile?.full_name || null,
      reviewer_email: profile?.email || null,
      section_type: section?.section_type || null,
      section_title: section?.title || null,
    };
  });

  // Calculate per-section averages
  const sectionAverages: Record<
    string,
    { sectionId: string; sectionTitle: string; averageScore: number | null; reviewCount: number }
  > = {};

  for (const review of enrichedReviews) {
    const sectionId = review.section_id;
    if (!sectionAverages[sectionId]) {
      sectionAverages[sectionId] = {
        sectionId,
        sectionTitle: review.section_title || review.section_type || sectionId,
        averageScore: null,
        reviewCount: 0,
      };
    }
    sectionAverages[sectionId].reviewCount += 1;
  }

  // Calculate averages from scored reviews only
  const scoredBySection: Record<string, number[]> = {};
  for (const review of enrichedReviews) {
    if (review.score != null) {
      if (!scoredBySection[review.section_id]) {
        scoredBySection[review.section_id] = [];
      }
      scoredBySection[review.section_id].push(review.score);
    }
  }

  for (const [sectionId, scores] of Object.entries(scoredBySection)) {
    if (sectionAverages[sectionId] && scores.length > 0) {
      sectionAverages[sectionId].averageScore =
        Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    }
  }

  return ok({
    reviews: enrichedReviews,
    sectionAverages: Object.values(sectionAverages),
  });
});

/**
 * POST /api/proposals/[id]/review-stages/[stageId]/reviews
 * Submit a section review
 */
export const POST = withProposalRoute(async (request, { id, stageId }, context) => {
  const body = await request.json();
  const { section_id, score, comment, strengths, weaknesses, recommendations } = body;

  if (!section_id) {
    return badRequest("section_id is required");
  }

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

  // Verify the current user is assigned as a reviewer to this stage
  const { data: stageReviewer, error: reviewerError } = await adminClient
    .from("stage_reviewers")
    .select("id, status")
    .eq("stage_id", stageId)
    .eq("reviewer_id", context.user.id)
    .eq("organization_id", context.organizationId)
    .single();

  if (reviewerError || !stageReviewer) {
    return forbidden("You are not assigned as a reviewer for this stage");
  }

  // Verify section belongs to this proposal
  const { data: section, error: sectionError } = await adminClient
    .from("proposal_sections")
    .select("id")
    .eq("id", section_id)
    .eq("proposal_id", id)
    .single();

  if (sectionError || !section) {
    return notFound("Section not found in this proposal");
  }

  // Insert the review
  const { data: review, error: insertError } = await adminClient
    .from("section_reviews")
    .insert({
      stage_id: stageId,
      reviewer_id: stageReviewer.id,
      section_id,
      organization_id: context.organizationId,
      score: score ?? null,
      comment: comment || null,
      strengths: strengths || null,
      weaknesses: weaknesses || null,
      recommendations: recommendations || null,
    })
    .select("id, stage_id, reviewer_id, section_id, organization_id, score, comment, strengths, weaknesses, recommendations, created_at, updated_at")
    .single();

  if (insertError) {
    // Check for unique constraint violation (already reviewed this section)
    if (insertError.code === "23505") {
      return conflict("You have already reviewed this section for this stage");
    }
    return serverError("Failed to create review", insertError);
  }

  // If this is the reviewer's first review, update stage_reviewers status to 'in_progress'
  if (stageReviewer.status === StageReviewerStatus.PENDING) {
    await adminClient
      .from("stage_reviewers")
      .update({ status: StageReviewerStatus.IN_PROGRESS })
      .eq("id", stageReviewer.id)
      .eq("organization_id", context.organizationId);
  }

  return created({ review });
});
