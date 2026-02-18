import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import { parseDocument } from "./parser";
import { chunkSections } from "./chunker";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import { PdfParseError } from "./parsers/pdf";

export async function processDocument(documentId: string): Promise<void> {
  const supabase = createAdminClient();

  // Update status to processing
  await supabase
    .from("documents")
    .update({ processing_status: "processing" })
    .eq("id", documentId);

  try {
    // Fetch document metadata
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (fetchError || !doc) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Download file from Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("knowledge-base-documents")
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse document into sections
    const sections = await parseDocument(buffer, doc.file_type);

    if (sections.length === 0) {
      logger.warn(`[Pipeline] Document ${documentId} parsed but produced 0 sections (file type: ${doc.file_type})`);
    }

    // Chunk sections
    const chunks = chunkSections(sections);

    if (chunks.length === 0) {
      await supabase
        .from("documents")
        .update({
          processing_status: "completed",
          chunk_count: 0,
          parsed_text_preview: "No extractable text content found.",
        })
        .eq("id", documentId);
      return;
    }

    // Generate embeddings for all chunks
    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(chunkTexts, "document");

    // Insert chunks with embeddings into the database
    const chunkRows = chunks.map((chunk, i) => ({
      document_id: documentId,
      content: chunk.content,
      chunk_index: chunk.chunkIndex,
      token_count: chunk.tokenCount,
      section_heading: chunk.sectionHeading,
      page_number: chunk.pageNumber ?? null,
      slide_number: chunk.slideNumber ?? null,
      embedding: JSON.stringify(embeddings[i]),
      metadata: {},
    }));

    // Insert in batches of 50
    const batchSize = 50;
    for (let i = 0; i < chunkRows.length; i += batchSize) {
      const batch = chunkRows.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from("document_chunks")
        .insert(batch);

      if (insertError) {
        throw new Error(`Failed to insert chunks: ${insertError.message}`);
      }
    }

    // Get a text preview from the first chunk
    const preview = chunks[0]?.content.slice(0, 500) || "";

    // Update document status
    await supabase
      .from("documents")
      .update({
        processing_status: "completed",
        chunk_count: chunks.length,
        parsed_text_preview: preview,
      })
      .eq("id", documentId);
  } catch (error) {
    // Surface user-friendly message from PdfParseError when available
    const errorMessage =
      error instanceof PdfParseError
        ? error.userMessage
        : error instanceof Error
          ? error.message
          : "Unknown error";

    await supabase
      .from("documents")
      .update({
        processing_status: "failed",
        processing_error: errorMessage,
      })
      .eq("id", documentId);

    throw error;
  }
}
