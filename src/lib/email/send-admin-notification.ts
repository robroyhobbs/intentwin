import { resend } from "./resend";
import { adminWaitlistNotificationEmail } from "./templates/admin-waitlist-notification";
import { logger } from "@/lib/utils/logger";

export async function sendAdminWaitlistNotification(params: {
  name: string;
  email: string;
  company: string;
  company_size?: string;
}): Promise<void> {
  try {
    if (!resend) {
      logger.warn(
        "[ADMIN-EMAIL] RESEND_API_KEY not configured — skipping admin notification",
      );
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL || "rob@intentbid.com";
    const from = process.env.EMAIL_FROM || "IntentBid <onboarding@resend.dev>";
    const timestamp = new Date().toISOString();

    const { subject, html } = adminWaitlistNotificationEmail({
      name: params.name,
      email: params.email,
      company: params.company,
      company_size: params.company_size,
      timestamp,
    });

    const { error } = await resend.emails.send({
      from,
      to: adminEmail,
      subject,
      html,
    });

    if (error) {
      logger.error("[ADMIN-EMAIL] Failed to send admin notification", error);
      return;
    }

    logger.info("[ADMIN-EMAIL] Admin notification sent successfully");
  } catch (err) {
    logger.error(
      "[ADMIN-EMAIL] Unexpected error sending admin notification",
      err,
    );
  }
}
