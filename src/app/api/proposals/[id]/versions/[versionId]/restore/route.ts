import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, checkProposalAccess } from "@/lib/supabase/auth-api";

/**
 * POST /api/proposals/[id]/versions/[versionId]/restore
 * Restore a proposal to a previous version
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify proposal belongs to user's organization
    const hasAccess = await checkProposalAccess(context, id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const supabase = createAdminClient();

    // Verify the version exists and belongs to this proposal
    const { data: version } = await supabase
      .from("proposal_versions")
      .select("id, proposal_id, version_number, label")
      .eq("id", versionId)
      .eq("proposal_id", id)
      .single();

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Call the restore function
    const { data: _data, error } = await supabase.rpc("restore_proposal_version", {
      p_version_id: versionId,
      p_user_id: context.user.id,
    });

    if (error) {
      console.error("Error restoring version:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch the updated proposal
    const { data: updatedProposal } = await supabase
      .from("proposals")
      .select("id, title, status, intake_data, outcome_contract, created_at, updated_at")
      .eq("id", id)
      .single();

    return NextResponse.json({
      success: true,
      message: `Restored to version ${version.version_number}${version.label ? ` (${version.label})` : ""}`,
      proposal: updatedProposal,
    });
  } catch (error) {
    console.error("Version restore error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
