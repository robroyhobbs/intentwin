import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { logger } from "@/lib/utils/logger";

interface HealthCheck {
  ok: boolean;
  message: string;
  responseTimeMs?: number;
}

/**
 * Health check endpoint that tests all pipeline dependencies.
 * GET /api/health
 *
 * Unauthenticated: returns minimal status.
 * Authenticated: returns detailed component health with response times.
 */
export async function GET(request: NextRequest) {
  const overallStart = performance.now();

  // Check authentication - unauthenticated users get minimal response
  const context = await getUserContext(request);
  if (!context) {
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  }

  const checks: Record<string, HealthCheck> = {};

  // Run independent checks in parallel for faster response
  const [supabaseCheck, storageCheck, documentsCheck, vectorCheck, voyageCheck] =
    await Promise.allSettled([
      checkSupabase(),
      checkStorage(),
      checkDocuments(),
      checkVectorSearch(),
      checkVoyageAI(),
    ]);

  // Collect results
  checks.supabase =
    supabaseCheck.status === "fulfilled"
      ? supabaseCheck.value
      : { ok: false, message: `${supabaseCheck.reason}` };

  checks.storage =
    storageCheck.status === "fulfilled"
      ? storageCheck.value
      : { ok: false, message: `${storageCheck.reason}` };

  checks.documents =
    documentsCheck.status === "fulfilled"
      ? documentsCheck.value
      : { ok: false, message: `${documentsCheck.reason}` };

  checks.vector_search =
    vectorCheck.status === "fulfilled"
      ? vectorCheck.value
      : { ok: false, message: `${vectorCheck.reason}` };

  checks.voyage =
    voyageCheck.status === "fulfilled"
      ? voyageCheck.value
      : { ok: false, message: `${voyageCheck.reason}` };

  // Env var checks (instant)
  checks.gemini = process.env.GEMINI_API_KEY
    ? { ok: true, message: "Key configured" }
    : { ok: false, message: "GEMINI_API_KEY not set" };

  checks.claude = process.env.ANTHROPIC_API_KEY
    ? { ok: true, message: "Key configured" }
    : { ok: false, message: "ANTHROPIC_API_KEY not set" };

  const allOk = Object.values(checks).every((c) => c.ok);
  const failedChecks = Object.entries(checks)
    .filter(([, c]) => !c.ok)
    .map(([name]) => name);

  const totalResponseTimeMs = Math.round(performance.now() - overallStart);

  const status = allOk ? "healthy" : "degraded";

  // Log health check result
  logger.event("health.check", {
    status,
    totalResponseTimeMs,
    failedChecks: failedChecks.length > 0 ? failedChecks : undefined,
  });

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      responseTimeMs: totalResponseTimeMs,
      checks,
      ...(failedChecks.length > 0 ? { failedChecks } : {}),
    },
    { status: allOk ? 200 : 503 },
  );
}

// ─── Individual Check Functions ─────────────────────────────────────────────

async function checkSupabase(): Promise<HealthCheck> {
  const start = performance.now();
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("organizations").select("id").limit(1);
    const responseTimeMs = Math.round(performance.now() - start);
    return error
      ? { ok: false, message: `DB error: ${error.message}`, responseTimeMs }
      : { ok: true, message: "Connected", responseTimeMs };
  } catch (e) {
    const responseTimeMs = Math.round(performance.now() - start);
    return { ok: false, message: `${e}`, responseTimeMs };
  }
}

async function checkStorage(): Promise<HealthCheck> {
  const start = performance.now();
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.getBucket(
      "knowledge-base-documents",
    );
    const responseTimeMs = Math.round(performance.now() - start);
    if (error || !data) {
      return {
        ok: false,
        message: `Bucket "knowledge-base-documents" not found: ${error?.message}. Create it in Supabase Dashboard > Storage.`,
        responseTimeMs,
      };
    }
    return {
      ok: true,
      message: `Bucket exists (public: ${data.public})`,
      responseTimeMs,
    };
  } catch (e) {
    const responseTimeMs = Math.round(performance.now() - start);
    return { ok: false, message: `${e}`, responseTimeMs };
  }
}

async function checkDocuments(): Promise<HealthCheck> {
  const start = performance.now();
  try {
    const supabase = createAdminClient();
    const { data: stuck } = await supabase
      .from("documents")
      .select("id, title, processing_status, processing_error")
      .in("processing_status", ["pending", "processing", "failed"])
      .order("created_at", { ascending: false })
      .limit(5);
    const responseTimeMs = Math.round(performance.now() - start);
    return {
      ok: true,
      message: stuck?.length
        ? `${stuck.length} document(s) not completed: ${stuck.map((d) => `${d.title} (${d.processing_status}${d.processing_error ? `: ${d.processing_error}` : ""})`).join("; ")}`
        : "No stuck documents",
      responseTimeMs,
    };
  } catch (e) {
    const responseTimeMs = Math.round(performance.now() - start);
    return { ok: false, message: `${e}`, responseTimeMs };
  }
}

async function checkVectorSearch(): Promise<HealthCheck> {
  const start = performance.now();
  try {
    const supabase = createAdminClient();
    // Use org-scoped RPC to verify the production code path works
    // A nil UUID ensures no real data is returned (health check only)
    const { error } = await supabase.rpc("match_document_chunks_org", {
      query_embedding: JSON.stringify(new Array(1024).fill(0)),
      match_threshold: 0.5,
      match_count: 1,
      filter_organization_id: "00000000-0000-0000-0000-000000000000",
    });
    const responseTimeMs = Math.round(performance.now() - start);
    return error
      ? { ok: false, message: `RPC error: ${error.message}`, responseTimeMs }
      : { ok: true, message: "Vector search working", responseTimeMs };
  } catch (e) {
    const responseTimeMs = Math.round(performance.now() - start);
    return { ok: false, message: `${e}`, responseTimeMs };
  }
}

async function checkVoyageAI(): Promise<HealthCheck> {
  if (!process.env.VOYAGE_API_KEY) {
    return { ok: false, message: "VOYAGE_API_KEY not set" };
  }

  const start = performance.now();
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
    const responseTimeMs = Math.round(performance.now() - start);
    return res.ok
      ? { ok: true, message: "Embeddings working", responseTimeMs }
      : {
          ok: false,
          message: `Voyage API error (${res.status}): ${await res.text()}`,
          responseTimeMs,
        };
  } catch (e) {
    const responseTimeMs = Math.round(performance.now() - start);
    return { ok: false, message: `${e}`, responseTimeMs };
  }
}
