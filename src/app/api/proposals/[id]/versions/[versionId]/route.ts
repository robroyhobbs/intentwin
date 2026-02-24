import { createAdminClient } from "@/lib/supabase/admin";
import { notFound, ok, serverError, withProposalRoute } from "@/lib/api/response";

/**
 * GET /api/proposals/[id]/versions/[versionId]
 * Get a specific version with full section content
 */
export const GET = withProposalRoute(
  async (_request, { id, versionId }) => {
    const supabase = createAdminClient();

    // Get the version
    const { data: version, error: versionError } = await supabase
      .from("proposal_versions")
      .select("id, proposal_id, version_number, title, intake_data, outcome_contract, status, trigger_event, change_summary, label, created_by, created_at")
      .eq("id", versionId)
      .eq("proposal_id", id)
      .single();

    if (versionError || !version) {
      return notFound("Version not found");
    }

    // Get sections for this version
    const { data: sections } = await supabase
      .from("section_versions")
      .select("id, proposal_version_id, original_section_id, title, section_type, section_order, generated_content, edited_content, generation_status, created_at")
      .eq("proposal_version_id", versionId)
      .order("section_order", { ascending: true });

    return ok({
      version: {
        ...version,
        sections: sections || [],
      },
    });
  },
);

/**
 * PATCH /api/proposals/[id]/versions/[versionId]
 * Update version metadata (label, change_summary)
 */
export const PATCH = withProposalRoute(
  async (request, { id, versionId }) => {
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
  },
);
