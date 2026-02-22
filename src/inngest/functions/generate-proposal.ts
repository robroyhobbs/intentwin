import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { GenerationStatus, ProposalStatus } from "@/lib/constants/statuses";
import { createProposalVersion } from "@/lib/versioning/create-version";
import { createLogger } from "@/lib/utils/logger";
import { createPipelineMetrics } from "@/lib/observability/metrics";
import { getSectionsForSolicitationType } from "@/lib/ai/pipeline/section-configs";
import { buildPipelineContext } from "@/lib/ai/pipeline/context";
import { extractDifferentiators } from "@/lib/ai/pipeline/differentiators";
import { generateSingleSection } from "./generate-single-section";
import type { PipelineContext } from "@/lib/ai/pipeline/types";

/**
 * Inngest function: Generate a full proposal.
 *
 * Triggered by: proposal/generate.requested
 * Steps:
 *   1. Build pipeline context + create section rows
 *   2-11. Generate each section (fan-out, individually retryable)
 *   12. Finalize proposal status
 *   13. Send proposal/generated event (triggers quality review + compliance)
 */
export const generateProposalFn = inngest.createFunction(
  {
    id: "generate-proposal",
    retries: 3,
    cancelOn: [
      {
        event: "proposal/generate.cancelled",
        match: "data.proposalId",
      },
    ],
  },
  { event: "proposal/generate.requested" },
  async ({ event, step }) => {
    const { proposalId } = event.data;

    // Step 1: Build context and create section rows
    const setup = await step.run("build-context", async () => {
      const supabase = createAdminClient();

      const ctx = await buildPipelineContext(supabase, proposalId);

      // Delete existing sections (idempotent)
      await supabase
        .from("proposal_sections")
        .delete()
        .eq("proposal_id", proposalId);

      // Determine which sections to generate based on solicitation type
      const solicitationType = (ctx.intakeData.solicitation_type as string) || "RFP";
      const applicableSections = getSectionsForSolicitationType(solicitationType);

      // Create section rows (filtered by solicitation type)
      const sectionInserts = applicableSections.map((config) => ({
        proposal_id: proposalId,
        section_type: config.type,
        section_order: config.order,
        title: config.title,
        generation_status: GenerationStatus.PENDING,
      }));

      const { data: sections, error: sectionError } = await supabase
        .from("proposal_sections")
        .insert(sectionInserts)
        .select("id, section_type");

      if (sectionError || !sections) {
        throw new Error(
          `Failed to create sections: ${sectionError?.message}`,
        );
      }

      // Return serializable context for subsequent steps
      return {
        pipelineContext: ctx,
        sections: sections.map((s) => ({
          id: s.id,
          sectionType: s.section_type,
        })),
      };
    });

    const { pipelineContext: serializedCtx, sections } = setup;

    // Inngest step serialization can strip `undefined` values from the context.
    // Reconstruct with explicit defaults to satisfy PipelineContext type.
    const ctx: PipelineContext = {
      ...serializedCtx,
      serviceLine: serializedCtx.serviceLine ?? undefined,
      industry: serializedCtx.industry ?? undefined,
      primaryBrandName: serializedCtx.primaryBrandName ?? undefined,
      audienceProfile: serializedCtx.audienceProfile ?? undefined,
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
          return generateSingleSection(
            execSection.id,
            execSection.sectionType,
            ctx,
          );
        });

        // Extract differentiators from the generated executive summary
        if (execResult.generatedContent) {
          differentiators = extractDifferentiators(execResult.generatedContent);
        }
      } catch {
        // Exec summary failed — continue without repetition limiter (graceful degradation)
        execFailed = true;
      }
    }

    // Steps 3-N: Generate remaining sections in parallel with differentiators
    const remainingSections = sections.filter(
      (s) => s.sectionType !== "executive_summary",
    );

    const remainingResults = await Promise.allSettled(
      remainingSections.map((section) =>
        step.run(`section-${section.sectionType}`, async () => {
          return generateSingleSection(
            section.id,
            section.sectionType,
            ctx,
            differentiators,
          );
        }),
      ),
    );

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
    const result = await step.run("finalize", async () => {
      const supabase = createAdminClient();

      // Count outcomes from DB (source of truth)
      const { data: finalSections } = await supabase
        .from("proposal_sections")
        .select("generation_status")
        .eq("proposal_id", proposalId);

      const completedCount =
        finalSections?.filter((s) => s.generation_status === GenerationStatus.COMPLETED)
          .length ?? 0;
      const failedCount =
        finalSections?.filter((s) => s.generation_status === GenerationStatus.FAILED)
          .length ?? 0;

      const log = createLogger({
        operation: "generateProposal",
        proposalId,
      });

      if (completedCount === 0) {
        await supabase
          .from("proposals")
          .update({ status: ProposalStatus.DRAFT })
          .eq("id", proposalId);
        throw new Error(
          `All ${failedCount} sections failed to generate`,
        );
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

      // Version snapshot (non-blocking)
      try {
        await createProposalVersion({
          proposalId,
          triggerEvent: "generation_complete",
          changeSummary: `AI generation completed: ${completedCount} sections${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
          label: "Initial Generation",
        });
      } catch (versionErr) {
        log.warn("Version snapshot failed", {
          error:
            versionErr instanceof Error
              ? versionErr.message
              : String(versionErr),
        });
      }

      return { completedCount, failedCount };
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

    return {
      proposalId,
      completed: result.completedCount,
      failed: result.failedCount,
      sectionResults: sections.map((s) => {
        const result = sectionResultMap.get(s.sectionType);
        return {
          section: s.sectionType,
          status: result?.status || "unknown",
          ...(result?.error ? { error: result.error } : {}),
        };
      }),
    };
  },
);
