import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, checkProposalAccess } from "@/lib/supabase/auth-api";
import { ReviewStageStatus } from "@/lib/constants/statuses";
import { unauthorized, notFound, ok, serverError } from "@/lib/api/response";

/**
 * GET /api/proposals/[id]/review-stages/current
 * Get the current active review stage for a proposal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    const hasAccess = await checkProposalAccess(context, id);
    if (!hasAccess) {
      return notFound("Proposal not found");
    }

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
  } catch (error) {
    return serverError("Internal server error", error);
  }
}
