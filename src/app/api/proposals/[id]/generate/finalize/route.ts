/**
 * POST /api/proposals/[id]/generate/finalize
 *
 * Client-orchestrated generation: Step 3 (final).
 * Counts completed/failed sections, updates proposal status,
 * creates version snapshot, clears generation_metadata, and
 * triggers quality review + compliance assessment via Inngest.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import { GenerationStatus, ProposalStatus } from "@/lib/constants/statuses";
import { createProposalVersion } from "@/lib/versioning/create-version";
import { createLogger } from "@/lib/utils/logger";
import { ok, serverError, withProposalRoute } from "@/lib/api/response";

export const maxDuration = 30;

export const POST = withProposalRoute(async (_request, { id }, _context) => {
  const log = createLogger({
    operation: "generate-finalize",
    proposalId: id,
  });
  const supabase = createAdminClient();

  // Count outcomes from DB (source of truth)
  const { data: sections, error: fetchError } = await supabase
    .from("proposal_sections")
    .select("id, section_type, generation_status, generation_error")
    .eq("proposal_id", id);

  if (fetchError) {
    log.error("Failed to fetch section statuses", {
      error: fetchError.message,
    });
    return serverError("Failed to finalize proposal");
  }

  // Mark non-terminal sections as failed
  const nonTerminalIds = markNonTerminal(sections);
  if (nonTerminalIds.length > 0) {
    await supabase
      .from("proposal_sections")
      .update({
        generation_status: GenerationStatus.FAILED,
        generation_error:
          "Generation did not complete for this section. Please regenerate.",
      })
      .in("id", nonTerminalIds);
  }

  const { completedCount, failedCount, finalStatus, generationError } =
    computeOutcome(sections, nonTerminalIds);

  log.info("Section generation results", {
    total: sections?.length ?? 0,
    completed: completedCount,
    failed: failedCount,
  });

  // Update proposal status — keep generation_metadata for section regeneration
  await supabase
    .from("proposals")
    .update({
      status: finalStatus,
      generation_completed_at: new Date().toISOString(),
      generation_error: generationError,
    })
    .eq("id", id);

  // Version snapshot + quality/compliance triggers (non-blocking)
  await runPostGeneration(id, completedCount, failedCount, log);

  return ok({ completedCount, failedCount, status: finalStatus });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

type SectionRow = {
  id: string;
  section_type: string;
  generation_status: string;
  generation_error: string | null;
};

function markNonTerminal(sections: SectionRow[] | null): string[] {
  return (
    sections
      ?.filter(
        (s) =>
          s.generation_status === GenerationStatus.PENDING ||
          s.generation_status === GenerationStatus.GENERATING,
      )
      .map((s) => s.id) ?? []
  );
}

function computeOutcome(
  sections: SectionRow[] | null,
  nonTerminalIds: string[],
) {
  const completedCount =
    sections?.filter((s) => s.generation_status === GenerationStatus.COMPLETED)
      .length ?? 0;
  const failedCount =
    (sections?.filter((s) => s.generation_status === GenerationStatus.FAILED)
      .length ?? 0) + nonTerminalIds.length;
  const totalCount = sections?.length ?? 0;

  const finalStatus =
    completedCount > 0 ? ProposalStatus.REVIEW : ProposalStatus.DRAFT;
  const generationError =
    completedCount === 0
      ? `All ${failedCount} sections failed to generate. Check AI service connectivity and retry.`
      : failedCount > 0
        ? `${failedCount} of ${totalCount} sections failed. You can regenerate failed sections individually.`
        : null;

  return { completedCount, failedCount, finalStatus, generationError };
}

async function runPostGeneration(
  proposalId: string,
  completedCount: number,
  failedCount: number,
  log: ReturnType<typeof createLogger>,
) {
  if (completedCount > 0) {
    // Version snapshot
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
          versionErr instanceof Error ? versionErr.message : String(versionErr),
      });
    }

    // Trigger quality review + compliance assessment via Inngest
    // Same event contract as the Inngest generate-proposal function
    try {
      await inngest.send({
        name: "proposal/generated",
        data: {
          proposalId,
          allSectionsSucceeded: failedCount === 0,
        },
      });
      log.info("Quality/compliance triggers sent", { proposalId });
    } catch (triggerErr) {
      log.warn("Failed to trigger quality/compliance", {
        error:
          triggerErr instanceof Error ? triggerErr.message : String(triggerErr),
      });
    }
  }
}
