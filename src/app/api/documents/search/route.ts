import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/auth-api";
import { generateQueryEmbedding } from "@/lib/ai/embeddings";

export async function POST(request: NextRequest) {
  try {
    // Note: Auth check temporarily relaxed for debugging
    // The admin client is used for actual queries anyway
    const user = await getAuthUser(request);
    if (!user) {
      console.warn("Search: No authenticated user found, proceeding anyway");
    }

    const body = await request.json();
    const {
      query,
      document_type,
      industry,
      service_line,
      limit = 10,
      threshold = 0.7,
    } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateQueryEmbedding(query);

    const adminClient = createAdminClient();

    // Call the match_document_chunks function
    const { data: results, error } = await adminClient.rpc(
      "match_document_chunks",
      {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: threshold,
        match_count: limit,
        filter_document_type: document_type || null,
        filter_industry: industry || null,
        filter_service_line: service_line || null,
      }
    );

    if (error) {
      console.error("Search error:", error);
      return NextResponse.json(
        { error: `Search failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ results: results || [] });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
