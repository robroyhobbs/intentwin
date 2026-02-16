import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { unauthorized, notFound, serverError, ok } from "@/lib/api/response";

/**
 * GET /api/proposals/[id]/versions/[versionId]
 * Get a specific version with full section content
 */
export async function GET(
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
    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return notFound("Proposal not found");
    }

    const supabase = createAdminClient();

    // Get the version
    const { data: version, error: versionError } = await supabase
      .from("proposal_versions")
      .select("*")
      .eq("id", versionId)
      .eq("proposal_id", id)
      .single();

    if (versionError || !version) {
      return notFound("Version not found");
    }

    // Get sections for this version
    const { data: sections } = await supabase
      .from("section_versions")
      .select("*")
      .eq("proposal_version_id", versionId)
      .order("section_order", { ascending: true });

    return ok({
      version: {
        ...version,
        sections: sections || [],
      },
    });
  } catch (error) {
    return serverError("Failed to get version", error);
  }
}

/**
 * PATCH /api/proposals/[id]/versions/[versionId]
 * Update version metadata (label, change_summary)
 */
export async function PATCH(
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
    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return notFound("Proposal not found");
    }

    const body = await request.json();
    const { label, change_summary } = body;

    const supabase = createAdminClient();

    // Update the version
    const updateData: Record<string, string | null> = {};
    if (label !== undefined) updateData.label = label;
    if (change_summary !== undefined) updateData.change_summary = change_summary;

    const { data: version, error } = await supabase
      .from("proposal_versions")
      .update(updateData)
      .eq("id", versionId)
      .eq("proposal_id", id)
      .select()
      .single();

    if (error) {
      return serverError("Failed to update version", error);
    }

    return ok({ version });
  } catch (error) {
    return serverError("Failed to update version", error);
  }
}
