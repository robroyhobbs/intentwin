/**
 * GET /api/debug/ai-health
 *
 * Diagnostic endpoint to verify AI model connectivity.
 * Tests both scoring and generation models with minimal prompts.
 * Protected by CRON_SECRET to prevent abuse.
 */

import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai/gemini";
import { getModel, MODELS } from "@/lib/ai/models";
import { extractJsonFromResponse } from "@/lib/utils/extract-json";

export const maxDuration = 30;

export async function GET(request: Request) {
  // Simple auth gate — reuse CRON_SECRET or allow in development
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const cronSecret = process.env.CRON_SECRET;

  if (
    process.env.NODE_ENV === "production" &&
    cronSecret &&
    token !== cronSecret
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    models: {
      primary: getModel("primary"),
      scoring: getModel("scoring"),
      fallback: MODELS.fallback,
    },
    env: {
      hasGeminiKey: !!process.env.GEMINI_API_KEY?.trim(),
      hasKimiKey: !!process.env.KIMI_API_KEY?.trim(),
      geminiModelOverride: process.env.GEMINI_MODEL || "(default)",
      scoringModelOverride: process.env.GEMINI_SCORING_MODEL || "(default)",
    },
  };

  // Test 1: Scoring model with JSON mode
  try {
    const scoringPrompt = `Score this test opportunity. Return JSON: {"requirement_match": {"score": 75, "rationale": "Test"}, "past_performance": {"score": 60, "rationale": "Test"}, "capability_alignment": {"score": 70, "rationale": "Test"}, "timeline_feasibility": {"score": 65, "rationale": "Test"}, "strategic_value": {"score": 55, "rationale": "Test"}}`;
    const start = Date.now();
    const scoringResponse = await generateText(scoringPrompt, {
      model: getModel("scoring"),
      temperature: 0,
      maxTokens: 1024,
      jsonMode: true,
    });
    const elapsed = Date.now() - start;
    const parsed = extractJsonFromResponse(scoringResponse);

    results.scoringModel = {
      status: "ok",
      elapsedMs: elapsed,
      responseLength: scoringResponse.length,
      responseFirst300: scoringResponse.slice(0, 300),
      parsedKeys: parsed ? Object.keys(parsed) : null,
      jsonParseSuccess: !!parsed,
      hasExpectedKeys: parsed
        ? ["requirement_match", "past_performance"].every((k) => k in parsed)
        : false,
    };
  } catch (err) {
    results.scoringModel = {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Test 2: Primary model (text generation)
  try {
    const start = Date.now();
    const genResponse = await generateText(
      "Write one sentence about cloud computing.",
      {
        model: getModel("primary"),
        maxTokens: 256,
      },
    );
    const elapsed = Date.now() - start;
    results.primaryModel = {
      status: "ok",
      elapsedMs: elapsed,
      responseLength: genResponse.length,
      responseFirst200: genResponse.slice(0, 200),
    };
  } catch (err) {
    results.primaryModel = {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Test 3: Check Supabase connectivity for proposal_sections schema
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    // Try to select from proposal_sections with metadata column
    const { error: schemaErr } = await supabase
      .from("proposal_sections")
      .select("id, metadata")
      .limit(1);

    results.dbSchema = {
      proposalSectionsMetadata: schemaErr
        ? { status: "error", error: schemaErr.message, code: schemaErr.code }
        : { status: "ok", columnExists: true },
    };
  } catch (err) {
    results.dbSchema = {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json(results);
}
