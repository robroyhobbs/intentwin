import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { generateText } from "@/lib/ai/claude";
import {
  buildEvidenceExtractionPrompt,
  parseEvidenceResponse,
} from "@/lib/ai/prompts/extract-evidence";
import { clearL1Cache } from "@/lib/ai/pipeline/context";

/**
 * POST /api/evidence/extract
 * Extract evidence from selected documents using AI.
 * Body: { document_ids: string[] }
 *
 * Fetches document content, runs extraction prompt, inserts results
 * as unverified evidence entries. Additive — never deletes existing evidence.
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { document_ids } = body;

    if (!document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
      return NextResponse.json(
        { error: "document_ids array is required and must not be empty" },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();

    // Fetch documents belonging to this org
    const { data: documents, error: docError } = await adminClient
      .from("documents")
      .select("id, file_name, extracted_text")
      .in("id", document_ids)
      .eq("organization_id", context.organizationId)
      .eq("processing_status", "completed");

    if (docError || !documents || documents.length === 0) {
      return NextResponse.json(
        { error: "No processed documents found for the given IDs" },
        { status: 400 },
      );
    }

    // Concatenate document texts
    const combinedText = documents
      .map(
        (doc: { file_name: string; extracted_text: string | null }) =>
          `=== Document: ${doc.file_name} ===\n${doc.extracted_text || ""}`,
      )
      .join("\n\n");

    if (!combinedText.trim()) {
      return NextResponse.json(
        { error: "Selected documents have no extracted text" },
        { status: 400 },
      );
    }

    // Build prompt and call AI
    const prompt = buildEvidenceExtractionPrompt(combinedText);
    const rawResponse = await generateText(prompt, { temperature: 0.2 });

    // Parse the response
    const extracted = parseEvidenceResponse(rawResponse);

    if (extracted.length === 0) {
      return NextResponse.json({
        count: 0,
        evidence: [],
        message: "No evidence found in the selected documents",
      });
    }

    // Insert extracted evidence as unverified entries (additive)
    const insertRows = extracted.map((item) => ({
      organization_id: context.organizationId,
      evidence_type: item.evidence_type,
      title: item.title,
      summary: item.summary,
      full_content: item.full_content,
      client_industry: item.client_industry,
      service_line: item.service_line,
      metrics: item.metrics,
      outcomes_demonstrated: item.outcomes_demonstrated,
      is_verified: false,
    }));

    const { data: inserted, error: insertError } = await adminClient
      .from("evidence_library")
      .insert(insertRows)
      .select(
        "id, evidence_type, title, summary, client_industry, service_line, is_verified, created_at",
      );

    if (insertError) {
      console.error("Failed to insert extracted evidence:", insertError);
      return NextResponse.json(
        { error: "Failed to save extracted evidence" },
        { status: 500 },
      );
    }

    clearL1Cache();
    return NextResponse.json({
      count: inserted?.length || 0,
      evidence: inserted || [],
    });
  } catch (error) {
    console.error("Evidence extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract evidence" },
      { status: 500 },
    );
  }
}
