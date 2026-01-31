import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/auth-api";

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
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Verify user owns this proposal
    const { data: proposal } = await supabase
      .from("proposals")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (proposal.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify the version exists and belongs to this proposal
    const { data: version } = await supabase
      .from("proposal_versions")
      .select("*")
      .eq("id", versionId)
      .eq("proposal_id", id)
      .single();

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Call the restore function
    const { data, error } = await supabase.rpc("restore_proposal_version", {
      p_version_id: versionId,
      p_user_id: user.id,
    });

    if (error) {
      console.error("Error restoring version:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch the updated proposal
    const { data: updatedProposal } = await supabase
      .from("proposals")
      .select("*")
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
