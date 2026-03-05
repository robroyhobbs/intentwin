/**
 * POST /api/proposals/[id]/generate/setup
 *
 * Client-orchestrated generation: Step 1.
 * Runs guards, builds pipeline context, creates section rows,
 * and stores context in generation_metadata for per-section calls.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { ProposalStatus } from "@/lib/constants/statuses";
import { GenerationStatus } from "@/lib/constants/statuses";
import { buildPipelineContext } from "@/lib/ai/pipeline/context";
import { buildSectionList } from "@/lib/ai/pipeline/section-configs";
import {
  runPreflightCheck,
  type PreflightResult,
} from "@/lib/ai/pipeline/preflight";
import type { BidEvaluation } from "@/lib/ai/bid-scoring";
import type { RfpTaskStructure } from "@/lib/ai/pipeline/types";
import { logger } from "@/lib/utils/logger";
import { createLogger } from "@/lib/utils/logger";
import { checkFeature } from "@/lib/features/check-feature";
import { checkPlanLimit } from "@/lib/supabase/auth-api";
import {
  conflict,
  ok,
  serverError,
  forbidden,
  withProposalRoute,
} from "@/lib/api/response";
import { apiError } from "@/lib/api/response";

export const maxDuration = 120;

export const POST = withProposalRoute(
  async (_request, { id }, context, proposal) => {
    const log = createLogger({ operation: "generate-setup", proposalId: id });

    // ── Feature gate ──────────────────────────────────────────────────
    const canGenerate = await checkFeature(
      context.organizationId,
      "ai_generation",
    );
    if (!canGenerate) {
      return forbidden(
        "AI proposal generation requires a Starter plan or above.",
      );
    }

    // ── Token limit check (before claim to avoid stuck GENERATING) ────
    const tokenCheck = await checkPlanLimit(
      context.organizationId,
      "ai_tokens_per_month",
    );
    if (!tokenCheck.allowed) {
      return apiError({
        message:
          tokenCheck.message ||
          "AI token limit reached. Upgrade your plan to continue.",
        status: 429,
        code: "TOKEN_LIMIT_REACHED",
      });
    }

    // ── Orphan recovery: reset stale generating proposals ────────────
    // If a client disconnects mid-generation, the proposal gets stuck.
    // Reset proposals stuck in "generating" for >15 minutes.
    const STALE_GENERATION_MS = 15 * 60 * 1000;
    await recoverStaleGeneration(id, STALE_GENERATION_MS, log);

    // ── Atomic claim mutex ────────────────────────────────────────────
    const adminClient = createAdminClient();
    const { data: claimed, error: claimError } = await adminClient
      .from("proposals")
      .update({
        status: ProposalStatus.GENERATING,
        generation_started_at: new Date().toISOString(),
      })
      .eq("id", id)
      .neq("status", ProposalStatus.GENERATING)
      .select("id")
      .maybeSingle();

    if (claimError) {
      logger.error("Generation claim error", claimError);
      return serverError("Failed to start generation");
    }
    if (!claimed) {
      // Already generating — return existing sections for resumability
      const existingSections = await getExistingSections(id);
      if (existingSections.length > 0) {
        log.info("Returning existing sections for in-progress generation", {
          sectionCount: existingSections.length,
        });
        return ok({
          sections: existingSections,
          sectionCount: existingSections.length,
          resumed: true,
        });
      }
      return conflict("Proposal is already being generated");
    }

    // ── Build pipeline context ────────────────────────────────────────
    const supabase = createAdminClient();
    let ctx;
    try {
      ctx = await buildPipelineContext(supabase, id);
    } catch (ctxErr) {
      log.error("buildPipelineContext failed — reverting to DRAFT", {
        error: ctxErr instanceof Error ? ctxErr.message : String(ctxErr),
      });
      await supabase
        .from("proposals")
        .update({
          status: ProposalStatus.DRAFT,
          generation_error: `Pipeline context build failed: ${ctxErr instanceof Error ? ctxErr.message : String(ctxErr)}`,
          generation_completed_at: new Date().toISOString(),
        })
        .eq("id", id);
      return serverError("Failed to build generation context");
    }

    // ── Pre-flight readiness check (fail-open, uses context from above) ─
    let preflight: PreflightResult | null = null;
    try {
      const requirements =
        (proposal!.rfp_extracted_requirements as
          | Record<string, unknown>[]
          | null) ?? null;
      const bidEvaluation =
        (proposal!.bid_evaluation as BidEvaluation | null) ?? null;
      preflight = runPreflightCheck(
        ctx.rawL1Context,
        ctx.intakeData,
        requirements,
        bidEvaluation,
      );
    } catch (preflightError) {
      logger.warn("Preflight check failed (non-blocking)", {
        error:
          preflightError instanceof Error
            ? preflightError.message
            : String(preflightError),
      });
    }

    // ── Delete existing sections + create new ones ────────────────────
    await supabase.from("proposal_sections").delete().eq("proposal_id", id);

    const sections = buildSectionRows(ctx, id, log);

    const { data: insertedSections, error: sectionError } = await supabase
      .from("proposal_sections")
      .insert(sections)
      .select("id, section_type, title");

    if (sectionError || !insertedSections) {
      log.error("Failed to create section rows — reverting to DRAFT", {
        error: sectionError?.message,
      });
      await supabase
        .from("proposals")
        .update({
          status: ProposalStatus.DRAFT,
          generation_error: `Section creation failed: ${sectionError?.message ?? "unknown"}`,
        })
        .eq("id", id);
      return serverError("Failed to create sections");
    }

    // ── Store pipeline context for per-section calls ──────────────────
    const { error: metaError } = await supabase
      .from("proposals")
      .update({ generation_metadata: ctx })
      .eq("id", id);

    if (metaError) {
      log.error("Failed to store generation_metadata — reverting to DRAFT", {
        error: metaError.message,
        code: metaError.code,
        hint: metaError.hint,
      });
      await supabase
        .from("proposals")
        .update({
          status: ProposalStatus.DRAFT,
          generation_error: `Pipeline context storage failed: ${metaError.message}`,
        })
        .eq("id", id);
      return serverError(
        `Failed to store pipeline context: ${metaError.message}`,
      );
    }

    log.info("Setup complete", {
      sectionCount: insertedSections.length,
      preflight: preflight?.status ?? "skipped",
    });

    return ok({
      sections: insertedSections.map((s) => ({
        id: s.id,
        sectionType: s.section_type,
        title: s.title,
      })),
      sectionCount: insertedSections.length,
      preflight: preflight ?? undefined,
      ...(ctx.warnings?.length ? { warnings: ctx.warnings } : {}),
    });
  },
  { requireFullProposal: true },
);

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch existing sections for a proposal that's already in GENERATING state.
 * Used for resumability when setup is called again (e.g., browser refresh).
 */
async function getExistingSections(proposalId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("proposal_sections")
    .select("id, section_type, title")
    .eq("proposal_id", proposalId)
    .order("section_order", { ascending: true });

  return (data ?? []).map((s) => ({
    id: s.id,
    sectionType: s.section_type,
    title: s.title,
  }));
}

/**
 * If a proposal is stuck in "generating" for longer than staleMs,
 * reset it to DRAFT so it can be re-claimed. This handles orphaned
 * generations from client disconnects / browser closes.
 */
async function recoverStaleGeneration(
  proposalId: string,
  staleMs: number,
  log: ReturnType<typeof createLogger>,
) {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - staleMs).toISOString();
  const { data } = await supabase
    .from("proposals")
    .update({
      status: ProposalStatus.DRAFT,
      generation_error: "Previous generation timed out. Please retry.",
      generation_metadata: null,
    })
    .eq("id", proposalId)
    .eq("status", ProposalStatus.GENERATING)
    .lt("generation_started_at", cutoff)
    .select("id")
    .maybeSingle();

  if (data) {
    log.warn("Recovered stale generating proposal", { proposalId });
  }
}

function buildSectionRows(
  ctx: Awaited<ReturnType<typeof buildPipelineContext>>,
  proposalId: string,
  log: ReturnType<typeof createLogger>,
) {
  const rfpTaskStructure =
    (ctx.proposal.rfp_task_structure as RfpTaskStructure | null) ?? null;
  const solicitationType =
    (ctx.intakeData.solicitation_type as string) || "RFP";
  const allSections = buildSectionList(rfpTaskStructure, solicitationType);

  // Filter to user-selected sections
  const userSelectedSections = ctx.intakeData.selected_sections as
    | string[]
    | undefined;
  const applicableSections = userSelectedSections?.length
    ? allSections.filter((s) => userSelectedSections.includes(s.type))
    : allSections;

  // Handle custom sections from RFP analysis
  const rfpAnalysis = ctx.intakeData.rfp_analysis as {
    sections?: Array<{
      section_type: string;
      title: string;
      rationale: string;
      custom_description?: string;
      rfp_requirements?: string[];
    }>;
  } | null;

  if (userSelectedSections?.length && rfpAnalysis?.sections) {
    const customSelectedTypes = userSelectedSections.filter((t) =>
      t.startsWith("custom_"),
    );
    if (customSelectedTypes.length > 0) {
      let nextOrder =
        applicableSections.length > 0
          ? Math.max(...applicableSections.map((s) => s.order)) + 1
          : 13;

      for (const customType of customSelectedTypes) {
        const rfpSection = rfpAnalysis.sections.find(
          (s) =>
            s.section_type === "custom" &&
            `custom_${s.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "_")
              .slice(0, 40)}` === customType,
        );
        if (rfpSection) {
          applicableSections.push({
            type: customType,
            title: rfpSection.title,
            order: nextOrder++,
            buildPrompt: () => "",
            searchQuery: (d: Record<string, unknown>) =>
              `${rfpSection.title} ${rfpSection.custom_description?.slice(0, 100) || ""} ${d.client_industry || ""}`,
            taskMeta: undefined,
          });
        }
      }
    }
  }

  log.info("Section list built", {
    sectionCount: applicableSections.length,
    sectionTypes: applicableSections.map((s) => s.type),
  });

  // Create section row inserts with optional metadata
  return applicableSections.map((config) => {
    let metadata: Record<string, unknown> | undefined;
    if (config.taskMeta) {
      metadata = config.taskMeta;
    } else if (config.type.startsWith("custom_") && rfpAnalysis?.sections) {
      const rfpSection = (
        rfpAnalysis.sections as Array<{
          section_type: string;
          title: string;
          custom_description?: string;
          rfp_requirements?: string[];
          rationale?: string;
        }>
      ).find(
        (s) =>
          s.section_type === "custom" &&
          `custom_${s.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .slice(0, 40)}` === config.type,
      );
      if (rfpSection) {
        metadata = {
          custom_description:
            rfpSection.custom_description || rfpSection.rationale || "",
          rfp_requirements: rfpSection.rfp_requirements || [],
        };
      }
    }

    return {
      proposal_id: proposalId,
      section_type: config.type,
      section_order: config.order,
      title: config.title,
      generation_status: GenerationStatus.PENDING,
      ...(metadata ? { metadata } : {}),
    };
  });
}
