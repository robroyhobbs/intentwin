import { createAdminClient } from "@/lib/supabase/admin";
import { sendReviewerAssignedEmail } from "@/lib/email/review-notifications";
import { withProposalRoute, notFound, badRequest, conflict, ok, serverError, created } from "@/lib/api/response";

/**
 * GET /api/proposals/[id]/review-stages/[stageId]/reviewers
 * List all reviewers assigned to a review stage
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

  // Get reviewers with profile info
  const { data: reviewers, error } = await adminClient
    .from("stage_reviewers")
    .select("id, reviewer_id, status, assigned_at, completed_at")
    .eq("stage_id", stageId)
    .eq("organization_id", context.organizationId)
    .order("assigned_at", { ascending: true });

  if (error) {
    return serverError("Failed to fetch reviewers", error);
  }

  // Batch fetch all reviewer profiles in a single query (avoids N+1)
  const reviewerIds = (reviewers || []).map((r) => r.reviewer_id);
  const { data: profiles } = reviewerIds.length > 0
    ? await adminClient
        .from("profiles")
        .select("id, full_name, email")
        .in("id", reviewerIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] };

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, p]),
  );

  const enrichedReviewers = (reviewers || []).map((reviewer) => {
    const profile = profileMap.get(reviewer.reviewer_id);
    return {
      ...reviewer,
      full_name: profile?.full_name || null,
      email: profile?.email || null,
    };
  });

  return ok({ reviewers: enrichedReviewers });
}, { requireFullProposal: true });

/**
 * POST /api/proposals/[id]/review-stages/[stageId]/reviewers
 * Assign a reviewer to a review stage
 */
export const POST = withProposalRoute(async (request, { id, stageId }, context, proposal) => {
  const body = await request.json();
  const { reviewer_id } = body;

  if (!reviewer_id) {
    return badRequest("reviewer_id is required");
  }

  const adminClient = createAdminClient();

  // Verify stage exists and belongs to this proposal/org
  const { data: stageRecord, error: stageError } = await adminClient
    .from("proposal_review_stages")
    .select("id, stage")
    .eq("id", stageId)
    .eq("proposal_id", id)
    .eq("organization_id", context.organizationId)
    .single();

  if (stageError || !stageRecord) {
    return notFound("Review stage not found");
  }

  // Validate reviewer is an org member
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", reviewer_id)
    .eq("organization_id", context.organizationId)
    .single();

  if (profileError || !profile) {
    return notFound("Reviewer not found in your organization");
  }

  // Insert reviewer assignment
  const { data: reviewer, error: insertError } = await adminClient
    .from("stage_reviewers")
    .insert({
      stage_id: stageId,
      organization_id: context.organizationId,
      reviewer_id: reviewer_id,
    })
    .select("id, reviewer_id, status, assigned_at, completed_at")
    .single();

  if (insertError) {
    // Check for unique constraint violation (already assigned)
    if (insertError.code === "23505") {
      return conflict("Reviewer is already assigned to this stage");
    }
    return serverError("Failed to assign reviewer", insertError);
  }

  // Send assignment email notification (fire-and-forget)
  sendReviewerAssignedEmail({
    reviewerEmail: profile.email || "",
    reviewerName: profile.full_name || "",
    proposalTitle: (proposal as { title?: string }).title || "Untitled",
    proposalId: id,
    stage: stageRecord.stage,
  }).catch(() => {});

  return created({
    reviewer: {
      ...reviewer,
      full_name: profile.full_name,
      email: profile.email,
    },
  });
}, { requireFullProposal: true });
