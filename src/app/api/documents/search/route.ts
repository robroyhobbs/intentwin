import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { generateQueryEmbedding } from "@/lib/ai/embeddings";

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { query, document_type, limit = 10, threshold = 0.3 } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();

    // Try hybrid search first (vector + full-text for chunks WITH embeddings)
    let vectorResults: SearchResult[] = [];
    try {
      const queryEmbedding = await generateQueryEmbedding(query);

      const { data, error } = await adminClient.rpc(
        "hybrid_search_chunks_org",
        {
          query_text: query,
          query_embedding: JSON.stringify(queryEmbedding),
          match_count: limit,
          vector_weight: 0.6,
          text_weight: 0.4,
          filter_organization_id: context.organizationId,
          filter_document_type: document_type || null,
        },
      );

      if (!error && data) {
        vectorResults = (data as HybridRow[]).map((r) => ({
          id: r.id,
          document_id: r.document_id,
          content: r.content,
          section_heading: r.section_heading,
          similarity: r.combined_score,
          document_title: r.document_title,
          document_type: r.document_type,
          file_name: "",
        }));
      }
    } catch {
      // Embedding generation failed — fall through to text-only search
    }

    // Also run a keyword search for chunks that may lack embeddings
    const keywordResults = await keywordSearch(
      adminClient,
      query,
      context.organizationId,
      document_type || null,
      limit,
    );

    // Merge and deduplicate: vector results first, then keyword fills
    const seenIds = new Set<string>();
    const merged: SearchResult[] = [];

    for (const r of vectorResults) {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        merged.push(r);
      }
    }
    for (const r of keywordResults) {
      if (!seenIds.has(r.id) && merged.length < limit) {
        seenIds.add(r.id);
        merged.push(r);
      }
    }

    // Filter by threshold (only applies to vector results; keyword results have similarity = text_rank)
    const filtered = merged.filter((r) => r.similarity >= threshold);

    return NextResponse.json({ results: filtered });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Types ───────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  document_id: string;
  content: string;
  section_heading: string | null;
  similarity: number;
  document_title: string;
  document_type: string;
  file_name: string;
}

interface HybridRow {
  id: string;
  document_id: string;
  content: string;
  section_heading: string | null;
  combined_score: number;
  vector_score: number;
  text_score: number;
  document_title: string;
  document_type: string;
}

// ── Keyword fallback search ─────────────────────────────────────────────────

async function keywordSearch(
  supabase: ReturnType<typeof createAdminClient>,
  query: string,
  organizationId: string,
  documentType: string | null,
  limit: number,
): Promise<SearchResult[]> {
  // Build a simple ilike search for each word.
  // Sanitize words to prevent PostgREST filter injection:
  // strip anything that isn't alphanumeric, hyphen, or underscore.
  const words = query
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9_-]/g, ""))
    .filter((w) => w.length > 2)
    .slice(0, 5);

  if (words.length === 0) return [];

  // Search chunks whose content matches any keyword, joined with document info
  let q = supabase
    .from("document_chunks")
    .select(
      "id, document_id, content, section_heading, documents!inner(title, document_type, file_name, processing_status, organization_id)",
    )
    .eq("documents.organization_id", organizationId)
    .eq("documents.processing_status", "completed")
    .limit(limit);

  if (documentType) {
    q = q.eq("documents.document_type", documentType);
  }

  // Use OR filter for keyword matching (words are sanitized above)
  const orFilters = words.map((w) => `content.ilike.%${w}%`).join(",");
  q = q.or(orFilters);

  const { data, error } = await q;

  if (error || !data) return [];

  // Score by number of keyword matches
  return (data as unknown as KeywordRow[])
    .map((row) => {
      const contentLower = row.content.toLowerCase();
      const matchCount = words.filter((w) =>
        contentLower.includes(w.toLowerCase()),
      ).length;
      const score = matchCount / words.length;

      const doc = row.documents as unknown as {
        title: string;
        document_type: string;
        file_name: string;
      };

      return {
        id: row.id,
        document_id: row.document_id,
        content: row.content,
        section_heading: row.section_heading,
        similarity: score,
        document_title: doc.title,
        document_type: doc.document_type,
        file_name: doc.file_name,
      };
    })
    .sort((a, b) => b.similarity - a.similarity);
}

interface KeywordRow {
  id: string;
  document_id: string;
  content: string;
  section_heading: string | null;
  documents: {
    title: string;
    document_type: string;
    file_name: string;
  };
}
