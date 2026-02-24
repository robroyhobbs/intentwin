import { NextRequest } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { scoreFromRequirements } from "@/lib/ai/bid-scoring";
import { unauthorized, badRequest, ok, serverError } from "@/lib/api/response";
import { logger } from "@/lib/utils/logger";

/** AI scoring call + L1 context fetch */
export const maxDuration = 120;

/**
 * POST /api/intake/bid-evaluation
 * Score extracted RFP requirements during intake (before proposal creation).
 * Returns 5-factor AI scores with rationale and recommendation.
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    const body = await request.json();
    const { rfp_requirements, service_line, industry } = body;

    if (!rfp_requirements || typeof rfp_requirements !== "object") {
      return badRequest("rfp_requirements object is required");
    }

    // Log the scoring attempt for debugging
    const rfpFieldCount = Object.keys(rfp_requirements).filter(
      (k) => rfp_requirements[k] != null && rfp_requirements[k] !== "",
    ).length;
    logger.info("Bid evaluation scoring started", {
      orgId: context.organizationId,
      rfpFieldCount,
      hasServiceLine: !!service_line,
      hasIndustry: !!industry,
      hasSourceText: !!rfp_requirements.source_text,
    });

    const evaluation = await scoreFromRequirements(
      rfp_requirements,
      context.organizationId,
      service_line,
      industry,
    );

    logger.info("Bid evaluation scoring completed", {
      orgId: context.organizationId,
      weightedTotal: evaluation.weighted_total,
      recommendation: evaluation.recommendation,
    });

    return ok({
      status: "scored",
      evaluation,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Bid evaluation scoring failed", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack?.slice(0, 500) : undefined,
    });
    return serverError(
      `Bid evaluation failed: ${errorMessage.slice(0, 200)}`,
      error,
    );
  }
}
