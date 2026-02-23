import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { GenerationStatus, ProposalStatus } from "@/lib/constants/statuses";
import { createProposalVersion } from "@/lib/versioning/create-version";
import { createLogger } from "@/lib/utils/logger";
import { createPipelineMetrics } from "@/lib/observability/metrics";
import { buildSectionList } from "@/lib/ai/pipeline/section-configs";
import { buildPipelineContext } from "@/lib/ai/pipeline/context";
import { extractDifferentiators } from "@/lib/ai/pipeline/differentiators";
import { generateSingleSection } from "./generate-single-section";
import type { PipelineContext, RfpTaskStructure } from "@/lib/ai/pipeline/types";

const log = createLogger({ operation: "generate-proposal" });

/**
 * Inngest function: Generate a full proposal.
 *
 * Triggered by: proposal/generate.requested
 * Steps:
 *   1. Build pipeline context + create section rows
 *   2-11. Generate each section (fan-out, individually retryable)
 *   12. Finalize proposal status
 *   13. Send proposal/generated event (triggers quality review + compliance)
 *
 * IMPORTANT: The finalize step must NEVER throw when all sections fail.
 * Throwing causes Inngest to retry the entire function, which deletes
 * all sections (idempotent cleanup) and retries generation — creating
 * a loop where the user sees sections appear briefly then vanish.
 * Instead, finalize sets status to DRAFT and returns gracefully.
 */
export const generateProposalFn = inngest.createFunction(
  {
    id: "generate-proposal",
    // CRITICAL: retries must be 0 to prevent the deadly retry loop.
    // When the function retries, build-context re-runs and DELETES all
    // existing sections — including ones that already completed successfully.
    // This causes the user to see sections appear, then vanish.
    // Individual steps still get their own retries (default 3 per step).
    retries: 0,
    cancelOn: [
      {
        event: "proposal/generate.cancelled",
        match: "data.proposalId",
      },
    ],
    // When the function fails permanently (a step exhausted its retries),
    // ensure the proposal doesn't stay stuck in "generating" forever.
    onFailure: async ({ event }) => {
      const proposalId = event.data.event?.data?.proposalId;
      if (!proposalId) return;

      const failLog = createLogger({ operation: "generate-proposal-failure", proposalId });
      failLog.error("Proposal generation PERMANENTLY FAILED", {
        error: event.data.error?.message,
        functionId: event.data.function_id,
      });

      const supabase = createAdminClient();

      // Check if any sections completed (partial success)
      const { data: sections } = await supabase
        .from("proposal_sections")
        .select("generation_status")
        .eq("proposal_id", proposalId);

      const completedCount = sections?.filter(
        (s) => s.generation_status === GenerationStatus.COMPLETED
      ).length ?? 0;

      if (completedCount > 0) {
        // Partial success — move to review with warning
        await supabase
          .from("proposals")
          .update({
            status: ProposalStatus.REVIEW,
            generation_completed_at: new Date().toISOString(),
            generation_error: `Generation partially failed: ${completedCount} of ${sections?.length ?? 0} sections completed. Some sections failed permanently. You can regenerate failed sections individually.`,
          })
          .eq("id", proposalId);
        failLog.info("Partial success — moved to review", { completedCount, total: sections?.length });
      } else {
        // Total failure — revert to draft
        await supabase
          .from("proposals")
          .update({
            status: ProposalStatus.DRAFT,
            generation_completed_at: new Date().toISOString(),
            generation_error: `Generation failed: ${event.data.error?.message || "Unknown error"}. Please try again.`,
          })
          .eq("id", proposalId);
        failLog.error("Total failure — reverted to draft");
      }
    },
  },
  { event: "proposal/generate.requested" },
  async ({ event, step }) => {
    const { proposalId } = event.data;
    log.info("Starting proposal generation", { proposalId });

    // Step 1: Build context and create section rows
    const setup = await step.run("build-context", async () => {
      const stepLog = createLogger({ operation: "build-context", proposalId });
      const supabase = createAdminClient();

      stepLog.info("Building pipeline context...");
      const ctx = await buildPipelineContext(supabase, proposalId);
      stepLog.info("Pipeline context built successfully", {
        organizationId: ctx.organizationId,
        hasWinStrategy: !!ctx.winStrategy,
        l1ContextLength: ctx.l1ContextString.length,
        enhancedAnalysisLength: ctx.enhancedAnalysis.length,
      });

      // Delete existing sections — safe because this is the first step
      // and individual section generation steps are separately retryable
      await supabase
        .from("proposal_sections")
        .delete()
        .eq("proposal_id", proposalId);

      // Read task structure from the proposal (may be null)
      const rfpTaskStructure = (ctx.proposal.rfp_task_structure as RfpTaskStructure | null) ?? null;

      // Determine which sections to generate (task-mirrored or fixed)
      const solicitationType = (ctx.intakeData.solicitation_type as string) || "RFP";
      const applicableSections = buildSectionList(rfpTaskStructure, solicitationType);
      stepLog.info("Section list built", {
        sectionCount: applicableSections.length,
        solicitationType,
        hasTaskStructure: !!rfpTaskStructure,
        sectionTypes: applicableSections.map(s => s.type),
      });

      // Create section rows with optional task metadata
      const sectionInserts = applicableSections.map((config) => ({
        proposal_id: proposalId,
        section_type: config.type,
        section_order: config.order,
        title: config.title,
        generation_status: GenerationStatus.PENDING,
        ...(config.taskMeta ? { metadata: config.taskMeta } : {}),
      }));

      const { data: sections, error: sectionError } = await supabase
        .from("proposal_sections")
        .insert(sectionInserts)
        .select("id, section_type, title");

      if (sectionError || !sections) {
        stepLog.error("Failed to create section rows", { error: sectionError?.message });
        throw new Error(
          `Failed to create sections: ${sectionError?.message}`,
        );
      }

      stepLog.info("Section rows created", { count: sections.length });

      // Return serializable context for subsequent steps
      return {
        pipelineContext: ctx,
        sections: sections.map((s) => ({
          id: s.id,
          sectionType: s.section_type,
          title: s.title,
        })),
      };
    });

    const { pipelineContext: serializedCtx, sections } = setup;

    // Inngest step serialization strips `undefined` values from the context
    // (JSON.stringify omits undefined). Reconstruct with explicit defaults
    // so downstream code can check `=== undefined` instead of `=== null`.
    const ctx: PipelineContext = {
      ...serializedCtx,
      serviceLine: serializedCtx.serviceLine ?? undefined,
      industry: serializedCtx.industry ?? undefined,
      primaryBrandName: serializedCtx.primaryBrandName ?? undefined,
      audienceProfile: serializedCtx.audienceProfile ?? undefined,
      // These may also be lost through serialization
      brandVoice: serializedCtx.brandVoice ?? null,
      winStrategy: serializedCtx.winStrategy ?? null,
      outcomeContract: serializedCtx.outcomeContract ?? null,
      industryConfig: serializedCtx.industryConfig ?? null,
    };

    const metrics = createPipelineMetrics(
      proposalId,
      ctx.organizationId,
      {
        industry: ctx.industry,
        opportunityType: ctx.serviceLine,
      },
    );

    // Step 2: Generate executive summary FIRST (needed for differentiator extraction)
    // If exec summary fails, remaining sections still generate without the repetition limiter.
    const execSection = sections.find((s) => s.sectionType === "executive_summary");
    let differentiators: string[] = [];
    let execFailed = false;

    if (execSection) {
      try {
        const execResult = await step.run("section-executive_summary", async () => {
          log.info("Generating executive summary", { sectionId: execSection.id, proposalId });
          const result = await generateSingleSection(
            execSection.id,
            execSection.sectionType,
            ctx,
          );
          log.info("Executive summary generated", {
            proposalId,
            chunkCount: result.chunkCount,
            contentLength: result.generatedContent?.length ?? 0,
          });
          return result;
        });

        // Extract differentiators from the generated executive summary
        if (execResult.generatedContent) {
          differentiators = extractDifferentiators(execResult.generatedContent);
          log.info("Differentiators extracted", { count: differentiators.length, proposalId });
        }
      } catch (err) {
        // Exec summary failed — continue without repetition limiter (graceful degradation)
        execFailed = true;
        log.error("Executive summary generation FAILED — continuing without repetition limiter", {
          proposalId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Steps 3-N: Generate remaining sections in parallel with differentiators
    const remainingSections = sections.filter(
      (s) => s.sectionType !== "executive_summary",
    );

    log.info("Starting parallel section generation", {
      proposalId,
      sectionCount: remainingSections.length,
      differentiatorCount: differentiators.length,
    });

    const remainingResults = await Promise.allSettled(
      remainingSections.map((section) => {
        // Use title-based step ID for rfp_task sections to avoid duplicate step names
        const stepId = section.sectionType === "rfp_task"
          ? `section-rfp_task-${section.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 50)}`
          : `section-${section.sectionType}`;
        return step.run(stepId, async () => {
          log.info(`Generating section: ${section.sectionType}`, {
            proposalId,
            sectionId: section.id,
            stepId,
          });
          const result = await generateSingleSection(
            section.id,
            section.sectionType,
            ctx,
            differentiators,
          );
          log.info(`Section generated: ${section.sectionType}`, {
            proposalId,
            sectionId: section.id,
            chunkCount: result.chunkCount,
            contentLength: result.generatedContent?.length ?? 0,
          });
          return result;
        });
      }),
    );

    // Log individual section results for debugging
    remainingResults.forEach((r, i) => {
      const section = remainingSections[i];
      if (r.status === "rejected") {
        log.error(`Section FAILED: ${section.sectionType}`, {
          proposalId,
          sectionId: section.id,
          error: r.reason?.message || String(r.reason),
        });
      }
    });

    // Combine results for tracking: exec summary (if it ran) + remaining
    // Build a map of sectionType -> result for the return value
    const sectionResultMap = new Map<string, { status: string; error?: string }>();
    if (execSection) {
      sectionResultMap.set("executive_summary", {
        status: execFailed ? "rejected" : "fulfilled",
        ...(execFailed ? { error: "Executive summary generation failed" } : {}),
      });
    }
    remainingResults.forEach((r, i) => {
      const sectionType = remainingSections[i].sectionType;
      sectionResultMap.set(sectionType, {
        status: r.status,
        ...(r.status === "rejected" ? { error: (r as PromiseRejectedResult).reason?.message || "Unknown" } : {}),
      });
    });

    // Step 12: Finalize proposal status
    // CRITICAL: This step must NEVER throw. If all sections failed, we set
    // status to DRAFT and return gracefully. Throwing here triggers Inngest
    // retries which re-run build-context → delete sections → retry generation,
    // creating the "sections appear then vanish" bug the user reported.
    const result = await step.run("finalize", async () => {
      const supabase = createAdminClient();
      const finalizeLog = createLogger({ operation: "finalize", proposalId });

      // Count outcomes from DB (source of truth)
      const { data: finalSections, error: fetchError } = await supabase
        .from("proposal_sections")
        .select("id, section_type, generation_status, generation_error")
        .eq("proposal_id", proposalId);

      if (fetchError) {
        finalizeLog.error("Failed to fetch final section statuses", { error: fetchError.message });
      }

      const completedCount =
        finalSections?.filter((s) => s.generation_status === GenerationStatus.COMPLETED)
          .length ?? 0;
      const failedCount =
        finalSections?.filter((s) => s.generation_status === GenerationStatus.FAILED)
          .length ?? 0;
      const pendingCount =
        finalSections?.filter((s) => s.generation_status === GenerationStatus.PENDING)
          .length ?? 0;
      const totalCount = finalSections?.length ?? 0;

      finalizeLog.info("Section generation results", {
        total: totalCount,
        completed: completedCount,
        failed: failedCount,
        pending: pendingCount,
        failedSections: finalSections
          ?.filter((s) => s.generation_status === GenerationStatus.FAILED)
          .map((s) => ({ type: s.section_type, error: s.generation_error })),
      });

      if (completedCount === 0) {
        // All sections failed — set status to DRAFT but DO NOT throw.
        // Throwing causes Inngest to retry the entire function, creating
        // a destructive loop (delete sections → regenerate → fail → repeat).
        const errorMsg = `All ${failedCount} sections failed to generate. Check AI service connectivity and retry.`;
        await supabase
          .from("proposals")
          .update({
            status: ProposalStatus.DRAFT,
            generation_error: errorMsg,
            generation_completed_at: new Date().toISOString(),
          })
          .eq("id", proposalId);

        finalizeLog.error("ALL sections failed — proposal reverted to draft", {
          failedCount,
          errorMsg,
        });

        // Return gracefully instead of throwing
        return { completedCount: 0, failedCount, allFailed: true };
      }

      // Set status to review
      await supabase
        .from("proposals")
        .update({
          status: ProposalStatus.REVIEW,
          generation_completed_at: new Date().toISOString(),
          ...(failedCount > 0
            ? {
                generation_error: `${failedCount} of ${completedCount + failedCount} sections failed. You can regenerate failed sections individually.`,
              }
            : { generation_error: null }),
        })
        .eq("id", proposalId);

      finalizeLog.info("Proposal finalized successfully", {
        completedCount,
        failedCount,
        status: ProposalStatus.REVIEW,
      });

      // Version snapshot (non-blocking)
      try {
        await createProposalVersion({
          proposalId,
          triggerEvent: "generation_complete",
          changeSummary: `AI generation completed: ${completedCount} sections${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
          label: "Initial Generation",
        });
      } catch (versionErr) {
        finalizeLog.warn("Version snapshot failed", {
          error:
            versionErr instanceof Error
              ? versionErr.message
              : String(versionErr),
        });
      }

      return { completedCount, failedCount, allFailed: false };
    });

    metrics.finish();

    // Step 13: Send completion event (triggers quality review + compliance in parallel)
    // Only send if at least some sections succeeded
    if (result.completedCount > 0) {
      const allSucceeded =
        result.failedCount === 0;
      await step.sendEvent("send-completion", {
        name: "proposal/generated",
        data: {
          proposalId,
          allSectionsSucceeded: allSucceeded,
        },
      });
    }

    log.info("Proposal generation function complete", {
      proposalId,
      completed: result.completedCount,
      failed: result.failedCount,
      allFailed: result.allFailed,
    });

    return {
      proposalId,
      completed: result.completedCount,
      failed: result.failedCount,
      allFailed: result.allFailed,
      sectionResults: sections.map((s) => {
        const r = sectionResultMap.get(s.sectionType);
        return {
          section: s.sectionType,
          status: r?.status || "unknown",
          ...(r?.error ? { error: r.error } : {}),
        };
      }),
    };
  },
);
