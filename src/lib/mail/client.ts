import nodemailer from "nodemailer";

export function getMailConfig() {
  const host = process.env.SMTP_HOST || "smtppro.zoho.com";
  const port = Number(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER || "hello@promptstacktechnologies.com";
  const pass = process.env.SMTP_PASS || "";
  const from =
    process.env.SMTP_FROM || "hello@promptstacktechnologies.com";
  const fromName = process.env.SMTP_FROM_NAME || "LearnSpace";

  return { host, port, user, pass, from, fromName };
}

export function createMailTransport() {
  const { host, port, user, pass } = getMailConfig();

  if (!pass) {
    throw new Error(
      "SMTP_PASS is not configured. Add your Zoho app password to .env.local."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const { from, fromName } = getMailConfig();
  const transport = createMailTransport();

  await transport.sendMail({
    from: `"${fromName}" <${from}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: from,
  });
}
