import { NextRequest, NextResponse, after } from "next/server";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { createAdminClient } from "@/lib/supabase/admin";
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

    // Atomic guard: only one generation at a time.
    // Uses UPDATE ... WHERE status != 'generating' as a database-level mutex.
    const adminClient = createAdminClient();
    const { data: claimed, error: claimError } = await adminClient
      .from("proposals")
      .update({
        status: "generating",
        generation_started_at: new Date().toISOString(),
      })
      .eq("id", id)
      .neq("status", "generating")
      .select("id")
      .maybeSingle();

    if (claimError) {
      console.error("Generation claim error:", claimError);
      return NextResponse.json(
        { error: "Failed to start generation" },
        { status: 500 }
      );
    }

    if (!claimed) {
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
        // Cleanup: reset proposal and stuck sections so user can retry
        try {
          const cleanup = createAdminClient();
          await cleanup
            .from("proposals")
            .update({ status: "draft" })
            .eq("id", id)
            .eq("status", "generating");

          await cleanup
            .from("proposal_sections")
            .update({
              generation_status: "failed",
              generation_error: "Generation process terminated unexpectedly",
            })
            .eq("proposal_id", id)
            .in("generation_status", ["generating", "pending"]);
        } catch (cleanupErr) {
          console.error(`Cleanup failed for proposal ${id}:`, cleanupErr);
        }
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
