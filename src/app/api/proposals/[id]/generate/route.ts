import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/auth-api";
import { generateProposal } from "@/lib/ai/pipeline";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify proposal exists
    const adminClient = createAdminClient();
    const { data: proposal } = await adminClient
      .from("proposals")
      .select("id, status, intake_data")
      .eq("id", id)
      .single();

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
