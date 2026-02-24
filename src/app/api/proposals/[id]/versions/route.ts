import { createAdminClient } from "@/lib/supabase/admin";
import { serverError, ok, created, withProposalRoute } from "@/lib/api/response";

/**
 * GET /api/proposals/[id]/versions
 * List all versions of a proposal
 */
export const GET = withProposalRoute(
  async (_request, { id }, _context) => {
    const supabase = createAdminClient();

    // Get all versions with section counts (capped at 100 for safety)
    const { data: versions, error } = await supabase
      .from("proposal_versions")
      .select(`
        id, proposal_id, version_number, title, status, trigger_event, change_summary, label, created_by, created_at,
        section_versions(count)
      `)
      .eq("proposal_id", id)
      .order("version_number", { ascending: false })
      .limit(100);

    if (error) {
      return serverError("Failed to fetch versions", error);
    }

    // Transform to include section count
    const versionsWithCount = versions?.map((v) => ({
      ...v,
      section_count: v.section_versions?.[0]?.count || 0,
      section_versions: undefined,
    }));

    return ok({ versions: versionsWithCount || [] });
  },
);

/**
 * POST /api/proposals/[id]/versions
 * Create a new version (manual save)
 */
export const POST = withProposalRoute(
  async (request, { id }, context) => {
    const body = await request.json();
    const { change_summary, label } = body;

    const supabase = createAdminClient();

    // Create version using the database function
    const { data, error } = await supabase.rpc("create_proposal_version", {
      p_proposal_id: id,
      p_trigger_event: "manual_save",
      p_change_summary: change_summary || null,
      p_label: label || null,
      p_user_id: context.user.id,
    });

    if (error) {
      return serverError("Failed to create version", error);
    }

    // Fetch the created version
    const { data: version } = await supabase
      .from("proposal_versions")
      .select("id, proposal_id, version_number, title, intake_data, outcome_contract, status, trigger_event, change_summary, label, created_by, created_at")
      .eq("id", data)
      .single();

    return created({ version });
  },
);
