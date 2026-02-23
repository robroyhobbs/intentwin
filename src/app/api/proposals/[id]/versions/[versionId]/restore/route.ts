import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, checkProposalAccess } from "@/lib/supabase/auth-api";
import { unauthorized, notFound, ok, serverError } from "@/lib/api/response";

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
      return unauthorized();
    }

    // Verify proposal belongs to user's organization
    const hasAccess = await checkProposalAccess(context, id);
    if (!hasAccess) {
      return notFound("Proposal not found");
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
      return notFound("Version not found");
    }

    // Call the restore function
    const { data: _data, error } = await supabase.rpc("restore_proposal_version", {
      p_version_id: versionId,
      p_user_id: context.user.id,
    });

    if (error) {
      return serverError("Failed to restore version", error);
    }

    // Fetch the updated proposal
    const { data: updatedProposal } = await supabase
      .from("proposals")
      .select("id, title, status, intake_data, outcome_contract, created_at, updated_at")
      .eq("id", id)
      .single();

    return ok({
      success: true,
      message: `Restored to version ${version.version_number}${version.label ? ` (${version.label})` : ""}`,
      proposal: updatedProposal,
    });
  } catch (error) {
    return serverError("Internal server error", error);
  }
}
