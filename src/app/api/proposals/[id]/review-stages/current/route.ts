import { createAdminClient } from "@/lib/supabase/admin";
import { ReviewStageStatus } from "@/lib/constants/statuses";
import { ok, serverError, withProposalRoute } from "@/lib/api/response";

/**
 * GET /api/proposals/[id]/review-stages/current
 * Get the current active review stage for a proposal
 */
export const GET = withProposalRoute(
  async (_request, { id }, context) => {
    const adminClient = createAdminClient();
    const { data: stage, error } = await adminClient
      .from("proposal_review_stages")
      .select("id, proposal_id, organization_id, stage, stage_order, status, started_at, completed_at, completed_by, created_at")
      .eq("proposal_id", id)
      .eq("organization_id", context.organizationId)
      .eq("status", ReviewStageStatus.ACTIVE)
      .maybeSingle();

    if (error) {
      return serverError("Failed to fetch current stage", error);
    }

    return ok({ stage: stage || null });
  },
);
