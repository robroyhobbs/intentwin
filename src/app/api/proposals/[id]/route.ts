import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyProposalAccess, checkProposalAccess } from "@/lib/supabase/auth-api";
import { unauthorized, notFound, ok, serverError } from "@/lib/api/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    // Verify user has access to this proposal (organization check)
    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return notFound("Proposal not found");
    }

    // Fetch sections
    const adminClient = createAdminClient();
    const { data: sections } = await adminClient
      .from("proposal_sections")
      .select("id, proposal_id, section_type, section_order, title, generated_content, edited_content, is_edited, generation_status, generation_error, review_status, review_notes, diagram_image, created_at, updated_at")
      .eq("proposal_id", id)
      .order("section_order", { ascending: true });

    return ok({ proposal, sections: sections || [] });
  } catch (error) {
    return serverError("Failed to fetch proposal", error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    // Lightweight access check — PATCH doesn't need proposal data
    const hasAccess = await checkProposalAccess(context, id);
    if (!hasAccess) {
      return notFound("Proposal not found");
    }

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
  } catch (error) {
    return serverError("Failed to update proposal", error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    // Lightweight access check — DELETE doesn't need proposal data
    const hasAccess = await checkProposalAccess(context, id);
    if (!hasAccess) {
      return notFound("Proposal not found");
    }

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
  } catch (error) {
    return serverError("Failed to delete proposal", error);
  }
}
