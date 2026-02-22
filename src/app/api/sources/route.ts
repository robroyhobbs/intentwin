import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/sources
 *
 * Returns L1 context data for the authenticated user's organization,
 * grouped into categories the frontend expects.
 * Reads from company_context, product_contexts, and evidence_library tables.
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const orgId = context.organizationId;

    // Fetch all three L1 tables in parallel, scoped to the user's org
    const [companyRes, productsRes, evidenceRes] = await Promise.all([
      adminClient
        .from("company_context")
        .select(
          "id, category, key, title, content, metadata, is_locked, last_verified_at",
        )
        .eq("organization_id", orgId)
        .order("category")
        .order("title"),
      adminClient
        .from("product_contexts")
        .select(
          "id, product_name, service_line, description, capabilities, specifications, is_locked, last_verified_at",
        )
        .eq("organization_id", orgId)
        .order("service_line")
        .order("product_name"),
      adminClient
        .from("evidence_library")
        .select(
          "id, evidence_type, title, summary, full_content, client_industry, service_line, metrics, is_verified, verified_at",
        )
        .eq("organization_id", orgId)
        .order("evidence_type")
        .order("title")
        .limit(500),
    ]);

    const companyContextItems = companyRes.data ?? [];
    const productItems = productsRes.data ?? [];
    const evidenceItems = evidenceRes.data ?? [];

    // Map company_context categories to source categories
    const categoryMap: Record<
      string,
      { name: string; key: string; files: SourceFile[] }
    > = {};

    // Group company context entries
    for (const item of companyContextItems) {
      const catKey = "company-context";
      if (!categoryMap[catKey]) {
        categoryMap[catKey] = {
          name: "company context",
          key: catKey,
          files: [],
        };
      }
      categoryMap[catKey].files.push({
        fileName: item.key,
        category: catKey,
        title: item.title,
        status: item.last_verified_at ? "VERIFIED" : "UNVERIFIED",
        contentType: item.category,
      });
    }

    // Group products as "service-catalog"
    if (productItems.length > 0) {
      categoryMap["service-catalog"] = {
        name: "service catalog",
        key: "service-catalog",
        files: productItems.map((p) => ({
          fileName: p.id,
          category: "service-catalog",
          title: p.product_name,
          status: p.last_verified_at ? "VERIFIED" : "UNVERIFIED",
          contentType: p.service_line,
        })),
      };
    }

    // Group evidence items by type
    const evidenceByType: Record<string, typeof evidenceItems> = {};
    for (const item of evidenceItems) {
      const type = item.evidence_type;
      if (!evidenceByType[type]) evidenceByType[type] = [];
      evidenceByType[type].push(item);
    }

    // Case studies
    if (evidenceByType["case_study"]?.length) {
      categoryMap["case-studies"] = {
        name: "case studies",
        key: "case-studies",
        files: evidenceByType["case_study"].map((e) => ({
          fileName: e.id,
          category: "case-studies",
          title: e.title,
          status: e.is_verified ? "VERIFIED" : "UNVERIFIED",
          contentType: "case_study",
        })),
      };
    }

    // Other evidence (metrics, testimonials, certifications, awards) → evidence-library
    const otherEvidence = evidenceItems.filter(
      (e) => e.evidence_type !== "case_study",
    );
    if (otherEvidence.length > 0) {
      categoryMap["evidence-library"] = {
        name: "evidence library",
        key: "evidence-library",
        files: otherEvidence.map((e) => ({
          fileName: e.id,
          category: "evidence-library",
          title: e.title,
          status: e.is_verified ? "VERIFIED" : "UNVERIFIED",
          contentType: e.evidence_type,
        })),
      };
    }

    // Return categories in a consistent order
    const orderedKeys = [
      "company-context",
      "service-catalog",
      "case-studies",
      "evidence-library",
    ];
    const categories = orderedKeys
      .filter((k) => categoryMap[k])
      .map((k) => categoryMap[k]);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to load sources:", error);
    return NextResponse.json(
      { error: "Failed to load sources" },
      { status: 500 },
    );
  }
}

interface SourceFile {
  fileName: string;
  category: string;
  title: string;
  status: string;
  contentType?: string;
}
