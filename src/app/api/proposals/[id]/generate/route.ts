import { NextRequest, NextResponse, after } from "next/server";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { generateProposal } from "@/lib/ai/pipeline";

export const maxDuration = 300; // Generation runs in after() — needs full 5 min for 10 sections

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Run generation after response is sent (extends serverless function lifetime)
    after(async () => {
      try {
        await generateProposal(id);
      } catch (err) {
        console.error(`Generation failed for proposal ${id}:`, err);
      }
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
