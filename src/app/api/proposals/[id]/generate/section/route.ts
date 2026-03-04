/**
 * POST /api/proposals/[id]/generate/section
 *
 * Client-orchestrated generation: Step 2 (called per section).
 * Reads pipeline context from generation_metadata, generates one section.
 *
 * Security: sectionType is derived from DB by sectionId, not trusted from client.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { generateSingleSection } from "@/lib/ai/pipeline/generate-single-section";
import { extractDifferentiators } from "@/lib/ai/pipeline/differentiators";
import type { PipelineContext } from "@/lib/ai/pipeline/types";
import { createLogger } from "@/lib/utils/logger";
import {
  ok,
  badRequest,
  serverError,
  notFound,
  withProposalRoute,
} from "@/lib/api/response";

export const maxDuration = 60;

export const POST = withProposalRoute(async (request, { id }, _context) => {
  const log = createLogger({ operation: "generate-section", proposalId: id });

  // Parse request body — only sectionId is required from client
  let body: { sectionId: string; differentiators?: string[] };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { sectionId, differentiators } = body;
  if (!sectionId) {
    return badRequest("sectionId is required");
  }

  const supabase = createAdminClient();

  // Verify section belongs to this proposal and derive sectionType from DB
  const { data: section, error: sectionErr } = await supabase
    .from("proposal_sections")
    .select("section_type, generation_status, generated_content")
    .eq("id", sectionId)
    .eq("proposal_id", id)
    .single();

  if (sectionErr || !section) {
    return notFound("Section not found or does not belong to this proposal");
  }

  // Idempotency: if section is already completed, return existing content
  if (section.generation_status === "completed" && section.generated_content) {
    log.info("Section already completed — returning cached result", {
      sectionId,
    });
    const sectionType = section.section_type;
    let cachedDifferentiators: string[] | undefined;
    if (sectionType === "executive_summary") {
      const { extractDifferentiators: extract } =
        await import("@/lib/ai/pipeline/differentiators");
      cachedDifferentiators = extract(section.generated_content);
    }
    return ok({
      status: "completed" as const,
      content: section.generated_content,
      chunkCount: 0,
      ...(cachedDifferentiators
        ? { differentiators: cachedDifferentiators }
        : {}),
    });
  }

  const sectionType = section.section_type;

  // Read pipeline context from generation_metadata
  const { data: proposal, error: fetchError } = await supabase
    .from("proposals")
    .select("generation_metadata")
    .eq("id", id)
    .single();

  if (fetchError || !proposal?.generation_metadata) {
    log.error("Failed to read pipeline context", {
      error: fetchError?.message,
    });
    return serverError(
      "Pipeline context not found. Run /generate/setup first.",
    );
  }

  const pipelineCtx = reconstructContext(
    proposal.generation_metadata as unknown as PipelineContext,
  );

  log.info("Generating section", { sectionId, sectionType });

  return generateAndRespond(
    sectionId,
    sectionType,
    pipelineCtx,
    differentiators,
    log,
  );
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function reconstructContext(ctx: PipelineContext): PipelineContext {
  return {
    ...ctx,
    serviceLine: ctx.serviceLine ?? undefined,
    industry: ctx.industry ?? undefined,
    primaryBrandName: ctx.primaryBrandName ?? undefined,
    audienceProfile: ctx.audienceProfile ?? undefined,
    brandVoice: ctx.brandVoice ?? null,
    winStrategy: ctx.winStrategy ?? null,
    outcomeContract: ctx.outcomeContract ?? null,
    industryConfig: ctx.industryConfig ?? null,
  };
}

async function generateAndRespond(
  sectionId: string,
  sectionType: string,
  ctx: PipelineContext,
  differentiators: string[] | undefined,
  log: ReturnType<typeof createLogger>,
) {
  try {
    const result = await generateSingleSection(
      sectionId,
      sectionType,
      ctx,
      differentiators,
    );

    // Extract differentiators from executive summary for subsequent sections
    let extractedDifferentiators: string[] | undefined;
    if (sectionType === "executive_summary" && result.generatedContent) {
      extractedDifferentiators = extractDifferentiators(
        result.generatedContent,
      );
    }

    return ok({
      status: "completed" as const,
      content: result.generatedContent ?? "",
      chunkCount: result.chunkCount,
      ...(extractedDifferentiators
        ? { differentiators: extractedDifferentiators }
        : {}),
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    log.error("Section generation failed", {
      sectionId,
      sectionType,
      error: errorMessage,
    });

    return ok({
      status: "failed" as const,
      error: errorMessage,
    });
  }
}
