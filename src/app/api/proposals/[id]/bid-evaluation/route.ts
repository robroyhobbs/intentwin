import { NextRequest, NextResponse } from "next/server";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import {
  scoreBidOpportunity,
  saveBidDecision,
  type FactorKey,
} from "@/lib/ai/bid-scoring";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 },
      );
    }

    // Verify extraction is complete
    if (!proposal.rfp_extracted_requirements) {
      return NextResponse.json(
        { error: "RFP extraction must complete before bid evaluation" },
        { status: 400 },
      );
    }

    const evaluation = await scoreBidOpportunity(id);

    return NextResponse.json({
      status: "scored",
      evaluation,
    });
  } catch (error) {
    console.error("Bid evaluation scoring failed:", error);
    return NextResponse.json(
      { error: "Bid evaluation scoring failed. Please try again." },
      { status: 500 },
    );
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { user_decision, user_scores } = body;

    // Validate user_decision
    if (!user_decision || !["proceed", "skip"].includes(user_decision)) {
      return NextResponse.json(
        { error: 'user_decision must be "proceed" or "skip"' },
        { status: 400 },
      );
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
          return NextResponse.json(
            { error: `Invalid factor key: ${key}` },
            { status: 400 },
          );
        }
        if (typeof value !== "number" || value < 0 || value > 100) {
          return NextResponse.json(
            {
              error: `Score for ${key} must be a number between 0 and 100`,
            },
            { status: 400 },
          );
        }
      }
    }

    const evaluation = await saveBidDecision(
      id,
      user_decision,
      user_scores || undefined,
    );

    return NextResponse.json({
      status: "saved",
      evaluation,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save bid decision";
    console.error("Bid decision save failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
