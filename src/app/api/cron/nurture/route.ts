import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNurtureEmail } from "@/lib/email/send-nurture-email";

// Vercel cron configuration
export const dynamic = "force-dynamic";

// Step definitions: which step number maps to how many days after signup
const NURTURE_STEPS = [
  { step: 1 as const, daysAgo: 1 },
  { step: 2 as const, daysAgo: 3 },
  { step: 3 as const, daysAgo: 7 },
  { step: 4 as const, daysAgo: 14 },
];

export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 },
    );
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error("[NURTURE-CRON] Unauthorized request — invalid cron secret");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  let totalSent = 0;
  let totalErrors = 0;

  for (const { step, daysAgo } of NURTURE_STEPS) {
    try {
      // Calculate the target date window (1-day window starting from daysAgo)
      const windowStart = new Date(Date.now() - (daysAgo + 1) * 86400000);
      const windowEnd = new Date(Date.now() - daysAgo * 86400000);

      console.log(
        `[NURTURE-CRON] Step ${step}: checking for entries created between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`,
      );

      // Query waitlist entries that are eligible for this nurture step
      const { data: entries, error: queryError } = await supabase
        .from("waitlist")
        .select("id, name, email, company, nurture_step")
        .eq("status", "pending")
        .lt("nurture_step", step)
        .gte("created_at", windowStart.toISOString())
        .lt("created_at", windowEnd.toISOString());

      if (queryError) {
        console.error(
          `[NURTURE-CRON] Query error for step ${step}:`,
          queryError,
        );
        totalErrors++;
        continue;
      }

      if (!entries || entries.length === 0) {
        console.log(`[NURTURE-CRON] Step ${step}: no eligible entries`);
        continue;
      }

      console.log(
        `[NURTURE-CRON] Step ${step}: found ${entries.length} eligible entries`,
      );

      for (const entry of entries) {
        const { success } = await sendNurtureEmail({
          step,
          name: entry.name,
          email: entry.email,
          company: entry.company,
        });

        if (success) {
          // Update nurture tracking
          const { error: updateError } = await supabase
            .from("waitlist")
            .update({
              nurture_step: step,
              nurture_last_sent_at: new Date().toISOString(),
            })
            .eq("id", entry.id);

          if (updateError) {
            console.error(
              `[NURTURE-CRON] Failed to update nurture_step for ${entry.email}:`,
              updateError,
            );
            totalErrors++;
          } else {
            totalSent++;
          }
        } else {
          totalErrors++;
        }
      }
    } catch (err) {
      console.error(`[NURTURE-CRON] Unexpected error for step ${step}:`, err);
      totalErrors++;
    }
  }

  console.log(
    `[NURTURE-CRON] Complete: sent=${totalSent}, errors=${totalErrors}`,
  );

  return NextResponse.json({
    sent: totalSent,
    errors: totalErrors,
  });
}
