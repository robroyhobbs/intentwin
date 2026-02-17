import { createAdminClient } from "@/lib/supabase/admin";
import { generateQueryEmbedding } from "../embeddings";
import { createLogger } from "@/lib/utils/logger";

/**
 * Concurrency limit for parallel section generation.
 * Controls how many AI generation calls run simultaneously.
 * Set via PIPELINE_CONCURRENCY env var, default 3.
 *
 * - 1 = fully sequential (original behavior)
 * - 3 = balanced parallelism (default, ~3x speedup)
 * - 5 = aggressive (may hit API rate limits)
 * - 10 = fully parallel (all sections at once)
 */
export const PIPELINE_CONCURRENCY = Math.max(
  1,
  parseInt(process.env.PIPELINE_CONCURRENCY || "3", 10),
);

/**
 * Process items in batches with a concurrency limit.
 * Returns results in the same order as input.
 */
export async function parallelBatch<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((item, batchIdx) => fn(item, i + batchIdx)),
    );
    for (let j = 0; j < batchResults.length; j++) {
      results[i + j] = batchResults[j];
    }
  }

  return results;
}

// Document types to exclude from evidence retrieval (not useful as proposal evidence)
const EXCLUDED_DOC_TYPES = new Set(["rfp", "template"]);

export async function retrieveContext(
  supabase: ReturnType<typeof createAdminClient>,
  searchQuery: string,
  organizationId: string,
  limit: number = 5,
): Promise<{ context: string; chunkIds: string[] }> {
  try {
    const queryEmbedding = await generateQueryEmbedding(searchQuery);

    // Over-fetch to compensate for filtering out RFP/template docs
    // Use org-scoped RPC to enforce multi-tenant isolation
    const { data: results } = await supabase.rpc("match_document_chunks_org", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.5,
      match_count: limit * 3,
      filter_organization_id: organizationId,
    });

    if (!results || results.length === 0) {
      return { context: "No relevant reference material found.", chunkIds: [] };
    }

    // Filter out RFP and template documents — they're not evidence
    const filtered = results
      .filter(
        (r: { document_type: string }) =>
          !EXCLUDED_DOC_TYPES.has(r.document_type),
      )
      .slice(0, limit);

    if (filtered.length === 0) {
      return { context: "No relevant reference material found.", chunkIds: [] };
    }

    const context = filtered
      .map(
        (r: {
          document_title: string;
          section_heading: string;
          content: string;
          similarity: number;
        }) =>
          `--- From "${r.document_title}" (${r.section_heading || "General"}) [Relevance: ${(r.similarity * 100).toFixed(0)}%] ---\n${r.content}`,
      )
      .join("\n\n");

    const chunkIds = filtered.map((r: { id: string }) => r.id);

    return { context, chunkIds };
  } catch (error) {
    const ragLog = createLogger({ operation: "retrieveContext" });
    ragLog.error("Context retrieval error", error);
    return {
      context: "Reference material temporarily unavailable.",
      chunkIds: [],
    };
  }
}
