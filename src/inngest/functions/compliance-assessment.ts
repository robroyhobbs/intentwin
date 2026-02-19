import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { runComplianceAssessment } from "@/lib/ai/compliance-assessor";
import { createLogger } from "@/lib/utils/logger";

/**
 * Inngest function: Run compliance assessment on a proposal.
 *
 * Triggered by:
 *   - "proposal/generated" (auto, after generation completes)
 *   - "proposal/compliance.requested" (manual trigger from UI)
 *
 * The function wraps the existing runComplianceAssessment() pipeline function.
 * Inngest handles retries (3x exponential backoff) and timeout.
 */
export const complianceAssessmentFn = inngest.createFunction(
  {
    id: "compliance-assessment",
    retries: 3,
    cancelOn: [
      {
        event: "proposal/compliance.cancelled",
        match: "data.proposalId",
      },
    ],
  },
  [
    { event: "proposal/generated" },
    { event: "proposal/compliance.requested" },
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
      operation: "inngest:compliance-assessment",
      proposalId,
    });

    // Run the compliance assessment as a single durable step
    const result = await step.run("run-assessment", async () => {
      try {
        await runComplianceAssessment(proposalId, trigger);
        return { success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        log.error("Compliance assessment failed", {
          error: errorMessage,
        });

        // Ensure DB status is set to failed (preserve existing data)
        try {
          const supabase = createAdminClient();
          // Read current state first to preserve partial results
          const { data: current } = await supabase
            .from("proposals")
            .select("compliance_assessment")
            .eq("id", proposalId)
            .single();
          const existing = (current?.compliance_assessment as Record<string, unknown>) || {};

          // Only update if still in "assessing" state (avoid clobbering a concurrent success)
          if (existing.status === "assessing") {
            await supabase
              .from("proposals")
              .update({
                compliance_assessment: {
                  ...existing,
                  status: "failed",
                  error: errorMessage,
                  assessed_at: new Date().toISOString(),
                },
              })
              .eq("id", proposalId);
          }
        } catch (cleanupErr) {
          log.error("Failed to clean up assessment status", {
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
