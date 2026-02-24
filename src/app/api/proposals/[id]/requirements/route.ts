import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { badRequest, serverError, ok, created, notFound, withProposalRoute } from "@/lib/api/response";
import { ComplianceStatus, COMPLIANCE_STATUSES } from "@/lib/constants/statuses";

const VALID_CATEGORIES = ["mandatory", "desirable", "informational"] as const;
const VALID_REQUIREMENT_TYPES = ["content", "format", "submission", "certification"] as const;

/**
 * GET /api/proposals/[id]/requirements
 * List all requirements for a proposal, ordered by category priority then created_at
 */
export const GET = withProposalRoute(
  async (_request, { id }, context) => {
    const adminClient = createAdminClient();
    const { data: requirements, error } = await adminClient
      .from("proposal_requirements")
      .select("id, requirement_text, source_reference, category, requirement_type, compliance_status, mapped_section_id, notes, is_extracted, created_at, updated_at")
      .eq("proposal_id", id)
      .eq("organization_id", context.organizationId)
      .limit(500)
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

    // Compute summary with type breakdown
    const reqTypes = ["content", "format", "submission", "certification"] as const;
    const byType: Record<string, { total: number; met: number; gaps: number }> = {};
    for (const t of reqTypes) {
      const ofType = sorted.filter(r => (r.requirement_type || "content") === t);
      byType[t] = {
        total: ofType.length,
        met: ofType.filter(r => r.compliance_status === ComplianceStatus.MET || r.compliance_status === ComplianceStatus.NOT_APPLICABLE).length,
        gaps: ofType.filter(r => r.category === "mandatory" && r.compliance_status === ComplianceStatus.NOT_ADDRESSED).length,
      };
    }

    const summary = {
      total: sorted.length,
      met: sorted.filter(r => r.compliance_status === ComplianceStatus.MET).length,
      partially_met: sorted.filter(r => r.compliance_status === ComplianceStatus.PARTIALLY_MET).length,
      not_addressed: sorted.filter(r => r.compliance_status === ComplianceStatus.NOT_ADDRESSED).length,
      not_applicable: sorted.filter(r => r.compliance_status === ComplianceStatus.NOT_APPLICABLE).length,
      mandatory_gaps: sorted.filter(r => r.category === "mandatory" && r.compliance_status === ComplianceStatus.NOT_ADDRESSED).length,
      by_type: byType,
    };

    return ok({ requirements: sorted, summary });
  },
);

/**
 * POST /api/proposals/[id]/requirements
 * Create a new requirement (manual add)
 */
export const POST = withProposalRoute(
  async (request, { id }, context) => {
    const body = await request.json();
    const { requirement_text, source_reference, category, requirement_type, mapped_section_id, notes } = body;

    if (!requirement_text || typeof requirement_text !== "string" || !requirement_text.trim()) {
      return badRequest("requirement_text is required");
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return badRequest(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }

    if (requirement_type && !VALID_REQUIREMENT_TYPES.includes(requirement_type)) {
      return badRequest(`Invalid requirement_type. Must be one of: ${VALID_REQUIREMENT_TYPES.join(", ")}`);
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
        requirement_type: requirement_type || "content",
        mapped_section_id: mapped_section_id || null,
        notes: notes || null,
        is_extracted: false,
      })
      .select("id, requirement_text, source_reference, category, requirement_type, compliance_status, mapped_section_id, notes, is_extracted, created_at, updated_at")
      .single();

    if (error) {
      return serverError("Failed to create requirement", error);
    }

    return created({ requirement });
  },
);

/**
 * PATCH /api/proposals/[id]/requirements
 * Batch update requirements (status changes, notes, mapping)
 */
export const PATCH = withProposalRoute(
  async (request, { id: _id }, context) => {
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
      if (update.compliance_status && !COMPLIANCE_STATUSES.includes(update.compliance_status)) {
        return badRequest(`Invalid compliance_status. Must be one of: ${COMPLIANCE_STATUSES.join(", ")}`);
      }
      if (update.category && !VALID_CATEGORIES.includes(update.category)) {
        return badRequest(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`);
      }
      if (update.requirement_type && !VALID_REQUIREMENT_TYPES.includes(update.requirement_type)) {
        return badRequest(`Invalid requirement_type. Must be one of: ${VALID_REQUIREMENT_TYPES.join(", ")}`);
      }
    }

    const adminClient = createAdminClient();
    const selectFields = "id, requirement_text, source_reference, category, requirement_type, compliance_status, mapped_section_id, notes, is_extracted, created_at, updated_at";
    const now = new Date().toISOString();

    // Process updates individually — batch sizes are typically 1-5, so N+1 is negligible
    const results: Record<string, unknown>[] = [];
    for (const update of updates) {
      const { id: reqId, ...fields } = update;
      const updateData: Record<string, unknown> = { updated_at: now };

      if (fields.compliance_status) updateData.compliance_status = fields.compliance_status;
      if (fields.category) updateData.category = fields.category;
      if (fields.requirement_type) updateData.requirement_type = fields.requirement_type;
      if (fields.mapped_section_id !== undefined) updateData.mapped_section_id = fields.mapped_section_id || null;
      if (fields.notes !== undefined) updateData.notes = fields.notes || null;
      if (fields.requirement_text) updateData.requirement_text = fields.requirement_text;

      const { data, error } = await adminClient
        .from("proposal_requirements")
        .update(updateData)
        .eq("id", reqId)
        .eq("organization_id", context.organizationId)
        .select(selectFields)
        .single();

      if (error) {
        return serverError(`Failed to update requirements ${reqId}`, error);
      }

      if (data) {
        results.push(data);
      }
    }

    return ok({ requirements: results });
  },
);

/**
 * DELETE /api/proposals/[id]/requirements
 * Delete a requirement by ID (passed as query param ?reqId=xxx)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // DELETE uses request.nextUrl which requires NextRequest — keep manual pattern
  // but still use the same auth + access flow
  try {
    const { getUserContext, checkProposalAccess } = await import("@/lib/supabase/auth-api");
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return (await import("@/lib/api/response")).unauthorized();
    }

    const hasAccess = await checkProposalAccess(context, id);
    if (!hasAccess) {
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
