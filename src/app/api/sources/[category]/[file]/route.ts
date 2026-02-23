import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/sources/:category/:file
 *
 * Returns the content of a single L1 source item from the database,
 * scoped to the authenticated user's organization.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; file: string }> },
) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category, file } = await params;
    const adminClient = createAdminClient();
    const orgId = context.organizationId;

    // Route to the correct table based on category
    if (category === "company-context") {
      const { data, error } = await adminClient
        .from("company_context")
        .select("key, title, content, category, is_locked, last_verified_at")
        .eq("organization_id", orgId)
        .eq("key", file)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Source not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        fileName: data.key,
        category,
        title: data.title,
        content: data.content,
        metadata: {
          status: data.last_verified_at ? "VERIFIED" : "UNVERIFIED",
          category: data.category,
          is_locked: data.is_locked,
          last_verified_at: data.last_verified_at,
        },
      });
    }

    if (category === "service-catalog") {
      // file is the product UUID; sanitize to prevent filter injection
      const sanitizedFile = file.replace(/[^a-zA-Z0-9_-]/g, "");
      const { data, error } = await adminClient
        .from("product_contexts")
        .select(
          "id, product_name, service_line, description, capabilities, specifications, is_locked, last_verified_at",
        )
        .eq("organization_id", orgId)
        .eq("id", sanitizedFile);

      const product = data?.[0];
      if (error || !product) {
        return NextResponse.json(
          { error: "Source not found" },
          { status: 404 },
        );
      }

      // Build readable content from product fields
      const content = buildProductContent(product);

      return NextResponse.json({
        fileName: file,
        category,
        title: product.product_name,
        content,
        metadata: {
          status: product.last_verified_at ? "VERIFIED" : "UNVERIFIED",
          service_line: product.service_line,
          is_locked: product.is_locked,
        },
      });
    }

    if (category === "case-studies" || category === "evidence-library") {
      const { data, error } = await adminClient
        .from("evidence_library")
        .select(
          "id, title, summary, full_content, is_verified, evidence_type, client_industry, service_line, metrics",
        )
        .eq("organization_id", orgId)
        .eq("id", file)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Source not found" },
          { status: 404 },
        );
      }

      const content = data.full_content || data.summary || "";

      return NextResponse.json({
        fileName: file,
        category,
        title: data.title,
        content,
        metadata: {
          status: data.is_verified ? "VERIFIED" : "UNVERIFIED",
          evidence_type: data.evidence_type,
          client_industry: data.client_industry,
          service_line: data.service_line,
          metrics: data.metrics,
        },
      });
    }

    if (category === "team-members") {
      const { data, error } = await adminClient
        .from("team_members")
        .select(
          "id, name, role, title, email, skills, certifications, clearance_level, years_experience, project_history, bio, is_verified, resume_document_id",
        )
        .eq("organization_id", orgId)
        .eq("id", file)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Source not found" },
          { status: 404 },
        );
      }

      const content = buildTeamMemberContent(data);

      return NextResponse.json({
        fileName: file,
        category,
        title: data.name,
        content,
        metadata: {
          status: data.is_verified ? "VERIFIED" : "UNVERIFIED",
          role: data.role,
          title: data.title,
          clearance_level: data.clearance_level,
          years_experience: data.years_experience,
          has_resume: !!data.resume_document_id,
        },
      });
    }

    return NextResponse.json({ error: "Unknown category" }, { status: 404 });
  } catch (error) {
    console.error("Failed to load source:", error);
    return NextResponse.json(
      { error: "Failed to load source" },
      { status: 500 },
    );
  }
}

function buildTeamMemberContent(member: Record<string, unknown>): string {
  const lines: string[] = [];
  lines.push(`# ${member.name}`);
  lines.push(`**${member.role}**${member.title ? ` | ${member.title}` : ""}`);
  lines.push("");

  if (member.clearance_level) {
    lines.push(`**Security Clearance:** ${member.clearance_level}`);
  }
  if (member.years_experience) {
    lines.push(`**Years of Experience:** ${member.years_experience}`);
  }
  if (member.email) {
    lines.push(`**Email:** ${member.email}`);
  }
  lines.push("");

  if (member.bio) {
    lines.push("## Bio");
    lines.push(String(member.bio));
    lines.push("");
  }

  const certs = member.certifications as string[] | undefined;
  if (certs?.length) {
    lines.push("## Certifications");
    for (const cert of certs) {
      lines.push(`- ${cert}`);
    }
    lines.push("");
  }

  const skills = member.skills as string[] | undefined;
  if (skills?.length) {
    lines.push("## Skills");
    lines.push(skills.join(", "));
    lines.push("");
  }

  const projects = member.project_history as Array<Record<string, string>> | undefined;
  if (projects?.length) {
    lines.push("## Past Performance");
    for (const proj of projects) {
      lines.push(`### ${proj.title}${proj.dates ? ` (${proj.dates})` : ""}`);
      if (proj.client_industry) lines.push(`**Industry:** ${proj.client_industry}`);
      if (proj.scope) lines.push(`**Scope:** ${proj.scope}`);
      if (proj.results) lines.push(`**Results:** ${proj.results}`);
      lines.push("");
    }
  }

  if (member.resume_document_id) {
    lines.push("---");
    lines.push("*Resume on file*");
  }

  return lines.join("\n");
}

function buildProductContent(product: Record<string, unknown>): string {
  const lines: string[] = [];
  lines.push(`# ${product.product_name}`);
  lines.push("");
  if (product.description) {
    lines.push(String(product.description));
    lines.push("");
  }
  lines.push(`**Service Line:** ${product.service_line}`);
  lines.push("");

  const capabilities = product.capabilities as
    | Array<Record<string, string>>
    | undefined;
  if (capabilities?.length) {
    lines.push("## Capabilities");
    for (const cap of capabilities) {
      lines.push(
        `- **${cap.name || cap.capability}**: ${cap.description || ""}`,
      );
    }
    lines.push("");
  }

  const specs = product.specifications as Record<string, unknown> | undefined;
  if (specs && Object.keys(specs).length > 0) {
    lines.push("## Specifications");
    for (const [key, value] of Object.entries(specs)) {
      lines.push(`- **${key}**: ${JSON.stringify(value)}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
