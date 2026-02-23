import { NextRequest } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { scoreFromRequirements } from "@/lib/ai/bid-scoring";
import { unauthorized, badRequest, ok, serverError } from "@/lib/api/response";

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

    const evaluation = await scoreFromRequirements(
      rfp_requirements,
      context.organizationId,
      service_line,
      industry,
    );

    return ok({
      status: "scored",
      evaluation,
    });
  } catch (error) {
    return serverError("Bid evaluation scoring failed. Please try again.", error);
  }
}
