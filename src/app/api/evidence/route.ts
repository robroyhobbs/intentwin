import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { unauthorized, notFound, badRequest, serverError, ok, created } from "@/lib/api/response";
import { sanitizeTitle, sanitizeString } from "@/lib/security/sanitize";

const VALID_EVIDENCE_TYPES = [
  "case_study",
  "metric",
  "testimonial",
  "certification",
  "award",
] as const;

const VALID_CLIENT_SIZES = ["enterprise", "mid_market", "smb"] as const;

const SELECT_FIELDS =
  "id, evidence_type, title, summary, full_content, client_industry, service_line, client_size, outcomes_demonstrated, metrics, is_verified, verified_at, verification_notes, created_at";

/**
 * GET /api/evidence
 * List evidence for the current organization with optional filters
 * Filters: ?type=case_study&industry=healthcare&service_line=cloud&verified=true
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const { searchParams } = request.nextUrl;
    const typeFilter = searchParams.get("type");
    const industryFilter = searchParams.get("industry");
    const serviceLineFilter = searchParams.get("service_line");
    const verifiedFilter = searchParams.get("verified");

    // Validate type filter
    if (
      typeFilter &&
      !VALID_EVIDENCE_TYPES.includes(
        typeFilter as (typeof VALID_EVIDENCE_TYPES)[number]
      )
    ) {
      return badRequest(
        `Invalid type filter. Must be one of: ${VALID_EVIDENCE_TYPES.join(", ")}`
      );
    }

    // Validate verified filter
    if (verifiedFilter && verifiedFilter !== "true" && verifiedFilter !== "false") {
      return badRequest("verified filter must be 'true' or 'false'");
    }

    const adminClient = createAdminClient();
    let query = adminClient
      .from("evidence_library")
      .select(SELECT_FIELDS)
      .eq("organization_id", context.organizationId);

    if (typeFilter) {
      query = query.eq("evidence_type", typeFilter);
    }

    if (industryFilter) {
      query = query.or(
        `client_industry.eq.${industryFilter},client_industry.is.null`
      );
    }

    if (serviceLineFilter) {
      query = query.eq("service_line", serviceLineFilter);
    }

    if (verifiedFilter) {
      query = query.eq("is_verified", verifiedFilter === "true");
    }

    const { data: evidence, error } = await query.order("evidence_type").order("created_at", { ascending: false });

    if (error) {
      return serverError("Failed to fetch evidence", error);
    }

    return ok({ evidence: evidence || [] });
  } catch (error) {
    return serverError("Failed to fetch evidence", error);
  }
}

/**
 * POST /api/evidence
 * Create a new evidence entry
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const body = await request.json();
    const {
      evidence_type,
      title,
      summary,
      full_content,
      client_industry,
      service_line,
      client_size,
      outcomes_demonstrated,
      metrics,
    } = body;

    // Validate evidence_type
    if (
      !evidence_type ||
      !VALID_EVIDENCE_TYPES.includes(
        evidence_type as (typeof VALID_EVIDENCE_TYPES)[number]
      )
    ) {
      return badRequest(
        `evidence_type is required and must be one of: ${VALID_EVIDENCE_TYPES.join(", ")}`
      );
    }

    // Validate title
    if (!title || typeof title !== "string" || !title.trim()) {
      return badRequest("title is required");
    }

    // Validate summary
    if (!summary || typeof summary !== "string" || !summary.trim()) {
      return badRequest("summary is required");
    }

    // Validate client_size if provided
    if (
      client_size !== undefined &&
      client_size !== null &&
      !VALID_CLIENT_SIZES.includes(
        client_size as (typeof VALID_CLIENT_SIZES)[number]
      )
    ) {
      return badRequest(
        `Invalid client_size. Must be one of: ${VALID_CLIENT_SIZES.join(", ")}`
      );
    }

    // Sanitize user text input
    const sanitizedTitle = sanitizeTitle(title);
    const sanitizedSummary = sanitizeString(summary);
    const sanitizedFullContent = sanitizeString(full_content || "", 100_000);
    const sanitizedClientIndustry = client_industry ? sanitizeTitle(client_industry) : null;
    const sanitizedServiceLine = service_line ? sanitizeTitle(service_line) : null;

    const adminClient = createAdminClient();
    const { data: entry, error } = await adminClient
      .from("evidence_library")
      .insert({
        organization_id: context.organizationId,
        evidence_type,
        title: sanitizedTitle,
        summary: sanitizedSummary,
        full_content: sanitizedFullContent,
        client_industry: sanitizedClientIndustry,
        service_line: sanitizedServiceLine,
        client_size: client_size || null,
        outcomes_demonstrated: outcomes_demonstrated || [],
        metrics: metrics || [],
        is_verified: false,
      })
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      return serverError("Failed to create evidence entry", error);
    }

    return created({ evidence: entry });
  } catch (error) {
    return serverError("Failed to create evidence entry", error);
  }
}

/**
 * PATCH /api/evidence
 * Update an evidence entry (id in request body)
 */
export async function PATCH(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return badRequest("id is required in request body");
    }

    // Validate is_verified if provided
    if (fields.is_verified !== undefined && typeof fields.is_verified !== "boolean") {
      return badRequest("is_verified must be a boolean");
    }

    const updateData: Record<string, unknown> = {};
    if (fields.title !== undefined) updateData.title = sanitizeTitle(fields.title);
    if (fields.summary !== undefined) updateData.summary = sanitizeString(fields.summary);
    if (fields.full_content !== undefined) updateData.full_content = sanitizeString(fields.full_content, 100_000);
    if (fields.client_industry !== undefined) updateData.client_industry = fields.client_industry ? sanitizeTitle(fields.client_industry) : null;
    if (fields.service_line !== undefined) updateData.service_line = fields.service_line ? sanitizeTitle(fields.service_line) : null;
    if (fields.client_size !== undefined) updateData.client_size = fields.client_size;
    if (fields.outcomes_demonstrated !== undefined) updateData.outcomes_demonstrated = fields.outcomes_demonstrated;
    if (fields.metrics !== undefined) updateData.metrics = fields.metrics;
    if (fields.is_verified !== undefined) {
      updateData.is_verified = fields.is_verified;
      if (fields.is_verified) {
        updateData.verified_at = new Date().toISOString();
        updateData.verification_notes = fields.verification_notes || null;
      } else {
        updateData.verified_at = null;
        updateData.verification_notes = null;
      }
    }

    const adminClient = createAdminClient();
    const { data: entry, error } = await adminClient
      .from("evidence_library")
      .update(updateData)
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select(SELECT_FIELDS)
      .single();

    if (error || !entry) {
      if (error?.code === "PGRST116" || !entry) {
        return notFound("Evidence entry not found");
      }
      return serverError("Failed to update evidence entry", error);
    }

    return ok({ evidence: entry });
  } catch (error) {
    return serverError("Failed to update evidence entry", error);
  }
}

/**
 * DELETE /api/evidence?id=[id]
 * Delete an evidence entry by ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return badRequest("id query parameter is required");
    }

    const adminClient = createAdminClient();

    // Verify entry exists in this org
    const { data: existing } = await adminClient
      .from("evidence_library")
      .select("id")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!existing) {
      return notFound("Evidence entry not found");
    }

    const { error } = await adminClient
      .from("evidence_library")
      .delete()
      .eq("id", id)
      .eq("organization_id", context.organizationId);

    if (error) {
      return serverError("Failed to delete evidence entry", error);
    }

    return ok({ deleted: true });
  } catch (error) {
    return serverError("Failed to delete evidence entry", error);
  }
}
