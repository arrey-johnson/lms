type VerifyEmailTemplateInput = {
  fullName?: string | null;
  code: string;
};

const COPY_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;">
  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
</svg>`;

export function buildVerifyEmailTemplate({
  fullName,
  code,
}: VerifyEmailTemplateInput) {
  const greeting = fullName?.trim() ? `Hi ${fullName.trim()},` : "Hi there,";

  const subject = `${code} is your LearnSpace confirmation code`;

  const text = `${greeting}

Welcome to LearnSpace by Promptstack Technologies.

Your email confirmation code is: ${code}

Enter this 6-digit code on the verification page to activate your account.
This code expires in 15 minutes.

If you did not create a LearnSpace account, you can ignore this email.

— LearnSpace
Promptstack Technologies
hello@promptstacktechnologies.com`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Confirm your LearnSpace email</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(15,23,42,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 55%,#0ea5e9 100%);padding:28px 32px;">
              <div style="font-size:26px;font-weight:700;letter-spacing:-0.03em;color:#ffffff;font-family:Georgia,'Times New Roman',serif;">
                Learn<span style="color:#bfdbfe;">Space</span>
              </div>
              <div style="margin-top:6px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#dbeafe;">
                by Promptstack Technologies
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
                Use this confirmation code to verify your email and finish creating your LearnSpace account.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
                <tr>
                  <td align="center" style="background:#f8fafc;border:1px solid #dbeafe;border-radius:16px;padding:22px 16px;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#64748b;margin-bottom:10px;">
                      Your confirmation code
                    </div>
                    <div id="otp-code" style="font-size:36px;font-weight:700;letter-spacing:0.36em;color:#1e3a8a;font-family:Consolas,Monaco,monospace;user-select:all;-webkit-user-select:all;-moz-user-select:all;">
                      ${code}
                    </div>
                    <!-- Copy-friendly control: one click/tap selects the whole code in most clients -->
                    <div style="margin-top:16px;">
                      <a href="#otp-code" style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:999px;padding:10px 16px;text-decoration:none;color:#1d4ed8;font-size:13px;font-weight:700;">
                        ${COPY_ICON}Copy code · tap to select
                      </a>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#64748b;">
                Enter the code on the LearnSpace verification page. It expires in <strong style="color:#0f172a;">15 minutes</strong>.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#94a3b8;">
                No confirmation link is required — just the 6-digit code.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #e2e8f0;background:#f8fafc;">
              <p style="margin:0 0 4px;font-size:13px;color:#475569;">
                Questions? Reach us at
                <a href="mailto:hello@promptstacktechnologies.com" style="color:#1d4ed8;text-decoration:none;">hello@promptstacktechnologies.com</a>
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} Promptstack Technologies · LearnSpace
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
