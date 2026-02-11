import { escapeHtml } from "../escape-html";

export function nurtureDay7Email(params: {
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
  <title>Why consulting firms and gov contractors chose IntentWin</title>
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
                ${firstName}, this tool isn't for everyone.
              </h2>

              <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                IntentWin was built for teams where every proposal matters. Where a single win can mean millions in revenue &mdash; and a loss means months of effort wasted.
              </p>

              <h3 style="margin:0 0 16px 0;font-size:17px;font-weight:600;color:#ffffff;">
                Who we built this for
              </h3>

              <!-- Segment 1 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
                <tr>
                  <td style="background-color:#7c3aed12;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;padding:14px 20px;">
                    <p style="margin:0 0 4px 0;font-size:15px;font-weight:600;color:#c4b5fd;">
                      Consulting Firms
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
                      Competing for 7-figure engagements where the proposal is the product. Every section needs to demonstrate domain mastery and strategic clarity.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Segment 2 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
                <tr>
                  <td style="background-color:#7c3aed12;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;padding:14px 20px;">
                    <p style="margin:0 0 4px 0;font-size:15px;font-weight:600;color:#c4b5fd;">
                      Government Contractors
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
                      Navigating complex RFP requirements with strict evaluation criteria. Compliance is table stakes &mdash; persuasion is what wins.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Segment 3 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
                <tr>
                  <td style="background-color:#7c3aed12;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;padding:14px 20px;">
                    <p style="margin:0 0 4px 0;font-size:15px;font-weight:600;color:#c4b5fd;">
                      Mid-Market Sales Teams
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
                      Scaling proposal output without scaling headcount. Turning a 3-day proposal cycle into a 3-hour one without sacrificing quality.
                    </p>
                  </td>
                </tr>
              </table>

              <h3 style="margin:0 0 12px 0;font-size:17px;font-weight:600;color:#ffffff;">
                Built for real workflows
              </h3>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                IntentWin ingests your existing materials &mdash; <strong style="color:#ffffff;">PDF, DOCX, PPTX, CSV, TXT, and Markdown</strong> &mdash; and transforms them into a living knowledge base. Every proposal is then engineered section-by-section with full traceability back to your source documents.
              </p>

              <p style="margin:0 0 8px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                No black box. Every claim has a source. Every recommendation has a rationale.
              </p>

              <p style="margin:24px 0 28px 0;font-size:16px;line-height:1.6;color:#d4d4d8;">
                <strong style="color:#ffffff;">We review every waitlist request personally because this tool isn't for everyone.</strong> It's for teams that can't afford to lose.
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
