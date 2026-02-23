import { resend } from "./resend";
import { waitlistConfirmationEmail } from "./templates/waitlist-confirmation";
import { logger } from "@/lib/utils/logger";

/**
 * Sends a waitlist confirmation email to a newly registered user via Resend.
 * Silently skips sending if the RESEND_API_KEY is not configured (non-throwing).
 * Logs warnings/errors but never throws, so callers don't need error handling.
 *
 * @param params - Recipient details for the confirmation email
 * @param params.name - Full name of the waitlist entrant
 * @param params.email - Email address to send the confirmation to
 * @param params.company - Company name for personalization in the email template
 * @returns Resolves when the email is sent (or skipped)
 *
 * @example
 * await sendWaitlistConfirmation({ name: "Jane Doe", email: "jane@acme.com", company: "Acme" });
 */
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
