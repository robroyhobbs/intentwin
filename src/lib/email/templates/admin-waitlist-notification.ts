export function adminWaitlistNotificationEmail(params: {
  name: string;
  email: string;
  company: string;
  company_size?: string;
  timestamp: string;
}): { subject: string; html: string } {
  const { name, email, company, company_size, timestamp } = params;

  const subject = `New waitlist signup: ${name} from ${company}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px 0;">
              <span style="font-size:13px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:0.5px;">IntentWin Admin</span>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:8px;border:1px solid #e4e4e7;padding:32px;">
              <h2 style="margin:0 0 4px 0;font-size:18px;font-weight:600;color:#18181b;">
                New Waitlist Signup
              </h2>
              <p style="margin:0 0 24px 0;font-size:13px;color:#71717a;">
                ${timestamp}
              </p>

              <!-- Details Table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 12px;font-size:13px;color:#71717a;border-bottom:1px solid #f4f4f5;width:110px;">Name</td>
                  <td style="padding:10px 12px;font-size:14px;color:#18181b;border-bottom:1px solid #f4f4f5;font-weight:500;">${name}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;font-size:13px;color:#71717a;border-bottom:1px solid #f4f4f5;">Email</td>
                  <td style="padding:10px 12px;font-size:14px;border-bottom:1px solid #f4f4f5;">
                    <a href="mailto:${email}" style="color:#7c3aed;text-decoration:none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;font-size:13px;color:#71717a;border-bottom:1px solid #f4f4f5;">Company</td>
                  <td style="padding:10px 12px;font-size:14px;color:#18181b;border-bottom:1px solid #f4f4f5;font-weight:500;">${company}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;font-size:13px;color:#71717a;">Company Size</td>
                  <td style="padding:10px 12px;font-size:14px;color:#18181b;">${company_size || "Not provided"}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0 0 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#a1a1aa;">
                This is an automated admin notification from IntentWin.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
