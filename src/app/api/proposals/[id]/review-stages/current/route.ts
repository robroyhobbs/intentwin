import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, checkProposalAccess } from "@/lib/supabase/auth-api";
import { ReviewStageStatus } from "@/lib/constants/statuses";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await checkProposalAccess(context, id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
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
      console.error("Fetch current stage error:", error);
      return NextResponse.json({ error: "Failed to fetch current stage" }, { status: 500 });
    }

    return NextResponse.json({ stage: stage || null });
  } catch (error) {
    console.error("Fetch current stage error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
