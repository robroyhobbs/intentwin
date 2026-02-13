import { NextRequest, NextResponse } from "next/server";
import { getUserContext, verifyDocumentAccess } from "@/lib/supabase/auth-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateText } from "@/lib/ai/claude";
import { buildExtractionPrompt } from "@/lib/ai/prompts/extract-intake";
import type { ExtractedIntake } from "@/types/intake";

const EXTRACTION_SYSTEM_PROMPT = `You are an expert at analyzing business documents and extracting structured information. You are precise, thorough, and honest about confidence levels. You always respond with valid JSON only.`;

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, document_ids, content_type = "pasted" } = body;

    if (!content && (!document_ids || document_ids.length === 0)) {
      return NextResponse.json(
        { error: "Either content or document_ids is required" },
        { status: 400 },
      );
    }

    let combinedContent = content || "";

    // If document IDs provided, fetch their content (with org verification)
    if (document_ids && document_ids.length > 0) {
      const adminClient = createAdminClient();

      for (const docId of document_ids) {
        // Verify document belongs to user's organization
        const verifiedDoc = await verifyDocumentAccess(context, docId);
        if (!verifiedDoc) {
          return NextResponse.json(
            { error: `Document ${docId} not found or access denied` },
            { status: 404 },
          );
        }

        // First check document processing status
        const { data: doc } = await adminClient
          .from("documents")
          .select("processing_status, parsed_text_preview, file_name")
          .eq("id", docId)
          .eq("organization_id", context.organizationId)
          .single();

        if (
          doc?.processing_status === "pending" ||
          doc?.processing_status === "processing"
        ) {
          // Document is still being processed - wait a bit and retry
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Check again
          const { data: docRetry } = await adminClient
            .from("documents")
            .select("processing_status, parsed_text_preview")
            .eq("id", docId)
            .single();

          if (
            docRetry?.processing_status === "pending" ||
            docRetry?.processing_status === "processing"
          ) {
            // Still processing - use preview if available
            if (docRetry?.parsed_text_preview) {
              combinedContent += `\n\n--- Document: ${doc.file_name} (partial) ---\n${docRetry.parsed_text_preview}`;
            }
            continue;
          }
        }

        if (doc?.processing_status === "failed") {
          // Processing failed - try to use preview text if available
          if (doc?.parsed_text_preview) {
            combinedContent += `\n\n--- Document: ${doc.file_name} ---\n${doc.parsed_text_preview}`;
          }
          continue;
        }

        // Get document chunks (parsed content)
        const { data: chunks } = await adminClient
          .from("document_chunks")
          .select("content, section_heading, chunk_index")
          .eq("document_id", docId)
          .order("chunk_index", { ascending: true });

        if (chunks && chunks.length > 0) {
          const docContent = chunks
            .map((c) => {
              const heading = c.section_heading
                ? `## ${c.section_heading}\n`
                : "";
              return heading + c.content;
            })
            .join("\n\n");

          combinedContent += `\n\n--- Document Content ---\n${docContent}`;
        } else if (doc?.parsed_text_preview) {
          // Fallback to preview text
          combinedContent += `\n\n--- Document: ${doc.file_name} ---\n${doc.parsed_text_preview}`;
        }
      }
    }

    if (!combinedContent.trim()) {
      const hint =
        document_ids?.length > 0
          ? "The uploaded documents could not be parsed. Try pasting the content directly or uploading a different file format (PDF, DOCX, or TXT)."
          : "No content to analyze. Please enter some text or upload a document.";
      return NextResponse.json({ error: hint }, { status: 400 });
    }

    // Build extraction prompt
    const prompt = buildExtractionPrompt(
      combinedContent,
      document_ids?.length > 0 ? "file" : content_type,
    );

    // Call Claude for extraction
    const response = await generateText(prompt, {
      systemPrompt: EXTRACTION_SYSTEM_PROMPT,
      temperature: 0.3, // Lower temperature for structured extraction
      maxTokens: 4096,
    });

    // Parse JSON response
    let extracted: ExtractedIntake;
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response;
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      extracted = JSON.parse(jsonStr.trim());
    } catch (_parseError) {
      console.error("Failed to parse extraction response:", response);
      return NextResponse.json(
        { error: "Failed to parse extraction results" },
        { status: 500 },
      );
    }

    // Add source tracking
    if (document_ids?.length > 0) {
      const adminClient = createAdminClient();
      const { data: docs } = await adminClient
        .from("documents")
        .select("id, title, file_type")
        .in("id", document_ids);

      extracted.source_documents = docs?.map((d) => ({
        id: d.id,
        name: d.title,
        type: d.file_type,
      }));
    }

    if (content) {
      extracted.source_text = content.substring(0, 1000); // First 1000 chars as preview
    }

    return NextResponse.json({ extracted });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract intake data" },
      { status: 500 },
    );
  }
}
