import { createAdminClient } from "@/lib/supabase/admin";
import { serverError, ok, created, conflict, withProposalRoute } from "@/lib/api/response";
import { ReviewStageStatus } from "@/lib/constants/statuses";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/proposals/[id]/review-stages
 * List all review stages for a proposal with reviewer counts and status
 */
export const GET = withProposalRoute(
  async (_request, { id }, context) => {
    const adminClient = createAdminClient();
    const { data: stages, error } = await adminClient
      .from("proposal_review_stages")
      .select("id, proposal_id, organization_id, stage, stage_order, status, started_at, completed_at, completed_by, created_at")
      .eq("proposal_id", id)
      .eq("organization_id", context.organizationId)
      .order("stage_order", { ascending: true });

    if (error) {
      logger.error("Fetch review stages error", error);
      return serverError("Failed to fetch review stages", error);
    }

    // Fetch all reviewers for all stages in a single query (eliminates N+1)
    const stageIds = (stages || []).map((s) => s.id);
    const { data: allReviewers } = stageIds.length > 0
      ? await adminClient
          .from("stage_reviewers")
          .select("id, status, stage_id")
          .in("stage_id", stageIds)
      : { data: [] };

    // Group reviewers by stage_id
    const reviewersByStage = new Map<string, { id: string; status: string }[]>();
    for (const r of allReviewers || []) {
      const list = reviewersByStage.get(r.stage_id) || [];
      list.push(r);
      reviewersByStage.set(r.stage_id, list);
    }

    const stagesWithReviewers = (stages || []).map((stage) => {
      const reviewers = reviewersByStage.get(stage.id) || [];
      const statusBreakdown: Record<string, number> = {};
      for (const r of reviewers) {
        statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
      }
      return {
        ...stage,
        reviewerCount: reviewers.length,
        reviewerStatusBreakdown: statusBreakdown,
      };
    });

    const currentStage = stagesWithReviewers.find((s) => s.status === ReviewStageStatus.ACTIVE) || null;

    return ok({ stages: stagesWithReviewers, currentStage });
  },
);

/**
 * POST /api/proposals/[id]/review-stages
 * Initialize all 4 color team review stages for a proposal
 */
export const POST = withProposalRoute(
  async (_request, { id }, context) => {
    const adminClient = createAdminClient();

    // Check if stages already exist
    const { data: existing, error: checkError } = await adminClient
      .from("proposal_review_stages")
      .select("id")
      .eq("proposal_id", id)
      .eq("organization_id", context.organizationId)
      .limit(1);

    if (checkError) {
      logger.error("Check existing stages error", checkError);
      return serverError("Failed to check existing stages", checkError);
    }

    if (existing && existing.length > 0) {
      return conflict("Review stages already exist for this proposal");
    }

    const now = new Date().toISOString();

    // Insert all 4 stages: pink (active), red, gold, white (all pending)
    const { data: stages, error: insertError } = await adminClient
      .from("proposal_review_stages")
      .insert([
        {
          proposal_id: id,
          organization_id: context.organizationId,
          stage: "pink",
          stage_order: 1,
          status: ReviewStageStatus.ACTIVE,
          started_at: now,
        },
        {
          proposal_id: id,
          organization_id: context.organizationId,
          stage: "red",
          stage_order: 2,
          status: ReviewStageStatus.PENDING,
        },
        {
          proposal_id: id,
          organization_id: context.organizationId,
          stage: "gold",
          stage_order: 3,
          status: ReviewStageStatus.PENDING,
        },
        {
          proposal_id: id,
          organization_id: context.organizationId,
          stage: "white",
          stage_order: 4,
          status: ReviewStageStatus.PENDING,
        },
      ])
      .select("id, proposal_id, organization_id, stage, stage_order, status, started_at, completed_at, completed_by, created_at")
      .order("stage_order", { ascending: true });

    if (insertError) {
      logger.error("Insert review stages error", insertError);
      return serverError("Failed to create review stages", insertError);
    }

    return created({ stages: stages || [] });
  },
);
