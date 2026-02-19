import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { runQualityReview } from "@/lib/ai/quality-overseer";
import { createLogger } from "@/lib/utils/logger";

/**
 * Inngest function: Run quality review on a proposal.
 *
 * Triggered by:
 *   - "proposal/generated" (auto, after generation completes)
 *   - "proposal/quality-review.requested" (manual trigger from UI)
 *
 * The function wraps the existing runQualityReview() pipeline function.
 * Inngest handles retries (3x exponential backoff) and timeout.
 * Error cleanup sets quality_review.status = "failed" in the DB.
 */
export const qualityReviewFn = inngest.createFunction(
  {
    id: "quality-review",
    retries: 3,
    cancelOn: [
      {
        event: "proposal/quality-review.cancelled",
        match: "data.proposalId",
      },
    ],
  },
  [
    { event: "proposal/generated" },
    { event: "proposal/quality-review.requested" },
  ],
  async ({ event, step }) => {
    const { proposalId } = event.data;
    const trigger =
      event.name === "proposal/generated"
        ? "auto_post_generation"
        : ((event.data as { trigger?: string }).trigger as
            | "manual"
            | "auto_post_generation") ?? "manual";

    const log = createLogger({
      operation: "inngest:quality-review",
      proposalId,
    });

    // For auto triggers after generation, only run if all sections succeeded
    if (
      event.name === "proposal/generated" &&
      (event.data as { allSectionsSucceeded?: boolean })
        .allSectionsSucceeded === false
    ) {
      log.info(
        "Skipping auto quality review — not all sections succeeded",
      );
      return { skipped: true, reason: "partial_generation" };
    }

    // Run the quality review as a single durable step
    const result = await step.run("run-review", async () => {
      try {
        await runQualityReview(proposalId, trigger);
        return { success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        log.error("Quality review failed", { error: errorMessage });

        // Ensure DB status is set to failed (belt and suspenders)
        try {
          const supabase = createAdminClient();
          const { data: current } = await supabase
            .from("proposals")
            .select("quality_review")
            .eq("id", proposalId)
            .single();

          const qr =
            (current?.quality_review as Record<string, unknown>) || {};
          if (qr.status === "reviewing") {
            await supabase
              .from("proposals")
              .update({
                quality_review: {
                  ...qr,
                  status: "failed",
                  error: errorMessage,
                },
              })
              .eq("id", proposalId);
          }
        } catch (cleanupErr) {
          log.error("Failed to clean up review status", {
            error:
              cleanupErr instanceof Error
                ? cleanupErr.message
                : String(cleanupErr),
          });
        }

        throw err; // Re-throw so Inngest retries
      }
    });

    return { proposalId, ...result };
  },
);
