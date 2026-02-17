import { NextRequest, NextResponse } from "next/server";
import { getUserContext, verifyDocumentAccess } from "@/lib/supabase/auth-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateText } from "@/lib/ai/claude";
import { buildExtractionPrompt } from "@/lib/ai/prompts/extract-intake";
import type { ExtractedIntake } from "@/types/intake";
import { logger } from "@/lib/utils/logger";

const EXTRACTION_SYSTEM_PROMPT = `You are an expert at analyzing business documents and extracting structured information. You are precise, thorough, and honest about confidence levels. You always respond with valid JSON only.`;

/**
 * Poll a document until processing completes or timeout (~45s).
 * Returns the settled document data, or null if still processing.
 */
async function waitForDocumentProcessing(
  adminClient: ReturnType<typeof createAdminClient>,
  docId: string,
): Promise<{ processing_status: string; parsed_text_preview?: string; file_name?: string } | null> {
  const delays = [2000, 3000, 5000, 5000, 10000, 10000, 10000];
  for (const delay of delays) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    const { data: docRetry } = await adminClient
      .from("documents")
      .select("processing_status, parsed_text_preview, file_name")
      .eq("id", docId)
      .single();

    if (docRetry?.processing_status === "completed" || docRetry?.processing_status === "failed") {
      return docRetry;
    }
  }
  return null; // Still processing after timeout
}

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      console.error("Extract: Failed to parse request body");
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
    const { content, document_ids, content_type = "pasted" } = body;

    logger.info("Extract request:", {
      hasContent: !!content,
      contentLength: content?.length ?? 0,
      documentIds: document_ids ?? "none",
      contentType: content_type,
    });

    if (!content && (!document_ids || document_ids.length === 0)) {
      console.error("Extract: No content and no document_ids provided");
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
          const settledDoc = await waitForDocumentProcessing(adminClient, docId);
          if (!settledDoc) {
            // Still processing after ~45s — use preview if available
            if (doc?.parsed_text_preview) {
              combinedContent += `\n\n--- Document: ${doc.file_name} (partial) ---\n${doc.parsed_text_preview}`;
            }
            continue;
          }
          // Override doc reference for the remaining logic
          Object.assign(doc, settledDoc);
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

      // Auto-tag intake documents as 'rfp' so they're excluded from evidence retrieval
      adminClient
        .from("documents")
        .update({ document_type: "rfp" })
        .in("id", document_ids)
        .eq("organization_id", context.organizationId)
        .then(({ error }) => {
          if (error)
            console.error("Failed to auto-tag intake docs as rfp:", error);
        });
    }

    if (!combinedContent.trim()) {
      console.error("Extract: combinedContent is empty after processing", {
        hadDocIds: !!document_ids?.length,
        docCount: document_ids?.length ?? 0,
        originalContentLength: content?.length ?? 0,
      });
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
