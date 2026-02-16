import { NextRequest, NextResponse } from "next/server";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { generateProposal } from "@/lib/ai/pipeline";
import { rateLimitCheck, AI_GENERATION_LIMIT } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limit: AI generation is expensive
    const blocked = rateLimitCheck(request, AI_GENERATION_LIMIT);
    if (blocked) return blocked;

    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to this proposal (organization check)
    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    if (proposal.status === "generating") {
      return NextResponse.json(
        { error: "Proposal is already being generated" },
        { status: 409 }
      );
    }

    // Trigger generation in the background
    generateProposal(id).catch((err) => {
      console.error(`Generation failed for proposal ${id}:`, err);
    });

    return NextResponse.json({
      status: "generating",
      proposalId: id,
      message: "Proposal generation started.",
    });
  } catch (error) {
    console.error("Generate proposal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
