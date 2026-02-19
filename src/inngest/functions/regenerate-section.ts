import { inngest } from "../client";
import { regenerateSection } from "@/lib/ai/pipeline/regenerate";
import { createLogger } from "@/lib/utils/logger";

/**
 * Inngest function: Regenerate a single proposal section.
 *
 * Triggered by: section/regenerate.requested
 *
 * Wraps the existing regenerateSection() pipeline function with
 * durable execution (retries + timeout).
 */
export const regenerateSectionFn = inngest.createFunction(
  {
    id: "regenerate-section",
    retries: 3,
  },
  { event: "section/regenerate.requested" },
  async ({ event, step }) => {
    const { proposalId, sectionId, qualityFeedback } = event.data;

    const log = createLogger({
      operation: "inngest:regenerate-section",
      proposalId,
      sectionId,
    });

    const result = await step.run("regenerate", async () => {
      try {
        await regenerateSection(
          proposalId,
          sectionId,
          qualityFeedback ?? null,
        );
        return { success: true };
      } catch (err) {
        log.error("Section regeneration failed", {
          error: err instanceof Error ? err.message : String(err),
        });
        throw err; // Re-throw so Inngest retries
      }
    });

    return { proposalId, sectionId, ...result };
  },
);
