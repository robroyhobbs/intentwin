/**
 * POST /api/bulk-import/commit
 *
 * Accepts approved L1 items and upserts them to the database.
 * Scopes all inserts to the authenticated user's organization.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import {
  VALID_COMPANY_CATEGORIES,
  VALID_EVIDENCE_TYPES,
} from "@/lib/ai/l1-extractor";

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context || !context.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      company_context = [],
      product_contexts = [],
      evidence_library = [],
    } = body;

    // At least one item required
    if (
      company_context.length === 0 &&
      product_contexts.length === 0 &&
      evidence_library.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 },
      );
    }

    // Validate company_context items
    for (const item of company_context) {
      if (!item.category || !item.key || !item.title || !item.content) {
        return NextResponse.json(
          {
            error:
              "Company context items require category, key, title, and content",
          },
          { status: 400 },
        );
      }
      if (
        !(VALID_COMPANY_CATEGORIES as readonly string[]).includes(item.category)
      ) {
        return NextResponse.json(
          { error: `Invalid category: ${item.category}` },
          { status: 400 },
        );
      }
    }

    // Validate product_contexts items
    for (const item of product_contexts) {
      if (!item.product_name || !item.service_line || !item.description) {
        return NextResponse.json(
          {
            error:
              "Product items require product_name, service_line, and description",
          },
          { status: 400 },
        );
      }
    }

    // Validate evidence_library items
    for (const item of evidence_library) {
      if (
        !item.evidence_type ||
        !item.title ||
        !item.summary ||
        !item.full_content
      ) {
        return NextResponse.json(
          {
            error:
              "Evidence items require evidence_type, title, summary, and full_content",
          },
          { status: 400 },
        );
      }
      if (
        !(VALID_EVIDENCE_TYPES as readonly string[]).includes(
          item.evidence_type,
        )
      ) {
        return NextResponse.json(
          { error: `Invalid evidence type: ${item.evidence_type}` },
          { status: 400 },
        );
      }
    }

    const supabase = createAdminClient();
    const orgId = context.organizationId;
    const errors: string[] = [];

    // Upsert company_context
    if (company_context.length > 0) {
      const ccData = company_context.map((item: Record<string, unknown>) => ({
        ...item,
        organization_id: orgId,
      }));
      const { error: ccError } = await supabase
        .from("company_context")
        .upsert(ccData, { onConflict: "category,key,organization_id" });
      if (ccError) {
        console.error("company_context upsert failed:", ccError);
        errors.push(`Company context: ${ccError.message}`);
      }
    }

    // Upsert product_contexts
    if (product_contexts.length > 0) {
      const pcData = product_contexts.map((item: Record<string, unknown>) => ({
        ...item,
        organization_id: orgId,
      }));
      const { error: pcError } = await supabase
        .from("product_contexts")
        .upsert(pcData, {
          onConflict: "product_name,service_line,organization_id",
        });
      if (pcError) {
        console.error("product_contexts upsert failed:", pcError);
        errors.push(`Products: ${pcError.message}`);
      }
    }

    // Upsert evidence_library
    if (evidence_library.length > 0) {
      const elData = evidence_library.map((item: Record<string, unknown>) => ({
        ...item,
        organization_id: orgId,
      }));
      const { error: elError } = await supabase
        .from("evidence_library")
        .upsert(elData, { onConflict: "title,organization_id" });
      if (elError) {
        console.error("evidence_library upsert failed:", elError);
        errors.push(`Evidence: ${elError.message}`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: `Some items failed to save: ${errors.join("; ")}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      counts: {
        company_context: company_context.length,
        product_contexts: product_contexts.length,
        evidence_library: evidence_library.length,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
