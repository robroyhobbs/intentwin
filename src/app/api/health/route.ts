import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emitHealthDegradationEvents } from "@/lib/copilot/health-degradation-event";
import { getUserContext } from "@/lib/supabase/auth-api";
import { logger } from "@/lib/utils/logger";

interface HealthCheck {
  ok: boolean;
  message: string;
  responseTimeMs?: number;
}

const HEALTH_CHECK_RUNNERS: Record<string, () => Promise<HealthCheck>> = {
  supabase: checkSupabase,
  storage: checkStorage,
  documents: checkDocuments,
  vector_search: checkVectorSearch,
  voyage: checkVoyageAI,
  gemini: checkGeminiAI,
};

/**
 * Health check endpoint that tests all pipeline dependencies.
 * GET /api/health
 *
 * Unauthenticated: returns minimal status.
 * Authenticated: returns detailed component health with response times.
 */
export async function GET(request: NextRequest) {
  const overallStart = performance.now();
  const context = await getUserContext(request);
  if (!context) {
    return buildUnauthenticatedHealthResponse();
  }

  const checks = await collectHealthChecks();
  const failedChecks = getFailedChecks(checks);
  const totalResponseTimeMs = Math.round(performance.now() - overallStart);
  const status = failedChecks.length === 0 ? "healthy" : "degraded";

  logger.event("health.check", {
    status,
    totalResponseTimeMs,
    failedChecks: failedChecks.length > 0 ? failedChecks : undefined,
  });

  await emitDegradationEventsIfNeeded({
    organizationId: context.organizationId,
    checks,
    failedChecks,
    totalResponseTimeMs,
  });

  return buildAuthenticatedHealthResponse({
    checks,
    failedChecks,
    status,
    totalResponseTimeMs,
  });
}

function buildUnauthenticatedHealthResponse() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}

async function collectHealthChecks(): Promise<Record<string, HealthCheck>> {
  const entries = await Promise.all(
    Object.entries(HEALTH_CHECK_RUNNERS).map(async ([name, runCheck]) => {
      try {
        return [name, await runCheck()] as const;
      } catch (error) {
        return [name, { ok: false, message: String(error) }] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}

function getFailedChecks(checks: Record<string, HealthCheck>): string[] {
  return Object.entries(checks)
    .filter(([, check]) => !check.ok)
    .map(([name]) => name);
}

async function emitDegradationEventsIfNeeded(input: {
  organizationId: string;
  checks: Record<string, HealthCheck>;
  failedChecks: string[];
  totalResponseTimeMs: number;
}) {
  if (input.failedChecks.length === 0) {
    return;
  }

  const emissionResult = await emitHealthDegradationEvents({
    organizationId: input.organizationId,
    checks: input.checks,
    totalResponseTimeMs: input.totalResponseTimeMs,
  });

  if (!emissionResult.ok) {
    logger.warn("Health degradation event emission failed", {
      emittedCount: emissionResult.emitted,
      failedComponents: emissionResult.failures.map((failure) => failure.component),
    });
  }
}

function buildAuthenticatedHealthResponse(input: {
  checks: Record<string, HealthCheck>;
  failedChecks: string[];
  status: "healthy" | "degraded";
  totalResponseTimeMs: number;
}) {
  return NextResponse.json(
    {
      status: input.status,
      timestamp: new Date().toISOString(),
      responseTimeMs: input.totalResponseTimeMs,
      checks: input.checks,
      ...(input.failedChecks.length > 0
        ? { failedChecks: input.failedChecks }
        : {}),
    },
    { status: input.failedChecks.length === 0 ? 200 : 503 },
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

async function checkGeminiAI(): Promise<HealthCheck> {
  if (!process.env.GEMINI_API_KEY) {
    return { ok: false, message: "GEMINI_API_KEY not set" };
  }

  const start = performance.now();
  try {
    const { generateText } = await import("@/lib/ai/gemini");
    const result = await Promise.race([
      generateText("Reply with exactly: OK", {
        maxTokens: 10,
        temperature: 0,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timed out after 15s")), 15_000)
      ),
    ]);
    const responseTimeMs = Math.round(performance.now() - start);
    return {
      ok: true,
      message: `Gemini responding (${result.length} chars)`,
      responseTimeMs,
    };
  } catch (e) {
    const responseTimeMs = Math.round(performance.now() - start);
    return {
      ok: false,
      message: `Gemini error: ${e instanceof Error ? e.message : String(e)}`,
      responseTimeMs,
    };
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
