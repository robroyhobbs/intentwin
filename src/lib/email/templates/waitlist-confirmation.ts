import { getFirstName } from "../get-first-name";
import { escapeHtml } from "../escape-html";

export function waitlistConfirmationEmail(params: {
  name: string;
  company: string;
}): string {
  const { name, company } = params;
  const firstName = getFirstName(name);
  const safeCompany = escapeHtml(company);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're on the IntentBid waitlist</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:0 0 32px 0;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                Intent<span style="color:#7c3aed;">Win</span>
              </h1>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color:#18181b;border-radius:12px;border:1px solid #27272a;padding:40px 36px;">
              <!-- Greeting -->
              <h2 style="margin:0 0 20px 0;font-size:22px;font-weight:600;color:#ffffff;">
                Welcome, ${firstName}!
              </h2>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                Thank you for requesting access to IntentBid on behalf of <strong style="color:#ffffff;">${safeCompany}</strong>. We're excited to have you on board.
              </p>

              <!-- Value Prop -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#7c3aed12;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px 0;">
                    <p style="margin:0;font-size:15px;line-height:1.5;color:#c4b5fd;">
                      IntentBid helps teams produce 10x more proposals with outcome-driven persuasion intelligence.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- What Happens Next -->
              <h3 style="margin:28px 0 12px 0;font-size:16px;font-weight:600;color:#ffffff;">
                What happens next?
              </h3>
              <p style="margin:0 0 28px 0;font-size:15px;line-height:1.6;color:#a1a1aa;">
                We review every request personally. You'll hear from us within 48 hours.
              </p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #27272a;margin:28px 0;" />

              <!-- Signature -->
              <p style="margin:0;font-size:15px;line-height:1.6;color:#d4d4d8;">
                Best regards,<br />
                <strong style="color:#ffffff;">The IntentBid Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                IntentBid &middot; <a href="https://intentbid.com" style="color:#7c3aed;text-decoration:none;">intentbid.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
