import { createAdminClient } from "@/lib/supabase/admin";
import { ok, serverError, withProposalRoute } from "@/lib/api/response";

export const GET = withProposalRoute(
  async (_request, { id }, _context, proposal) => {
    // Fetch sections
    const adminClient = createAdminClient();
    const { data: sections } = await adminClient
      .from("proposal_sections")
      .select("id, proposal_id, section_type, section_order, title, generated_content, edited_content, is_edited, generation_status, generation_error, review_status, review_notes, diagram_image, created_at, updated_at")
      .eq("proposal_id", id)
      .order("section_order", { ascending: true });

    return ok({ proposal, sections: sections || [] });
  },
  { requireFullProposal: true },
);

export const PATCH = withProposalRoute(
  async (request, { id }, context) => {
    const body = await request.json();
    const { title, intake_data, win_strategy_data, status } = body;

    const updates: Record<string, unknown> = {};
    if (title) updates.title = title;
    if (intake_data) updates.intake_data = intake_data;
    if (win_strategy_data) updates.win_strategy_data = win_strategy_data;
    if (status) updates.status = status;

    const adminClient = createAdminClient();
    const { data: proposal, error } = await adminClient
      .from("proposals")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    if (error) {
      return serverError("Failed to update proposal", error);
    }

    return ok({ proposal });
  },
);

export const DELETE = withProposalRoute(
  async (_request, { id }, context) => {
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("proposals")
      .delete()
      .eq("id", id)
      .eq("organization_id", context.organizationId);

    if (error) {
      return serverError("Failed to delete proposal", error);
    }

    return ok({ success: true });
  },
);
