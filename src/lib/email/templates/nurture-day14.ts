export function nurtureDay14Email(params: {
  name: string;
  company: string;
}): string {
  const { name } = params;
  const firstName = name.split(" ")[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${firstName}, here's your IntentWin access update</title>
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
                ${firstName}, a quick update on your access.
              </h2>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                It's been two weeks since you requested access to IntentWin. We wanted to give you a quick update.
              </p>

              <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                Your request is still being reviewed. We know that's longer than most waitlists, and there's a reason for that.
              </p>

              <!-- Callout -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
                <tr>
                  <td style="background-color:#7c3aed12;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;padding:16px 20px;">
                    <p style="margin:0;font-size:15px;line-height:1.5;color:#c4b5fd;">
                      IntentWin is invite-only at <strong>$999/month</strong> because quality matters. We'd rather serve 100 teams exceptionally than 10,000 poorly.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                We review each request to ensure IntentWin is the right fit &mdash; that your team will see real ROI, not just another tool in the stack. When you're approved, you'll get a <strong style="color:#ffffff;">14-day free trial</strong> with full access to every feature so you can see the difference before you commit.
              </p>

              <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                We're not being slow. We're being deliberate.
              </p>

              <h3 style="margin:0 0 12px 0;font-size:17px;font-weight:600;color:#ffffff;">
                Have questions? Just reply.
              </h3>

              <p style="margin:0 0 28px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                <strong style="color:#ffffff;">Reply to this email if you have questions &mdash; a real person will answer.</strong> No chatbots, no ticket systems, no 5-day response times. Just a direct line to the team building this.
              </p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #27272a;margin:28px 0;" />

              <!-- Signature -->
              <p style="margin:0;font-size:15px;line-height:1.6;color:#d4d4d8;">
                Best regards,<br />
                <strong style="color:#ffffff;">The IntentWin Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                IntentWin &middot; <a href="https://intentwin.com" style="color:#7c3aed;text-decoration:none;">intentwin.com</a>
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
