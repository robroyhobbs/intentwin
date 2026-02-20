import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { WaitlistStatus } from "@/lib/constants/statuses";
import { sendNurtureEmail } from "@/lib/email/send-nurture-email";
import { createLogger } from "@/lib/utils/logger";

// Step definitions: which step number maps to how many days after signup
const NURTURE_STEPS = [
  { step: 1 as const, daysAgo: 1 },
  { step: 2 as const, daysAgo: 3 },
  { step: 3 as const, daysAgo: 7 },
  { step: 4 as const, daysAgo: 14 },
];

/**
 * Inngest function: Send nurture emails on a daily schedule.
 *
 * Replaces the Vercel cron at /api/cron/nurture.
 * Each nurture step is its own Inngest step for individual retryability.
 */
export const nurtureCronFn = inngest.createFunction(
  {
    id: "nurture-cron",
    retries: 2,
  },
  { cron: "0 9 * * *" }, // Daily at 9 AM UTC
  async ({ step }) => {
    const log = createLogger({ operation: "inngest:nurture-cron" });
    let totalSent = 0;
    let totalErrors = 0;

    for (const { step: nurtureStep, daysAgo } of NURTURE_STEPS) {
      const result = await step.run(
        `nurture-step-${nurtureStep}`,
        async () => {
          const supabase = createAdminClient();
          let sent = 0;
          let errors = 0;

          // Calculate the target date window
          const windowStart = new Date(
            Date.now() - (daysAgo + 1) * 86400000,
          );
          const windowEnd = new Date(Date.now() - daysAgo * 86400000);

          log.info(
            `Step ${nurtureStep}: checking window ${windowStart.toISOString()} to ${windowEnd.toISOString()}`,
          );

          // Query eligible waitlist entries
          const { data: entries, error: queryError } = await supabase
            .from("waitlist")
            .select("id, name, email, company, nurture_step")
            .eq("status", WaitlistStatus.PENDING)
            .lt("nurture_step", nurtureStep)
            .gte("created_at", windowStart.toISOString())
            .lt("created_at", windowEnd.toISOString());

          if (queryError) {
            log.error(`Query error for step ${nurtureStep}`, {
              error: queryError,
            });
            return { sent: 0, errors: 1 };
          }

          if (!entries || entries.length === 0) {
            return { sent: 0, errors: 0 };
          }

          // Send emails
          const successfulIds: string[] = [];
          for (const entry of entries) {
            const { success } = await sendNurtureEmail({
              step: nurtureStep,
              name: entry.name,
              email: entry.email,
              company: entry.company,
            });

            if (success) {
              successfulIds.push(entry.id);
            } else {
              errors++;
            }
          }

          // Batch update successful entries
          if (successfulIds.length > 0) {
            const { error: updateError } = await supabase
              .from("waitlist")
              .update({
                nurture_step: nurtureStep,
                nurture_last_sent_at: new Date().toISOString(),
              })
              .in("id", successfulIds);

            if (updateError) {
              log.error(
                `Batch update failed for step ${nurtureStep}`,
                { error: updateError },
              );
              errors += successfulIds.length;
            } else {
              sent += successfulIds.length;
            }
          }

          return { sent, errors };
        },
      );

      totalSent += result.sent;
      totalErrors += result.errors;
    }

    log.info(
      `Nurture cron complete: sent=${totalSent}, errors=${totalErrors}`,
    );

    return { sent: totalSent, errors: totalErrors };
  },
);
