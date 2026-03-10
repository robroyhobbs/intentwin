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
import { emitProposalGenerationFailedEvent } from "@/lib/copilot/proposal-generation-failure";
import { withRetry } from "@/lib/retry/with-retry";
import { isTransientAiError } from "@/lib/retry/retry-policy";

export const maxDuration = 60;

// eslint-disable-next-line max-lines-per-function -- route orchestrates validation, caching, and context loading before generation
export const POST = withProposalRoute(async (request, { id }, context) => {
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
    {
      organizationId: context.organizationId,
      proposalId: id,
      sectionId,
      sectionType,
      ctx: pipelineCtx,
      differentiators,
      log,
    },
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

interface GenerateAndRespondInput {
  organizationId: string;
  proposalId: string;
  sectionId: string;
  sectionType: string;
  ctx: PipelineContext;
  differentiators: string[] | undefined;
  log: ReturnType<typeof createLogger>;
}

// eslint-disable-next-line max-lines-per-function -- retry handling and copilot emission stay together to preserve route behavior
async function generateAndRespond({
  organizationId,
  proposalId,
  sectionId,
  sectionType,
  ctx,
  differentiators,
  log,
}: GenerateAndRespondInput) {
  try {
    const result = await withRetry(
      () => generateSingleSection(sectionId, sectionType, ctx, differentiators),
      {
        maxRetries: 2,
        baseDelay: 2000,
        jitterRatio: 0.2,
        shouldRetry: isTransientAiError,
        onRetry: (attempt, err) => {
          log.warn("Section generation retry", {
            sectionId,
            sectionType,
            attempt,
            error: err.message,
          });
        },
      },
    );

    if (result.requiresManualCompletion) {
      return ok({
        status: "failed" as const,
        content: result.generatedContent ?? "",
        error:
          result.failureReason ??
          "AI generation was unavailable. Manual completion required.",
      });
    }

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
    const attempts = getAttemptCount(err);
    log.error("Section generation failed", {
      sectionId,
      sectionType,
      error: errorMessage,
      attempts,
    });
    await emitSectionFailureEvent(
      {
        organizationId,
        proposalId,
        sectionId,
        sectionType,
        errorMessage,
        attempts,
        log,
      },
    );

    return ok({
      status: "failed" as const,
      error: `${errorMessage}${attempts && attempts > 1 ? ` (after ${attempts} attempts)` : ""}`,
    });
  }
}

function getAttemptCount(err: unknown): number {
  if (
    err instanceof Error &&
    "attempts" in err &&
    typeof (err as { attempts?: unknown }).attempts === "number"
  ) {
    return (err as { attempts: number }).attempts;
  }

  return 1;
}

async function emitSectionFailureEvent(
  input: {
    organizationId: string;
    proposalId: string;
    sectionId: string;
    sectionType: string;
    errorMessage: string;
    attempts: number;
    log: ReturnType<typeof createLogger>;
  },
) {
  const result = await emitProposalGenerationFailedEvent({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    retryable: true,
    stage: "section",
    errorMessage: input.errorMessage,
    attempts: input.attempts,
    correlationId: `proposal:${input.proposalId}:section:${input.sectionId}`,
    sectionId: input.sectionId,
    sectionType: input.sectionType,
  });

  if (!result.ok) {
    input.log.warn("Failed to emit copilot section failure event", {
      proposalId: input.proposalId,
      sectionId: input.sectionId,
      copilotError: result.message,
    });
  }
}
