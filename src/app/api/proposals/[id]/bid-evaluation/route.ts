import { NextRequest } from "next/server";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import {
  scoreBidOpportunity,
  saveBidDecision,
  type FactorKey,
} from "@/lib/ai/bid-scoring";
import { checkFeature } from "@/lib/features/check-feature";
import { unauthorized, notFound, badRequest, ok, serverError, forbidden } from "@/lib/api/response";

/** AI scoring call + L1 context fetch */
export const maxDuration = 120;

/**
 * POST /api/proposals/[id]/bid-evaluation
 * Trigger AI bid/no-bid scoring for a proposal.
 * Requires RFP extraction to be complete.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    // Feature gate: bid_evaluation requires Pro+
    const canEvaluate = await checkFeature(context.organizationId, "bid_evaluation");
    if (!canEvaluate) {
      return forbidden("AI bid evaluation requires a Pro plan or above. Upgrade at /pricing.");
    }

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return notFound("Proposal not found");
    }

    // Verify extraction is complete
    if (!proposal.rfp_extracted_requirements) {
      return badRequest("RFP extraction must complete before bid evaluation");
    }

    const evaluation = await scoreBidOpportunity(id);

    return ok({
      status: "scored",
      evaluation,
    });
  } catch (error) {
    return serverError("Bid evaluation scoring failed. Please try again.", error);
  }
}

/**
 * PATCH /api/proposals/[id]/bid-evaluation
 * Save user's proceed/skip decision and optional score overrides.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return notFound("Proposal not found");
    }

    const body = await request.json();
    const { user_decision, user_scores } = body;

    // Validate user_decision
    if (!user_decision || !["proceed", "skip"].includes(user_decision)) {
      return badRequest('user_decision must be "proceed" or "skip"');
    }

    // Validate user_scores if provided
    if (user_scores && typeof user_scores === "object") {
      const validKeys: FactorKey[] = [
        "requirement_match",
        "past_performance",
        "capability_alignment",
        "timeline_feasibility",
        "strategic_value",
      ];
      for (const [key, value] of Object.entries(user_scores)) {
        if (!validKeys.includes(key as FactorKey)) {
          return badRequest(`Invalid factor key: ${key}`);
        }
        if (typeof value !== "number" || value < 0 || value > 100) {
          return badRequest(`Score for ${key} must be a number between 0 and 100`);
        }
      }
    }

    const evaluation = await saveBidDecision(
      id,
      user_decision,
      user_scores || undefined,
    );

    return ok({
      status: "saved",
      evaluation,
    });
  } catch (error) {
    return serverError("Failed to save bid decision", error);
  }
}
