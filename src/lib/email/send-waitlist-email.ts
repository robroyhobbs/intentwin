import { resend } from "./resend";
import { waitlistConfirmationEmail } from "./templates/waitlist-confirmation";
import { logger } from "@/lib/utils/logger";

export async function sendWaitlistConfirmation(params: {
  name: string;
  email: string;
  company: string;
}): Promise<void> {
  try {
    if (!resend) {
      logger.warn(
        "[EMAIL] RESEND_API_KEY not configured — skipping waitlist confirmation email",
      );
      return;
    }

    const html = waitlistConfirmationEmail({
      name: params.name,
      company: params.company,
    });

    const from = process.env.EMAIL_FROM || "IntentBid <onboarding@resend.dev>";

    const { error } = await resend.emails.send({
      from,
      to: params.email,
      subject: "You're on the IntentBid waitlist",
      html,
    });

    if (error) {
      logger.error("[EMAIL] Failed to send waitlist confirmation", error);
      return;
    }

    logger.info("[EMAIL] Waitlist confirmation sent successfully");
  } catch (err) {
    logger.error(
      "[EMAIL] Unexpected error sending waitlist confirmation",
      err,
    );
  }
}
