import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { functions } from "@/inngest/index";

/**
 * POST/GET /api/inngest
 *
 * Inngest serve endpoint. Handles:
 * - GET: Introspection (Inngest dashboard discovers functions)
 * - POST: Event delivery (Inngest sends events to trigger functions)
 * - PUT: Sync/registration with Inngest cloud
 *
 * All registered functions are exposed via this single endpoint.
 *
 * CRITICAL: maxDuration must be set high enough for AI generation steps.
 * Each Inngest step invocation is an HTTP request to this endpoint.
 * Without this, Vercel's default 60s timeout kills AI calls mid-generation,
 * causing all proposal sections to fail silently.
 */
export const maxDuration = 300; // 5 minutes — needed for Gemini AI calls

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
