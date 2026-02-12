/**
 * POST /api/bulk-import/extract
 *
 * Accepts document content + fileName, sends to Gemini for L1 extraction,
 * then checks existing L1 data for conflicts before returning results.
 */

import { NextRequest, NextResponse } from "next/server";
import { extractL1FromText } from "@/lib/ai/l1-extractor";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context || !context.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, fileName } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json(
        { error: "fileName is required" },
        { status: 400 },
      );
    }

    // Extract L1 data from document text via Gemini
    const result = await extractL1FromText(content, fileName);

    if (result.error) {
      return NextResponse.json(
        { error: "Failed to extract data from document" },
        { status: 500 },
      );
    }

    // Fetch existing L1 data for conflict detection
    const supabase = createAdminClient();
    const orgId = context.organizationId;

    const { data: existingCC } = await supabase
      .from("company_context")
      .select("*")
      .eq("organization_id", orgId);

    const { data: existingPC } = await supabase
      .from("product_contexts")
      .select("*")
      .eq("organization_id", orgId);

    const { data: existingEL } = await supabase
      .from("evidence_library")
      .select("*")
      .eq("organization_id", orgId);

    // Add conflict flags to extracted items
    const company_context = result.data.company_context.map((item) => {
      const existing = (existingCC || []).find(
        (e: Record<string, unknown>) =>
          e.category === item.category && e.key === item.key,
      );
      return {
        ...item,
        isConflict: !!existing,
        existingValue: existing
          ? {
              title: (existing as Record<string, unknown>).title,
              content: (existing as Record<string, unknown>).content,
            }
          : undefined,
      };
    });

    const product_contexts = result.data.product_contexts.map((item) => {
      const existing = (existingPC || []).find(
        (e: Record<string, unknown>) =>
          e.product_name === item.product_name &&
          e.service_line === item.service_line,
      );
      return {
        ...item,
        isConflict: !!existing,
        existingValue: existing
          ? {
              description: (existing as Record<string, unknown>).description,
            }
          : undefined,
      };
    });

    const evidence_library = result.data.evidence_library.map((item) => {
      const existing = (existingEL || []).find(
        (e: Record<string, unknown>) => e.title === item.title,
      );
      return {
        ...item,
        isConflict: !!existing,
        existingValue: existing
          ? { summary: (existing as Record<string, unknown>).summary }
          : undefined,
      };
    });

    return NextResponse.json({
      company_context,
      product_contexts,
      evidence_library,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
