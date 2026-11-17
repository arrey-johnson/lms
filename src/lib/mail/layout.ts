export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const LOGO_MARK = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 128 128" fill="none" style="vertical-align:middle;margin-right:10px;">
  <path fill="#0070F8" d="M24 18c0-6.627 5.373-12 12-12h56c6.627 0 12 5.373 12 12v56c0 6.627-5.373 12-12 12H52l-22 24 4.5-24H36c-6.627 0-12-5.373-12-12V18z"/>
  <path stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" d="M52 40l28 22-28 22"/>
</svg>`;

export function renderEmail(input: {
  title: string;
  preheader: string;
  bodyHtml: string;
}) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#001C4C;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(0,28,76,0.06);">
          <tr>
            <td style="background:#0070F8;padding:28px 32px;">
              <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.02em;">
                ${LOGO_MARK}
                <span style="color:#ffffff;">Promptstack</span>
                <span style="color:#dbeafe;"> Classroom</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${input.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #e2e8f0;background:#f8fafc;">
              <p style="margin:0 0 4px;font-size:13px;color:#475569;">
                Questions? Reach us at
                <a href="mailto:support@promptstackclassroom.com" style="color:#0070F8;text-decoration:none;">support@promptstackclassroom.com</a>
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                © ${year} Promptstack Technologies · Promptstack Classroom
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

export function emailButton(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
    <tr>
      <td style="border-radius:12px;background:#0070F8;">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 22px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

export function emailDetailTable(rows: { label: string; value: string }[]) {
  const body = rows
    .map(
      (row) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;width:42%;vertical-align:top;">${escapeHtml(row.label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:650;color:#001C4C;vertical-align:top;">${escapeHtml(row.value)}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">${body}</table>`;
}
