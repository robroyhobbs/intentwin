import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";

/**
 * Health check endpoint that tests all pipeline dependencies.
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  // Check authentication - unauthenticated users get minimal response
  const context = await getUserContext(request);
  if (!context) {
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  }
  const checks: Record<string, { ok: boolean; message: string }> = {};

  // 1. Supabase connection
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);
    checks.supabase = error
      ? { ok: false, message: `DB error: ${error.message}` }
      : { ok: true, message: "Connected" };
  } catch (e) {
    checks.supabase = { ok: false, message: `${e}` };
  }

  // 2. Storage bucket exists
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.getBucket(
      "knowledge-base-documents",
    );
    if (error || !data) {
      checks.storage = {
        ok: false,
        message: `Bucket "knowledge-base-documents" not found: ${error?.message}. Create it in Supabase Dashboard > Storage.`,
      };
    } else {
      checks.storage = {
        ok: true,
        message: `Bucket exists (public: ${data.public})`,
      };
    }
  } catch (e) {
    checks.storage = { ok: false, message: `${e}` };
  }

  // 3. Gemini API key
  checks.gemini = process.env.GEMINI_API_KEY
    ? { ok: true, message: "Key configured" }
    : { ok: false, message: "GEMINI_API_KEY not set" };

  // 4. Voyage AI API key
  if (process.env.VOYAGE_API_KEY) {
    try {
      const res = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.EMBEDDING_MODEL || "voyage-3",
          input: ["health check"],
          input_type: "document",
        }),
      });
      checks.voyage = res.ok
        ? { ok: true, message: "Embeddings working" }
        : {
            ok: false,
            message: `Voyage API error (${res.status}): ${await res.text()}`,
          };
    } catch (e) {
      checks.voyage = { ok: false, message: `${e}` };
    }
  } else {
    checks.voyage = { ok: false, message: "VOYAGE_API_KEY not set" };
  }

  // 5. Documents table + any stuck documents
  try {
    const supabase = createAdminClient();
    const { data: stuck } = await supabase
      .from("documents")
      .select("id, title, processing_status, processing_error")
      .in("processing_status", ["pending", "processing", "failed"])
      .order("created_at", { ascending: false })
      .limit(5);

    checks.documents = {
      ok: true,
      message: stuck?.length
        ? `${stuck.length} document(s) not completed: ${stuck.map((d) => `${d.title} (${d.processing_status}${d.processing_error ? `: ${d.processing_error}` : ""})`).join("; ")}`
        : "No stuck documents",
    };
  } catch (e) {
    checks.documents = { ok: false, message: `${e}` };
  }

  // 6. Check for match_document_chunks RPC
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.rpc("match_document_chunks", {
      query_embedding: JSON.stringify(new Array(1024).fill(0)),
      match_threshold: 0.5,
      match_count: 1,
    });
    checks.vector_search = error
      ? { ok: false, message: `RPC error: ${error.message}` }
      : { ok: true, message: "Vector search working" };
  } catch (e) {
    checks.vector_search = { ok: false, message: `${e}` };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    { status: allOk ? "healthy" : "degraded", checks },
    { status: allOk ? 200 : 503 },
  );
}
