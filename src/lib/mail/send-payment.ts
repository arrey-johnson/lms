import { getMailConfig, sendMail } from "@/lib/mail/client";
import {
  buildAdminPaymentEmail,
  buildPaymentFailedEmail,
  buildPaymentMismatchEmail,
  buildPaymentRequestedEmail,
  buildPaymentSuccessEmail,
} from "@/lib/mail/templates/payment";
import { classifyWallet } from "@/lib/fapshi/phone";
import type { PaymentRecord } from "@/lib/payments/types";

type MailContext = {
  payment: PaymentRecord;
  courseTitle: string;
  fullName?: string | null;
};

function walletOf(payment: PaymentRecord) {
  return payment.phone ? classifyWallet(payment.phone) : null;
}

async function deliver(
  to: string | null | undefined,
  message: { subject: string; html: string; text: string }
) {
  const recipient = to?.trim();
  if (!recipient) return;
  await sendMail({ to: recipient, ...message });
}

export async function sendPaymentRequestedMail(input: MailContext) {
  const message = buildPaymentRequestedEmail({
    fullName: input.fullName,
    courseTitle: input.courseTitle,
    courseId: input.payment.course_id,
    amountXaf: input.payment.amount_xaf,
    phone: input.payment.phone,
    wallet: walletOf(input.payment),
    transId: input.payment.trans_id,
  });
  await deliver(input.payment.email, message);
}

export async function sendPaymentSuccessMail(input: MailContext) {
  const shared = {
    fullName: input.fullName,
    email: input.payment.email,
    courseTitle: input.courseTitle,
    courseId: input.payment.course_id,
    amountXaf: input.payment.amount_xaf,
    phone: input.payment.phone,
    wallet: walletOf(input.payment),
    transId: input.payment.trans_id,
    financialTransId: input.payment.financial_trans_id,
    revenueXaf: input.payment.revenue_xaf,
  };
  await deliver(input.payment.email, buildPaymentSuccessEmail(shared));
  const { from } = getMailConfig();
  await deliver(process.env.PAYMENTS_NOTIFY_EMAIL || from, buildAdminPaymentEmail(shared));
}

export async function sendPaymentFailedMail(
  input: MailContext & { expired?: boolean }
) {
  const message = buildPaymentFailedEmail({
    fullName: input.fullName,
    courseTitle: input.courseTitle,
    courseId: input.payment.course_id,
    amountXaf: input.payment.amount_xaf,
    phone: input.payment.phone,
    wallet: walletOf(input.payment),
    transId: input.payment.trans_id,
    expired: input.expired,
  });
  await deliver(input.payment.email, message);
}

export async function sendPaymentMismatchMail(
  input: MailContext & { detail: string }
) {
  const { from } = getMailConfig();
  const adminTo = process.env.PAYMENTS_NOTIFY_EMAIL || from;
  const message = buildPaymentMismatchEmail({
    fullName: input.fullName,
    email: input.payment.email,
    courseTitle: input.courseTitle,
    courseId: input.payment.course_id,
    amountXaf: input.payment.amount_xaf,
    phone: input.payment.phone,
    transId: input.payment.trans_id,
    detail: input.detail,
  });
  await deliver(adminTo, message);
}
