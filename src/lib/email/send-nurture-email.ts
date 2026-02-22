import { resend } from "./resend";
import { nurtureDay1Email } from "./templates/nurture-day1";
import { nurtureDay3Email } from "./templates/nurture-day3";
import { nurtureDay7Email } from "./templates/nurture-day7";
import { nurtureDay14Email } from "./templates/nurture-day14";
import { logger } from "@/lib/utils/logger";

type NurtureStep = 1 | 2 | 3 | 4;

interface SendNurtureEmailParams {
  step: NurtureStep;
  name: string;
  email: string;
  company: string;
}

const SUBJECT_LINES: Record<NurtureStep, (firstName: string) => string> = {
  1: () => "The #1 reason proposals lose (it's not price)",
  2: () => "Inside the engine: how IntentBid makes every section persuasive",
  3: () => "Why consulting firms and gov contractors chose IntentBid",
  4: (firstName) => `${firstName}, here's your IntentBid access update`,
};

const TEMPLATE_MAP: Record<
  NurtureStep,
  (params: { name: string; company: string }) => string
> = {
  1: nurtureDay1Email,
  2: nurtureDay3Email,
  3: nurtureDay7Email,
  4: nurtureDay14Email,
};

export async function sendNurtureEmail(
  params: SendNurtureEmailParams,
): Promise<{ success: boolean }> {
  try {
    if (!resend) {
      logger.warn(
        "[NURTURE] RESEND_API_KEY not configured — skipping nurture email",
      );
      return { success: false };
    }

    const firstName = params.name.split(" ")[0];
    const subject = SUBJECT_LINES[params.step](firstName);
    const html = TEMPLATE_MAP[params.step]({
      name: params.name,
      company: params.company,
    });

    const from = process.env.EMAIL_FROM || "IntentBid <onboarding@resend.dev>";

    const { error } = await resend.emails.send({
      from,
      to: params.email,
      subject,
      html,
    });

    if (error) {
      logger.error(
        `[NURTURE] Failed to send step ${params.step} to ${params.email}`,
        error,
      );
      return { success: false };
    }

    logger.info(`[NURTURE] Step ${params.step} sent successfully`);
    return { success: true };
  } catch (err) {
    logger.error(
      `[NURTURE] Unexpected error sending step ${params.step}`,
      err,
    );
    return { success: false };
  }
}
