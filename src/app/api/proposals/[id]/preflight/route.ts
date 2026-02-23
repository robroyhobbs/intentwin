import { NextRequest, NextResponse } from "next/server";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchL1Context } from "@/lib/ai/pipeline/context";
import { runPreflightCheck } from "@/lib/ai/pipeline/preflight";
import type { BidEvaluation } from "@/lib/ai/bid-scoring";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/proposals/[id]/preflight
 *
 * Runs a pre-flight readiness check comparing RFP requirements against L1 data.
 * Returns gap analysis with actionable upload hints. Non-blocking — the UI can
 * show this alongside the "Generate" button.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 },
      );
    }

    const intakeData = (proposal.intake_data as Record<string, unknown>) || {};
    const serviceLine = intakeData.service_line as string | undefined;
    const industry = intakeData.client_industry as string | undefined;

    // Fetch L1 context (cached with 5-min TTL)
    const adminClient = createAdminClient();
    const l1Context = await fetchL1Context(
      adminClient,
      serviceLine,
      industry,
      context.organizationId,
    );

    // Fetch extracted requirements if available
    const requirements =
      (proposal.rfp_extracted_requirements as Record<string, unknown>[] | null) ?? null;

    // Pass bid evaluation for cross-referencing (may be null if not scored)
    const bidEvaluation = (proposal.bid_evaluation as BidEvaluation | null) ?? null;

    const result = runPreflightCheck(l1Context, intakeData, requirements, bidEvaluation);

    return NextResponse.json({
      proposalId: id,
      ...result,
    });
  } catch (error) {
    logger.error("Preflight check error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
