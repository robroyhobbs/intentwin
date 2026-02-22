import { escapeHtml } from "../escape-html";

export function nurtureDay3Email(params: {
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
  <title>Inside the engine: how IntentBid makes every section persuasive</title>
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
                ${firstName}, here's what's under the hood.
              </h2>

              <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                Every proposal section IntentBid generates passes through six persuasion layers. Not templates. Not fill-in-the-blank prompts. A structured intelligence framework that builds arguments the way winning proposal teams do &mdash; but in seconds.
              </p>

              <h3 style="margin:0 0 16px 0;font-size:17px;font-weight:600;color:#ffffff;">
                The 6-Layer Intent Framework
              </h3>

              <!-- Layer 1 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
                <tr>
                  <td style="background-color:#7c3aed12;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;padding:14px 20px;">
                    <p style="margin:0 0 4px 0;font-size:15px;font-weight:600;color:#c4b5fd;">
                      1. Company Truth
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
                      Every claim is grounded in verified facts from your knowledge base &mdash; real project outcomes, actual certifications, proven methodologies. No hallucinated capabilities.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Layer 2 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
                <tr>
                  <td style="background-color:#7c3aed12;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;padding:14px 20px;">
                    <p style="margin:0 0 4px 0;font-size:15px;font-weight:600;color:#c4b5fd;">
                      2. Brand Voice
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
                      Your tone, your terminology, your style. Proposals read like your best writer wrote them, not like an AI generated them.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Layer 3 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
                <tr>
                  <td style="background-color:#7c3aed12;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;padding:14px 20px;">
                    <p style="margin:0 0 4px 0;font-size:15px;font-weight:600;color:#c4b5fd;">
                      3. Win Themes
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
                      Strategic angles woven throughout every section &mdash; not bolted on as afterthoughts. Your differentiators show up naturally, reinforced at every turn.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Layer 4 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
                <tr>
                  <td style="background-color:#7c3aed12;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;padding:14px 20px;">
                    <p style="margin:0 0 4px 0;font-size:15px;font-weight:600;color:#c4b5fd;">
                      4. Competitive Positioning
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
                      Clear differentiation without naming competitors. IntentBid positions your strengths against common alternatives so evaluators draw the right conclusions on their own.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Layer 5 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
                <tr>
                  <td style="background-color:#7c3aed12;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;padding:14px 20px;">
                    <p style="margin:0 0 4px 0;font-size:15px;font-weight:600;color:#c4b5fd;">
                      5. Outcome Mapping
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
                      Every claim is tied to a measurable outcome. No vague promises &mdash; evaluators see exactly what you'll deliver and how you'll prove it.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Layer 6 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
                <tr>
                  <td style="background-color:#7c3aed12;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;padding:14px 20px;">
                    <p style="margin:0 0 4px 0;font-size:15px;font-weight:600;color:#c4b5fd;">
                      6. Best Practices
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
                      Section-specific persuasion patterns derived from thousands of winning proposals. Executive summaries, technical approaches, staffing plans &mdash; each has its own playbook.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                <strong style="color:#ffffff;">This isn't a chatbot writing your proposals.</strong>
              </p>

              <p style="margin:0 0 28px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                It's a persuasion engine.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
                <tr>
                  <td align="center" style="border-radius:8px;background-color:#7c3aed;">
                    <a href="https://intentbid.com/request-access?ref=email" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      See IntentBid in action &rarr;
                    </a>
                  </td>
                </tr>
              </table>

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
