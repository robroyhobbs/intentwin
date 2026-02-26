import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProcessingStatus } from "@/lib/constants/statuses";
import { parseDocument } from "@/lib/documents/parser";
import { chunkSections } from "@/lib/documents/chunker";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import { PdfParseError } from "@/lib/documents/parsers/pdf";
import { createLogger } from "@/lib/utils/logger";

const EMBEDDING_BATCH_SIZE = 50;

/**
 * Inngest function: Process an uploaded document.
 *
 * Triggered by: document/process.requested
 *
 * Steps:
 *   1. Parse document (download, extract text, chunk)
 *   2-N. Generate embeddings in batches of 50 (individually retryable)
 *   N+1. Finalize document status
 */
export const processDocumentFn = inngest.createFunction(
  {
    id: "process-document",
    retries: 3,
  },
  { event: "document/process.requested" },
  async ({ event, step }) => {
    const { documentId } = event.data;
    const log = createLogger({
      operation: "inngest:process-document",
      documentId,
    });

    // Step 1: Parse document and chunk it
    const parseResult = await step.run("parse-document", async () => {
      const supabase = createAdminClient();

      // Set status to processing
      await supabase
        .from("documents")
        .update({ processing_status: ProcessingStatus.PROCESSING })
        .eq("id", documentId);

      try {
        // Fetch document metadata
        const { data: doc, error: fetchError } = await supabase
          .from("documents")
          .select("id, title, file_name, file_type, storage_path, mime_type, document_type, organization_id")
          .eq("id", documentId)
          .single();

        if (fetchError || !doc) {
          throw new Error(`Document not found: ${documentId}`);
        }

        // Download file from Storage
        const { data: fileData, error: downloadError } =
          await supabase.storage
            .from("knowledge-base-documents")
            .download(doc.storage_path);

        if (downloadError || !fileData) {
          throw new Error(
            `Failed to download file: ${downloadError?.message}`,
          );
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse document into sections
        const sections = await parseDocument(buffer, doc.file_type);

        if (sections.length === 0) {
          log.warn("Document parsed but produced 0 sections");
        }

        // Build full extracted text (capped at 200K chars) so /api/evidence/extract
        // can read it without joining through document_chunks.
        const extractedText = sections
          .map((s) => (s.heading ? `## ${s.heading}\n${s.content}` : s.content))
          .join("\n\n")
          .slice(0, 200_000);

        // Persist extracted text immediately — do this before chunking so the
        // document is usable even if embedding batches fail/retry.
        await supabase
          .from("documents")
          .update({ extracted_text: extractedText })
          .eq("id", documentId);

        // Chunk sections
        const chunks = chunkSections(sections);

        return {
          chunks: chunks.map((c) => ({
            content: c.content,
            chunkIndex: c.chunkIndex,
            tokenCount: c.tokenCount,
            sectionHeading: c.sectionHeading,
            pageNumber: c.pageNumber ?? null,
            slideNumber: c.slideNumber ?? null,
          })),
          preview: chunks[0]?.content.slice(0, 500) || "",
        };
      } catch (error) {
        // Set failure status
        const errorMessage =
          error instanceof PdfParseError
            ? error.userMessage
            : error instanceof Error
              ? error.message
              : "Unknown error";

        await supabase
          .from("documents")
          .update({
            processing_status: ProcessingStatus.FAILED,
            processing_error: errorMessage,
          })
          .eq("id", documentId);

        throw error;
      }
    });

    const { chunks, preview } = parseResult;

    // If no chunks, finalize immediately
    if (chunks.length === 0) {
      await step.run("finalize-empty", async () => {
        const supabase = createAdminClient();
        await supabase
          .from("documents")
          .update({
            processing_status: ProcessingStatus.COMPLETED,
            chunk_count: 0,
            parsed_text_preview:
              "No extractable text content found.",
          })
          .eq("id", documentId);
      });

      return { documentId, chunks: 0, batches: 0 };
    }

    // Steps 2-N: Generate embeddings and insert in batches
    const batchCount = Math.ceil(chunks.length / EMBEDDING_BATCH_SIZE);
    let totalInserted = 0;

    for (let batchIdx = 0; batchIdx < batchCount; batchIdx++) {
      const start = batchIdx * EMBEDDING_BATCH_SIZE;
      const end = Math.min(start + EMBEDDING_BATCH_SIZE, chunks.length);
      const batchChunks = chunks.slice(start, end);

      const inserted = await step.run(
        `embed-batch-${batchIdx}`,
        async () => {
          const supabase = createAdminClient();

          // Generate embeddings for this batch
          const chunkTexts = batchChunks.map((c) => c.content);
          const embeddings = await generateEmbeddings(
            chunkTexts,
            "document",
          );

          // Build rows
          const chunkRows = batchChunks.map((chunk, i) => ({
            document_id: documentId,
            content: chunk.content,
            chunk_index: chunk.chunkIndex,
            token_count: chunk.tokenCount,
            section_heading: chunk.sectionHeading,
            page_number: chunk.pageNumber,
            slide_number: chunk.slideNumber,
            embedding: JSON.stringify(embeddings[i]),
            metadata: {},
          }));

          const { error: insertError } = await supabase
            .from("document_chunks")
            .insert(chunkRows);

          if (insertError) {
            throw new Error(
              `Failed to insert chunks: ${insertError.message}`,
            );
          }

          return batchChunks.length;
        },
      );

      totalInserted += inserted;
    }

    // Final step: Update document status
    await step.run("finalize", async () => {
      const supabase = createAdminClient();
      await supabase
        .from("documents")
        .update({
          processing_status: ProcessingStatus.COMPLETED,
          chunk_count: totalInserted,
          parsed_text_preview: preview,
        })
        .eq("id", documentId);
    });

    return {
      documentId,
      chunks: totalInserted,
      batches: batchCount,
    };
  },
);
