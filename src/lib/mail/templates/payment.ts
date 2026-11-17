import { getAppUrl } from "@/lib/app-url";
import { formatXaf } from "@/lib/currency";
import {
  emailButton,
  emailDetailTable,
  escapeHtml,
  renderEmail,
} from "@/lib/mail/layout";
import { formatCameroonPhone, maskPhone, walletLabel } from "@/lib/fapshi/phone";
import type { Wallet } from "@/lib/payments/types";

type PaymentMailContext = {
  fullName?: string | null;
  email?: string | null;
  courseTitle: string;
  courseId: string;
  amountXaf: number;
  phone?: string | null;
  wallet?: Wallet | null;
  transId?: string | null;
  financialTransId?: string | null;
  revenueXaf?: number | null;
};

function greeting(fullName?: string | null) {
  const name = fullName?.trim();
  return name ? `Hi ${name},` : "Hi there,";
}

function courseHref(courseId: string) {
  const origin = getAppUrl();
  return origin ? `${origin}/course/${courseId}` : "";
}

function checkoutHref(courseId: string) {
  const origin = getAppUrl();
  return origin ? `${origin}/checkout/${courseId}` : "";
}

function when() {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Douala",
  }).format(new Date());
}

export function buildPaymentRequestedEmail(input: PaymentMailContext) {
  const hello = greeting(input.fullName);
  const amount = formatXaf(input.amountXaf);
  const network = walletLabel(input.wallet);
  const phone = input.phone ? formatCameroonPhone(input.phone) : "";
  const subject = `Approve ${amount} for ${input.courseTitle}`;

  const text = `${hello}

We sent a ${network} payment request for ${input.courseTitle}.

Amount: ${amount}
${phone ? `Phone: ${phone}\n` : ""}${input.transId ? `Reference: ${input.transId}\n` : ""}
Open the prompt on your phone and approve it with your Mobile Money PIN. Access to the course unlocks as soon as the payment succeeds.

If you did not start this payment, you can ignore the prompt.

— Promptstack Classroom
support@promptstackclassroom.com`;

  const html = renderEmail({
    title: subject,
    preheader: `Approve the ${network} prompt for ${amount}.`,
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#001C4C;">${escapeHtml(hello)}</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">
        A <strong style="color:#001C4C;">${escapeHtml(network)}</strong> request is waiting on your phone for
        <strong style="color:#001C4C;">${escapeHtml(input.courseTitle)}</strong>.
        Approve it with your PIN and the course unlocks automatically.
      </p>
      ${emailDetailTable([
        { label: "Amount", value: amount },
        ...(phone ? [{ label: "Sent to", value: phone }] : []),
        { label: "Network", value: network },
        ...(input.transId ? [{ label: "Reference", value: input.transId }] : []),
      ])}
      <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#94a3b8;">
        If you did not start this payment, ignore the prompt. Nothing is charged until you approve it.
      </p>
    `,
  });

  return { subject, html, text };
}

export function buildPaymentSuccessEmail(input: PaymentMailContext) {
  const hello = greeting(input.fullName);
  const amount = formatXaf(input.amountXaf);
  const network = walletLabel(input.wallet);
  const subject = `You're in — ${input.courseTitle} is unlocked`;
  const href = courseHref(input.courseId);

  const text = `${hello}

Your payment was successful and ${input.courseTitle} is now on your account.

Amount: ${amount}
Network: ${network}
${input.transId ? `Reference: ${input.transId}\n` : ""}${input.financialTransId ? `Operator reference: ${input.financialTransId}\n` : ""}Paid: ${when()}
${href ? `\nStart learning: ${href}\n` : "\nOpen Promptstack Classroom and go to My courses.\n"}
— Promptstack Classroom
support@promptstackclassroom.com`;

  const html = renderEmail({
    title: subject,
    preheader: `${input.courseTitle} is ready. ${amount} received.`,
    bodyHtml: `
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0070F8;">Payment received</p>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#001C4C;">${escapeHtml(hello)}</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">
        <strong style="color:#001C4C;">${escapeHtml(input.courseTitle)}</strong> is unlocked on your account.
        You can start learning now.
      </p>
      ${emailDetailTable([
        { label: "Amount paid", value: amount },
        { label: "Network", value: network },
        ...(input.phone ? [{ label: "Phone", value: maskPhone(input.phone) }] : []),
        ...(input.transId ? [{ label: "Reference", value: input.transId }] : []),
        ...(input.financialTransId
          ? [{ label: "Operator reference", value: input.financialTransId }]
          : []),
        { label: "Paid", value: when() },
      ])}
      ${href ? emailButton(href, "Start learning") : `<p style="margin:20px 0 0;font-size:14px;color:#475569;">Open Promptstack Classroom and go to My courses.</p>`}
    `,
  });

  return { subject, html, text };
}

export function buildPaymentFailedEmail(
  input: PaymentMailContext & { expired?: boolean }
) {
  const hello = greeting(input.fullName);
  const amount = formatXaf(input.amountXaf);
  const subject = input.expired
    ? `Payment link expired for ${input.courseTitle}`
    : `Payment didn't go through for ${input.courseTitle}`;
  const href = checkoutHref(input.courseId);
  const reason = input.expired
    ? "The payment link expired before it was approved."
    : "The mobile money request was declined, cancelled, or not approved in time. Operators don't tell us which.";

  const text = `${hello}

${reason}

Course: ${input.courseTitle}
Amount: ${amount}
${input.transId ? `Reference: ${input.transId}\n` : ""}
You have not been charged a successful payment, and the course is not unlocked.
${href ? `Try again: ${href}\n` : "Sign in and open the course checkout to try again.\n"}
— Promptstack Classroom
support@promptstackclassroom.com`;

  const html = renderEmail({
    title: subject,
    preheader: reason,
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#001C4C;">${escapeHtml(hello)}</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">
        ${escapeHtml(reason)} <strong style="color:#001C4C;">${escapeHtml(input.courseTitle)}</strong> is still locked.
      </p>
      ${emailDetailTable([
        { label: "Amount", value: amount },
        ...(input.transId ? [{ label: "Reference", value: input.transId }] : []),
        { label: "Status", value: input.expired ? "Expired" : "Not completed" },
      ])}
      ${href ? emailButton(href, "Try payment again") : ""}
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#94a3b8;">
        A failed prompt is not a successful charge. If your wallet balance dropped anyway, write to support with the reference above.
      </p>
    `,
  });

  return { subject, html, text };
}

export function buildAdminPaymentEmail(input: PaymentMailContext) {
  const amount = formatXaf(input.amountXaf);
  const revenue =
    typeof input.revenueXaf === "number" ? formatXaf(input.revenueXaf) : "—";
  const subject = `New payment · ${amount} · ${input.courseTitle}`;
  const buyer = input.fullName?.trim() || "Student";

  const text = `A course payment succeeded.

Student: ${buyer}
Email: ${input.email || "—"}
Course: ${input.courseTitle}
Amount: ${amount}
Revenue after Fapshi fee: ${revenue}
Phone: ${input.phone ? formatCameroonPhone(input.phone) : "—"}
Network: ${walletLabel(input.wallet)}
Reference: ${input.transId || "—"}
Operator reference: ${input.financialTransId || "—"}
When: ${when()}

The student has been enrolled automatically.`;

  const html = renderEmail({
    title: subject,
    preheader: `${buyer} paid ${amount} for ${input.courseTitle}.`,
    bodyHtml: `
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0070F8;">New enrollment</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">
        <strong style="color:#001C4C;">${escapeHtml(buyer)}</strong> paid for
        <strong style="color:#001C4C;">${escapeHtml(input.courseTitle)}</strong>
        and was enrolled automatically.
      </p>
      ${emailDetailTable([
        { label: "Student", value: buyer },
        { label: "Email", value: input.email || "—" },
        { label: "Amount", value: amount },
        { label: "Your revenue", value: revenue },
        { label: "Phone", value: input.phone ? formatCameroonPhone(input.phone) : "—" },
        { label: "Network", value: walletLabel(input.wallet) },
        { label: "Reference", value: input.transId || "—" },
        { label: "Operator reference", value: input.financialTransId || "—" },
        { label: "When", value: when() },
      ])}
    `,
  });

  return { subject, html, text };
}

export function buildPaymentMismatchEmail(input: PaymentMailContext & { detail: string }) {
  const subject = `Payment needs review · ${input.courseTitle}`;
  const text = `A Fapshi notification did not match the order, so the student was not enrolled.

Course: ${input.courseTitle}
Expected amount: ${formatXaf(input.amountXaf)}
Student: ${input.email || "—"}
Reference: ${input.transId || "—"}
Detail: ${input.detail}

Confirm the transaction in the Fapshi dashboard before enrolling anyone by hand.`;

  const html = renderEmail({
    title: subject,
    preheader: "A payment notification did not match the course order.",
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#001C4C;">A payment needs a manual check.</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">
        Fapshi reported a result that does not match this order. The student was not enrolled.
      </p>
      ${emailDetailTable([
        { label: "Course", value: input.courseTitle },
        { label: "Expected", value: formatXaf(input.amountXaf) },
        { label: "Student", value: input.email || "—" },
        { label: "Reference", value: input.transId || "—" },
        { label: "Detail", value: input.detail },
      ])}
    `,
  });

  return { subject, html, text };
}
