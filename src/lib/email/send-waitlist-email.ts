import { resend } from "./resend";
import { waitlistConfirmationEmail } from "./templates/waitlist-confirmation";

export async function sendWaitlistConfirmation(params: {
  name: string;
  email: string;
  company: string;
}): Promise<void> {
  try {
    if (!resend) {
      console.warn(
        "[EMAIL] RESEND_API_KEY not configured — skipping waitlist confirmation email",
      );
      return;
    }

    const html = waitlistConfirmationEmail({
      name: params.name,
      company: params.company,
    });

    const from =
      process.env.EMAIL_FROM || "IntentWin <noreply@intentwin.com>";

    const { error } = await resend.emails.send({
      from,
      to: params.email,
      subject: "You're on the IntentWin waitlist",
      html,
    });

    if (error) {
      console.error("[EMAIL] Failed to send waitlist confirmation:", error);
      return;
    }

    console.log("[EMAIL] Waitlist confirmation sent to", params.email);
  } catch (err) {
    console.error("[EMAIL] Unexpected error sending waitlist confirmation:", err);
  }
}
