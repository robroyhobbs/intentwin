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

export const maxDuration = 60;

/** Max time to wait for in-flight sections to reach terminal state */
const SETTLE_TIMEOUT_MS = 30_000;
const SETTLE_POLL_MS = 2_000;

export const POST = withProposalRoute(async (_request, { id }, _context) => {
  const log = createLogger({
    operation: "generate-finalize",
    proposalId: id,
  });
  const supabase = createAdminClient();

  // Wait for all sections to reach terminal state before finalizing.
  // This prevents the race condition where finalize marks still-generating
  // sections as FAILED because the client called us too early.
  const sections = await waitForTerminalState(supabase, id, log);
  if (!sections) {
    return serverError("Failed to finalize proposal");
  }

  // Mark any remaining non-terminal sections as failed (only after timeout)
  const nonTerminalIds = markNonTerminal(sections);
  if (nonTerminalIds.length > 0) {
    log.warn("Marking timed-out sections as failed", {
      count: nonTerminalIds.length,
    });
    await supabase
      .from("proposal_sections")
      .update({
        generation_status: GenerationStatus.FAILED,
        generation_error:
          "Generation did not complete within the time limit. Please regenerate.",
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

const TERMINAL_STATES: Set<string> = new Set([
  GenerationStatus.COMPLETED,
  GenerationStatus.FAILED,
]);

function allTerminal(sections: SectionRow[]): boolean {
  return sections.every((s) => TERMINAL_STATES.has(s.generation_status));
}

async function waitForTerminalState(
  supabase: ReturnType<typeof createAdminClient>,
  proposalId: string,
  log: ReturnType<typeof createLogger>,
): Promise<SectionRow[] | null> {
  const deadline = Date.now() + SETTLE_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const { data: sections, error } = await supabase
      .from("proposal_sections")
      .select("id, section_type, generation_status, generation_error")
      .eq("proposal_id", proposalId);

    if (error) {
      log.error("Failed to fetch section statuses", {
        error: error.message,
      });
      return null;
    }

    if (!sections || sections.length === 0) {
      log.warn("No sections found for proposal");
      return sections ?? [];
    }

    if (allTerminal(sections)) {
      return sections;
    }

    const pending = sections.filter(
      (s) => !TERMINAL_STATES.has(s.generation_status),
    );
    log.info("Waiting for sections to settle", {
      pending: pending.length,
      total: sections.length,
    });

    await new Promise((r) => setTimeout(r, SETTLE_POLL_MS));
  }

  // Timeout — fetch final state and let caller handle non-terminal sections
  log.warn("Settle timeout reached, proceeding with current state");
  const { data: finalSections, error: finalErr } = await supabase
    .from("proposal_sections")
    .select("id, section_type, generation_status, generation_error")
    .eq("proposal_id", proposalId);

  if (finalErr) {
    log.error("Failed to fetch sections after timeout", {
      error: finalErr.message,
    });
    return null;
  }

  return finalSections ?? [];
}

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
