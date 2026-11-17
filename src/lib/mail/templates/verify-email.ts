type VerifyEmailTemplateInput = {
  fullName?: string | null;
  code: string;
};

const COPY_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0070F8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;">
  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
</svg>`;

const LOGO_MARK = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 128 128" fill="none" style="vertical-align:middle;margin-right:10px;">
  <path fill="#0070F8" d="M24 18c0-6.627 5.373-12 12-12h56c6.627 0 12 5.373 12 12v56c0 6.627-5.373 12-12 12H52l-22 24 4.5-24H36c-6.627 0-12-5.373-12-12V18z"/>
  <path stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" d="M52 40l28 22-28 22"/>
</svg>`;

export function buildVerifyEmailTemplate({
  fullName,
  code,
}: VerifyEmailTemplateInput) {
  const greeting = fullName?.trim() ? `Hi ${fullName.trim()},` : "Hi there,";

  const subject = `${code} is your Promptstack Classroom confirmation code`;

  const text = `${greeting}

Welcome to Promptstack Classroom.

Your email confirmation code is: ${code}

Enter this 6-digit code on the verification page to activate your account.
This code expires in 15 minutes.

If you did not create a Promptstack Classroom account, you can ignore this email.

— Promptstack Classroom
support@promptstackclassroom.com`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Confirm your Promptstack Classroom email</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#001C4C;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(0,28,76,0.06);">
          <tr>
            <td style="background:#0070F8;padding:28px 32px;">
              <div style="display:flex;align-items:center;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.02em;">
                ${LOGO_MARK}
                <span>
                  <span style="color:#ffffff;">Promptstack</span>
                  <span style="color:#dbeafe;"> Classroom</span>
                </span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#001C4C;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
                Use this confirmation code to verify your email and finish creating your Promptstack Classroom account.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
                <tr>
                  <td align="center" style="background:#f8fafc;border:1px solid #bfdbfe;border-radius:16px;padding:22px 16px;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#64748b;margin-bottom:10px;">
                      Your confirmation code
                    </div>
                    <div id="otp-code" style="font-size:36px;font-weight:700;letter-spacing:0.36em;color:#001C4C;font-family:Consolas,Monaco,monospace;user-select:all;-webkit-user-select:all;-moz-user-select:all;">
                      ${code}
                    </div>
                    <div style="margin-top:16px;">
                      <a href="#otp-code" style="display:inline-block;background:#eff6ff;border:1px solid #93c5fd;border-radius:999px;padding:10px 16px;text-decoration:none;color:#0070F8;font-size:13px;font-weight:700;">
                        ${COPY_ICON}Copy code · tap to select
                      </a>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#64748b;">
                Enter the code on the verification page. It expires in <strong style="color:#001C4C;">15 minutes</strong>.
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
                <a href="mailto:support@promptstackclassroom.com" style="color:#0070F8;text-decoration:none;">support@promptstackclassroom.com</a>
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} Promptstack Technologies · Promptstack Classroom
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
