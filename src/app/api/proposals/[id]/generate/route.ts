import { NextRequest } from "next/server";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import { ProposalStatus } from "@/lib/constants/statuses";
import { fetchL1Context } from "@/lib/ai/pipeline/context";
import { runPreflightCheck, type PreflightResult } from "@/lib/ai/pipeline/preflight";
import type { BidEvaluation } from "@/lib/ai/bid-scoring";
import { logger } from "@/lib/utils/logger";
import { unauthorized, notFound, conflict, ok, serverError } from "@/lib/api/response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    // Verify user has access to this proposal (organization check)
    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return notFound("Proposal not found");
    }

    // ── Pre-flight readiness check (fail-open) ───────────────────────────
    // Runs before generation to surface data gaps. Never blocks generation.
    let preflight: PreflightResult | null = null;
    try {
      const intakeData = (proposal.intake_data as Record<string, unknown>) || {};
      const serviceLine = intakeData.service_line as string | undefined;
      const industry = intakeData.client_industry as string | undefined;
      const adminClient = createAdminClient();
      const l1Context = await fetchL1Context(
        adminClient,
        serviceLine,
        industry,
        context.organizationId,
      );
      const requirements =
        (proposal.rfp_extracted_requirements as Record<string, unknown>[] | null) ?? null;
      const bidEvaluation = (proposal.bid_evaluation as BidEvaluation | null) ?? null;
      preflight = runPreflightCheck(l1Context, intakeData, requirements, bidEvaluation);
    } catch (preflightError) {
      // Fail-open: log and continue without preflight data
      logger.warn("Preflight check failed (non-blocking)", {
        error: preflightError instanceof Error ? preflightError.message : String(preflightError),
      });
    }

    // Atomic guard: only one generation at a time.
    // Uses UPDATE ... WHERE status != 'generating' as a database-level mutex.
    const adminClientForClaim = createAdminClient();
    const { data: claimed, error: claimError } = await adminClientForClaim
      .from("proposals")
      .update({
        status: ProposalStatus.GENERATING,
        generation_started_at: new Date().toISOString(),
      })
      .eq("id", id)
      .neq("status", ProposalStatus.GENERATING)
      .select("id")
      .maybeSingle();

    if (claimError) {
      logger.error("Generation claim error", claimError);
      return serverError("Failed to start generation");
    }

    if (!claimed) {
      return conflict("Proposal is already being generated");
    }

    // Send event to Inngest for durable background execution.
    // Inngest handles retries, timeouts, and step-level persistence.
    await inngest.send({
      name: "proposal/generate.requested",
      data: { proposalId: id },
    });

    return ok({
      status: ProposalStatus.GENERATING,
      proposalId: id,
      message: "Proposal generation started.",
      preflight: preflight ?? undefined,
    });
  } catch (error) {
    return serverError("Failed to start generation", error);
  }
}
