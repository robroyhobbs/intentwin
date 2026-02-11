import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json(
        {
          error: `Invalid type filter. Must be one of: ${VALID_EVIDENCE_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate verified filter
    if (verifiedFilter && verifiedFilter !== "true" && verifiedFilter !== "false") {
      return NextResponse.json(
        { error: "verified filter must be 'true' or 'false'" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Failed to fetch evidence" },
        { status: 500 }
      );
    }

    return NextResponse.json({ evidence: evidence || [] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json(
        {
          error: `evidence_type is required and must be one of: ${VALID_EVIDENCE_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate title
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    // Validate summary
    if (!summary || typeof summary !== "string" || !summary.trim()) {
      return NextResponse.json(
        { error: "summary is required" },
        { status: 400 }
      );
    }

    // Validate client_size if provided
    if (
      client_size !== undefined &&
      client_size !== null &&
      !VALID_CLIENT_SIZES.includes(
        client_size as (typeof VALID_CLIENT_SIZES)[number]
      )
    ) {
      return NextResponse.json(
        {
          error: `Invalid client_size. Must be one of: ${VALID_CLIENT_SIZES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data: entry, error } = await adminClient
      .from("evidence_library")
      .insert({
        organization_id: context.organizationId,
        evidence_type,
        title: title.trim(),
        summary: summary.trim(),
        full_content: full_content || "",
        client_industry: client_industry || null,
        service_line: service_line || null,
        client_size: client_size || null,
        outcomes_demonstrated: outcomes_demonstrated || [],
        metrics: metrics || [],
        is_verified: false,
      })
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create evidence entry" },
        { status: 500 }
      );
    }

    return NextResponse.json({ evidence: entry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required in request body" },
        { status: 400 }
      );
    }

    // Validate is_verified if provided
    if (fields.is_verified !== undefined && typeof fields.is_verified !== "boolean") {
      return NextResponse.json(
        { error: "is_verified must be a boolean" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (fields.title !== undefined) updateData.title = typeof fields.title === "string" ? fields.title.trim() : fields.title;
    if (fields.summary !== undefined) updateData.summary = typeof fields.summary === "string" ? fields.summary.trim() : fields.summary;
    if (fields.full_content !== undefined) updateData.full_content = fields.full_content;
    if (fields.client_industry !== undefined) updateData.client_industry = fields.client_industry;
    if (fields.service_line !== undefined) updateData.service_line = fields.service_line;
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
        return NextResponse.json(
          { error: "Evidence entry not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to update evidence entry" },
        { status: 500 }
      );
    }

    return NextResponse.json({ evidence: entry });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Evidence entry not found" },
        { status: 404 }
      );
    }

    const { error } = await adminClient
      .from("evidence_library")
      .delete()
      .eq("id", id)
      .eq("organization_id", context.organizationId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete evidence entry" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
