import { escapeHtml } from "../escape-html";

export function nurtureDay1Email(params: {
  name: string;
  company: string;
}): string {
  const { name } = params;
  const firstName = escapeHtml(name.split(" ")[0]);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>The #1 reason proposals lose (it's not price)</title>
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
                ${firstName}, why do most proposals fail?
              </h2>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                It's not price. It's not timing. It's not even the competition.
              </p>

              <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                <strong style="color:#ffffff;">68% of proposals fail because of weak persuasion structure.</strong> They list features instead of mapping to evaluator priorities. They describe capabilities instead of demonstrating outcomes. They tell instead of prove.
              </p>

              <!-- Stats Callout -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#7c3aed12;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;padding:16px 20px;">
                    <p style="margin:0 0 10px 0;font-size:15px;line-height:1.5;color:#c4b5fd;">
                      <strong>The numbers are stark:</strong>
                    </p>
                    <p style="margin:0 0 6px 0;font-size:15px;line-height:1.5;color:#c4b5fd;">
                      &bull; Teams with structured persuasion frameworks win 38% more deals
                    </p>
                    <p style="margin:0 0 6px 0;font-size:15px;line-height:1.5;color:#c4b5fd;">
                      &bull; Evaluators spend an average of 6.5 minutes per section &mdash; first impressions are final impressions
                    </p>
                    <p style="margin:0;font-size:15px;line-height:1.5;color:#c4b5fd;">
                      &bull; Proposals that align claims to evaluation criteria score 2.4x higher on average
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 24px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                The gap between winning and losing proposals isn't talent. It's structure. Most teams have the expertise &mdash; they just can't translate it into language that evaluators score highly.
              </p>

              <p style="margin:0 0 28px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                <strong style="color:#ffffff;">This is exactly what we built IntentWin to solve.</strong>
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
                <tr>
                  <td align="center" style="border-radius:8px;background-color:#7c3aed;">
                    <a href="https://intentwin.com/request-access" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Get started with IntentWin &rarr;
                    </a>
                  </td>
                </tr>
              </table>

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
