import { NextRequest } from "next/server";
import { getUserContext, checkDocumentAccess } from "@/lib/supabase/auth-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateText } from "@/lib/ai/gemini";
import {
  buildExtractionPrompt,
  buildMultiDocumentContent,
} from "@/lib/ai/prompts/extract-intake";
import { buildAssumptionsPrompt, type Assumption } from "@/lib/ai/prompts/assumptions";
import type { DocumentForExtraction } from "@/lib/ai/prompts/extract-intake";
import type { ExtractedIntake } from "@/types/intake";
import type { DocumentRole } from "@/types/proposal-documents";
import { logger } from "@/lib/utils/logger";
import { extractJsonFromResponse } from "@/lib/utils/extract-json";
import { unauthorized, badRequest, notFound, ok, serverError } from "@/lib/api/response";

/** Allow up to 5 minutes for document processing wait + AI extraction */
export const maxDuration = 300;

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
      return unauthorized();
    }

    let body;
    try {
      body = await request.json();
    } catch {
      logger.error("Extract: Failed to parse request body");
      return badRequest("Invalid request body");
    }
    const {
      content,
      document_ids,
      document_roles,  // Optional: { [document_id]: DocumentRole }
      content_type = "pasted",
    } = body;

    logger.info("Extract request:", {
      hasContent: !!content,
      contentLength: content?.length ?? 0,
      documentIds: document_ids ?? "none",
      hasRoles: !!document_roles,
      contentType: content_type,
    });

    if (!content && (!document_ids || document_ids.length === 0)) {
      logger.error("Extract: No content and no document_ids provided");
      return badRequest("Either content or document_ids is required");
    }

    let combinedContent = content || "";

    // Track documents with roles for role-aware extraction
    const documentsForExtraction: DocumentForExtraction[] = [];
    const roleMap: Record<string, DocumentRole> = document_roles || {};
    const hasRoles = Object.keys(roleMap).length > 0;

    // If document IDs provided, fetch their content (with org verification)
    if (document_ids && document_ids.length > 0) {
      const adminClient = createAdminClient();

      for (const docId of document_ids) {
        // Verify document belongs to user's organization
        const hasDocAccess = await checkDocumentAccess(context, docId);
        if (!hasDocAccess) {
          return notFound(`Document ${docId} not found or access denied`);
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
              const previewContent = doc.parsed_text_preview;
              if (hasRoles) {
                documentsForExtraction.push({
                  id: docId,
                  name: `${doc.file_name} (partial)`,
                  role: roleMap[docId] || "supplemental",
                  content: previewContent,
                });
              } else {
                combinedContent += `\n\n--- Document: ${doc.file_name} (partial) ---\n${previewContent}`;
              }
            }
            continue;
          }
          // Override doc reference for the remaining logic
          Object.assign(doc, settledDoc);
        }

        if (doc?.processing_status === "failed") {
          // Processing failed - try to use preview text if available
          if (doc?.parsed_text_preview) {
            if (hasRoles) {
              documentsForExtraction.push({
                id: docId,
                name: doc.file_name || docId,
                role: roleMap[docId] || "supplemental",
                content: doc.parsed_text_preview,
              });
            } else {
              combinedContent += `\n\n--- Document: ${doc.file_name} ---\n${doc.parsed_text_preview}`;
            }
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

          if (hasRoles) {
            documentsForExtraction.push({
              id: docId,
              name: doc?.file_name || docId,
              role: roleMap[docId] || "supplemental",
              content: docContent,
            });
          } else {
            combinedContent += `\n\n--- Document Content ---\n${docContent}`;
          }
        } else if (doc?.parsed_text_preview) {
          // Fallback to preview text
          if (hasRoles) {
            documentsForExtraction.push({
              id: docId,
              name: doc.file_name || docId,
              role: roleMap[docId] || "supplemental",
              content: doc.parsed_text_preview,
            });
          } else {
            combinedContent += `\n\n--- Document: ${doc.file_name} ---\n${doc.parsed_text_preview}`;
          }
        }
      }

      // If we have role-aware documents, build the combined content with role labels
      if (hasRoles && documentsForExtraction.length > 0) {
        const multiDocContent = buildMultiDocumentContent(documentsForExtraction);
        // Preserve any pasted content alongside role-labelled documents
        const pastedPrefix = content?.trim()
          ? `=== USER-PROVIDED CONTENT ===\n${content.trim()}\n\n`
          : "";
        combinedContent = pastedPrefix + multiDocContent;
      }

      // Auto-tag intake documents as 'rfp' so they're excluded from evidence retrieval
      adminClient
        .from("documents")
        .update({ document_type: "rfp" })
        .in("id", document_ids)
        .eq("organization_id", context.organizationId)
        .then(({ error }) => {
          if (error)
            logger.error("Failed to auto-tag intake docs as rfp", error);
        });
    }

    if (!combinedContent.trim()) {
      logger.error("Extract: combinedContent is empty after processing", {
        hadDocIds: !!document_ids?.length,
        docCount: document_ids?.length ?? 0,
        originalContentLength: content?.length ?? 0,
      });
      const hint =
        document_ids?.length > 0
          ? "The uploaded documents could not be parsed. Try pasting the content directly or uploading a different file format (PDF, DOCX, or TXT)."
          : "No content to analyze. Please enter some text or upload a document.";
      return badRequest(hint);
    }

    // Build extraction prompt
    const prompt = buildExtractionPrompt(
      combinedContent,
      document_ids?.length > 0 ? "file" : content_type,
    );

    // Call Gemini for extraction — 8192 tokens to prevent truncation on complex RFPs
    const response = await generateText(prompt, {
      systemPrompt: EXTRACTION_SYSTEM_PROMPT,
      temperature: 0.3, // Lower temperature for structured extraction
      maxTokens: 8192,
    });

    // Parse JSON response using triple-strategy extraction (same as bid-scoring)
    let extracted: ExtractedIntake;
    const parsed = extractJsonFromResponse(response);
    if (!parsed) {
      logger.error("Failed to parse extraction response after all strategies", {
        responseLength: response?.length,
        first200: response?.slice(0, 200),
        last200: response?.slice(-200),
      });
      return serverError("Failed to parse extraction results");
    }
    extracted = parsed as unknown as ExtractedIntake;

    // Ensure required sub-objects exist (AI may omit them for non-RFP docs like resumes)
    if (!extracted.extracted) extracted.extracted = {} as ExtractedIntake["extracted"];
    if (!extracted.inferred) extracted.inferred = {} as ExtractedIntake["inferred"];
    if (!extracted.gaps) extracted.gaps = [];
    if (!extracted.input_type) extracted.input_type = "other";
    if (!extracted.input_summary) extracted.input_summary = "Document analyzed";

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

    // Generate assumptions in parallel (non-blocking — if it fails, we still return extraction)
    let assumptions: Assumption[] = [];
    try {
      // Build a flat intake object from extracted fields for the assumptions prompt
      const flatIntake: Record<string, unknown> = {};
      if (extracted.extracted) {
        for (const [key, val] of Object.entries(extracted.extracted)) {
          if (val && typeof val === "object" && "value" in val) {
            flatIntake[key] = (val as { value: unknown }).value;
          }
        }
      }
      // Also pull from inferred fields as fallback
      if (extracted.inferred) {
        for (const [key, val] of Object.entries(extracted.inferred)) {
          if (!flatIntake[key] && val && typeof val === "object" && "value" in val) {
            flatIntake[key] = (val as { value: unknown }).value;
          }
        }
      }

      const assumptionsPrompt = buildAssumptionsPrompt(
        flatIntake,
        extracted.input_summary || "",
      );

      const assumptionsResponse = await generateText(assumptionsPrompt, {
        systemPrompt: "You are an expert proposal analyst. Respond with valid JSON only — a JSON array of assumption objects.",
        temperature: 0.4,
        maxTokens: 4096,
      });

      // Parse assumptions JSON
      let assumptionsJson = assumptionsResponse;
      const assumptionsMatch = assumptionsResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (assumptionsMatch) {
        assumptionsJson = assumptionsMatch[1];
      }
      const parsed = JSON.parse(assumptionsJson.trim());
      if (Array.isArray(parsed)) {
        assumptions = parsed;
      }
    } catch (assumptionsError) {
      // Non-fatal — log and continue without assumptions
      logger.warn("Assumptions generation failed during extraction", {
        error: assumptionsError instanceof Error ? assumptionsError.message : String(assumptionsError),
      });
    }

    return ok({ extracted, assumptions });
  } catch (error) {
    logger.error("Extraction error", error);
    return serverError("Failed to extract intake data", error);
  }
}
