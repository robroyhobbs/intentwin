import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, checkProposalAccess } from "@/lib/supabase/auth-api";
import { generateText } from "@/lib/ai/claude";

/** AI extraction + DB writes */
export const maxDuration = 120;
import {
  buildRequirementsExtractionPrompt,
  parseExtractionResponse,
  VALID_SECTION_TYPES,
} from "@/lib/ai/prompts/extract-requirements";

const EXTRACTION_SYSTEM_PROMPT = `You are an expert at analyzing business documents and extracting requirements. You are precise, thorough, and always respond with valid JSON arrays only.`;

/**
 * POST /api/proposals/[id]/requirements/extract
 * Extract requirements from uploaded documents using AI.
 * Accepts { document_ids: string[] } in the request body.
 * Re-extraction replaces previously extracted requirements (preserves manual ones).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await checkProposalAccess(context, id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const body = await request.json();
    const { document_ids } = body;

    if (!Array.isArray(document_ids) || document_ids.length === 0) {
      return NextResponse.json(
        { error: "No documents to extract from" },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();

    // Fetch document content from chunks
    let combinedContent = "";

    for (const docId of document_ids) {
      // Get document metadata
      const { data: doc } = await adminClient
        .from("documents")
        .select("processing_status, parsed_text_preview, file_name")
        .eq("id", docId)
        .eq("organization_id", context.organizationId)
        .single();

      if (!doc) continue;

      if (doc.processing_status !== "completed") {
        // Use preview as fallback for non-completed docs
        if (doc.parsed_text_preview) {
          combinedContent += `\n\n--- Document: ${doc.file_name} (partial) ---\n${doc.parsed_text_preview}`;
        }
        continue;
      }

      // Get full document text from chunks
      const { data: chunks } = await adminClient
        .from("document_chunks")
        .select("content, section_heading, chunk_index")
        .eq("document_id", docId)
        .order("chunk_index", { ascending: true });

      if (chunks && chunks.length > 0) {
        const docContent = chunks
          .map((c: { content: string; section_heading?: string }) => {
            const heading = c.section_heading ? `## ${c.section_heading}\n` : "";
            return heading + c.content;
          })
          .join("\n\n");

        combinedContent += `\n\n--- Document: ${doc.file_name} ---\n${docContent}`;
      } else if (doc.parsed_text_preview) {
        combinedContent += `\n\n--- Document: ${doc.file_name} ---\n${doc.parsed_text_preview}`;
      }
    }

    if (!combinedContent.trim()) {
      return NextResponse.json(
        { error: "No documents to extract from" },
        { status: 400 },
      );
    }

    // Build prompt and call AI
    const prompt = buildRequirementsExtractionPrompt(combinedContent);
    const response = await generateText(prompt, {
      systemPrompt: EXTRACTION_SYSTEM_PROMPT,
      temperature: 0.2,
      maxTokens: 4096,
    });

    // Parse the AI response
    const extracted = parseExtractionResponse(response);

    // Delete previously extracted requirements (preserve manual ones)
    await adminClient
      .from("proposal_requirements")
      .delete()
      .eq("proposal_id", id)
      .eq("organization_id", context.organizationId)
      .eq("is_extracted", true);

    // Fetch existing proposal sections for auto-mapping
    const { data: sections } = await adminClient
      .from("proposal_sections")
      .select("id, section_type")
      .eq("proposal_id", id);

    const sectionMap = new Map<string, string>();
    if (sections) {
      for (const s of sections) {
        sectionMap.set(s.section_type, s.id);
      }
    }

    // Insert extracted requirements
    if (extracted.length > 0) {
      const rows = extracted.map((req) => {
        // Auto-map to the first matching proposal section
        let mappedSectionId: string | null = null;
        for (const suggested of req.suggested_sections) {
          if (VALID_SECTION_TYPES.includes(suggested as typeof VALID_SECTION_TYPES[number])) {
            const sectionId = sectionMap.get(suggested);
            if (sectionId) {
              mappedSectionId = sectionId;
              break;
            }
          }
        }

        return {
          proposal_id: id,
          organization_id: context.organizationId,
          requirement_text: req.requirement_text,
          source_reference: req.source_reference || null,
          category: req.category,
          requirement_type: req.requirement_type || "content",
          mapped_section_id: mappedSectionId,
          is_extracted: true,
        };
      });

      const { error: insertError } = await adminClient
        .from("proposal_requirements")
        .insert(rows);

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to save extracted requirements" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      count: extracted.length,
      requirements: extracted,
    });
  } catch (error) {
    console.error("Requirements extraction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
