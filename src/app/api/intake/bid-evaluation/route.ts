import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { scoreFromRequirements } from "@/lib/ai/bid-scoring";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rfp_requirements, service_line, industry } = body;

    if (!rfp_requirements || typeof rfp_requirements !== "object") {
      return NextResponse.json(
        { error: "rfp_requirements object is required" },
        { status: 400 },
      );
    }

    const evaluation = await scoreFromRequirements(
      rfp_requirements,
      context.organizationId,
      service_line,
      industry,
    );

    return NextResponse.json({
      status: "scored",
      evaluation,
    });
  } catch (error) {
    console.error("Intake bid evaluation failed:", error);
    return NextResponse.json(
      { error: "Bid evaluation scoring failed. Please try again." },
      { status: 500 },
    );
  }
}
