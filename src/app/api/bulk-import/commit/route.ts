/**
 * POST /api/bulk-import/commit
 *
 * Accepts approved L1 items and upserts them to the database.
 * Scopes all inserts to the authenticated user's organization.
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import {
  VALID_COMPANY_CATEGORIES,
  VALID_EVIDENCE_TYPES,
} from "@/lib/ai/l1-extractor";
import { clearL1Cache } from "@/lib/ai/pipeline/context";
import { unauthorized, badRequest, ok, serverError } from "@/lib/api/response";
import { logger } from "@/lib/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context || !context.organizationId) {
      return unauthorized();
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
      return badRequest("At least one item is required");
    }

    // Validate company_context items
    for (const item of company_context) {
      if (!item.category || !item.key || !item.title || !item.content) {
        return badRequest(
          "Company context items require category, key, title, and content",
        );
      }
      if (
        !(VALID_COMPANY_CATEGORIES as readonly string[]).includes(item.category)
      ) {
        return badRequest(`Invalid category: ${item.category}`);
      }
    }

    // Validate product_contexts items
    for (const item of product_contexts) {
      if (!item.product_name || !item.service_line || !item.description) {
        return badRequest(
          "Product items require product_name, service_line, and description",
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
        return badRequest(
          "Evidence items require evidence_type, title, summary, and full_content",
        );
      }
      if (
        !(VALID_EVIDENCE_TYPES as readonly string[]).includes(
          item.evidence_type,
        )
      ) {
        return badRequest(`Invalid evidence type: ${item.evidence_type}`);
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
        logger.error("company_context upsert failed", ccError);
        errors.push("Company context save failed");
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
        logger.error("product_contexts upsert failed", pcError);
        errors.push("Products save failed");
      }
    }

    // Upsert evidence_library
    if (evidence_library.length > 0) {
      const elData = evidence_library.map((item: Record<string, unknown>) => ({
        ...item,
        organization_id: orgId,
        outcomes_demonstrated: item.outcomes_demonstrated || [],
        metrics: item.metrics || [],
      }));
      const { error: elError } = await supabase
        .from("evidence_library")
        .upsert(elData, { onConflict: "title,organization_id" });
      if (elError) {
        logger.error("evidence_library upsert failed", elError);
        errors.push("Evidence save failed");
      }
    }

    if (errors.length > 0) {
      return serverError(`Some items failed to save: ${errors.join("; ")}`);
    }

    // Invalidate L1 cache so next generation uses fresh data
    clearL1Cache();

    return ok({
      counts: {
        company_context: company_context.length,
        product_contexts: product_contexts.length,
        evidence_library: evidence_library.length,
      },
    });
  } catch {
    return serverError("Internal server error");
  }
}
