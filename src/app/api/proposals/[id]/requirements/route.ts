import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { unauthorized, notFound, badRequest, serverError, ok, created } from "@/lib/api/response";

const VALID_CATEGORIES = ["mandatory", "desirable", "informational"] as const;
const VALID_STATUSES = ["met", "partially_met", "not_addressed", "not_applicable"] as const;

/**
 * GET /api/proposals/[id]/requirements
 * List all requirements for a proposal, ordered by category priority then created_at
 */
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

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return notFound("Proposal not found");
    }

    const adminClient = createAdminClient();
    const { data: requirements, error } = await adminClient
      .from("proposal_requirements")
      .select("id, requirement_text, source_reference, category, compliance_status, mapped_section_id, notes, is_extracted, created_at, updated_at")
      .eq("proposal_id", id)
      .eq("organization_id", context.organizationId)
      .order("created_at", { ascending: true });

    if (error) {
      return serverError("Failed to fetch requirements", error);
    }

    // Sort by category priority: mandatory first, then desirable, then informational
    const categoryOrder: Record<string, number> = { mandatory: 0, desirable: 1, informational: 2 };
    const sorted = (requirements || []).sort((a, b) => {
      const catDiff = (categoryOrder[a.category] ?? 2) - (categoryOrder[b.category] ?? 2);
      if (catDiff !== 0) return catDiff;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // Compute summary
    const summary = {
      total: sorted.length,
      met: sorted.filter(r => r.compliance_status === "met").length,
      partially_met: sorted.filter(r => r.compliance_status === "partially_met").length,
      not_addressed: sorted.filter(r => r.compliance_status === "not_addressed").length,
      not_applicable: sorted.filter(r => r.compliance_status === "not_applicable").length,
      mandatory_gaps: sorted.filter(r => r.category === "mandatory" && r.compliance_status === "not_addressed").length,
    };

    return ok({ requirements: sorted, summary });
  } catch (error) {
    return serverError("Failed to fetch requirements", error);
  }
}

/**
 * POST /api/proposals/[id]/requirements
 * Create a new requirement (manual add)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return notFound("Proposal not found");
    }

    const body = await request.json();
    const { requirement_text, source_reference, category, mapped_section_id, notes } = body;

    if (!requirement_text || typeof requirement_text !== "string" || !requirement_text.trim()) {
      return badRequest("requirement_text is required");
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return badRequest(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }

    const adminClient = createAdminClient();
    const { data: requirement, error } = await adminClient
      .from("proposal_requirements")
      .insert({
        proposal_id: id,
        organization_id: context.organizationId,
        requirement_text: requirement_text.trim(),
        source_reference: source_reference || null,
        category: category || "desirable",
        mapped_section_id: mapped_section_id || null,
        notes: notes || null,
        is_extracted: false,
      })
      .select("id, requirement_text, source_reference, category, compliance_status, mapped_section_id, notes, is_extracted, created_at, updated_at")
      .single();

    if (error) {
      return serverError("Failed to create requirement", error);
    }

    return created({ requirement });
  } catch (error) {
    return serverError("Failed to create requirement", error);
  }
}

/**
 * PATCH /api/proposals/[id]/requirements
 * Batch update requirements (status changes, notes, mapping)
 */
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

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return notFound("Proposal not found");
    }

    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates)) {
      return badRequest("updates must be an array");
    }

    // Validate all updates before applying
    for (const update of updates) {
      if (!update.id) {
        return badRequest("Each update must have an id");
      }
      if (update.compliance_status && !VALID_STATUSES.includes(update.compliance_status)) {
        return badRequest(`Invalid compliance_status. Must be one of: ${VALID_STATUSES.join(", ")}`);
      }
      if (update.category && !VALID_CATEGORIES.includes(update.category)) {
        return badRequest(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`);
      }
    }

    const adminClient = createAdminClient();
    const results = [];

    for (const update of updates) {
      const { id: reqId, ...fields } = update;
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (fields.compliance_status) updateData.compliance_status = fields.compliance_status;
      if (fields.category) updateData.category = fields.category;
      if (fields.mapped_section_id !== undefined) updateData.mapped_section_id = fields.mapped_section_id || null;
      if (fields.notes !== undefined) updateData.notes = fields.notes || null;
      if (fields.requirement_text) updateData.requirement_text = fields.requirement_text;

      const { data, error } = await adminClient
        .from("proposal_requirements")
        .update(updateData)
        .eq("id", reqId)
        .eq("organization_id", context.organizationId)
        .select("id, requirement_text, source_reference, category, compliance_status, mapped_section_id, notes, is_extracted, created_at, updated_at")
        .single();

      if (error) {
        return serverError(`Failed to update requirement ${reqId}`, error);
      }

      results.push(data);
    }

    return ok({ requirements: results });
  } catch (error) {
    return serverError("Failed to update requirements", error);
  }
}

/**
 * DELETE /api/proposals/[id]/requirements
 * Delete a requirement by ID (passed as query param ?reqId=xxx)
 */
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

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return notFound("Proposal not found");
    }

    const reqId = request.nextUrl.searchParams.get("reqId");
    if (!reqId) {
      return badRequest("reqId query parameter is required");
    }

    const adminClient = createAdminClient();

    // Verify requirement exists and belongs to this org
    const { data: existing } = await adminClient
      .from("proposal_requirements")
      .select("id")
      .eq("id", reqId)
      .eq("organization_id", context.organizationId)
      .single();

    if (!existing) {
      return notFound("Requirement not found");
    }

    const { error } = await adminClient
      .from("proposal_requirements")
      .delete()
      .eq("id", reqId)
      .eq("organization_id", context.organizationId);

    if (error) {
      return serverError("Failed to delete requirement", error);
    }

    return ok({ deleted: true });
  } catch (error) {
    return serverError("Failed to delete requirement", error);
  }
}
