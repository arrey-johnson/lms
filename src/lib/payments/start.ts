import { randomUUID } from "crypto";
import { checkoutReturnUrl, getAppUrl } from "@/lib/app-url";
import {
  camerpayConfigured,
  camerpayEnvironment,
  createCamerPayCheckout,
  isCamerPayTransactionId,
  providerDidNotRespond,
  studentPaymentError,
  type CamerPayMethod,
} from "@/lib/camerpay/client";
import { courseAmountXaf } from "@/lib/currency";
import { activeFapshiEnvironment, initiatePay } from "@/lib/fapshi/client";
import { classifyWallet, normalizeCameroonPhone } from "@/lib/fapshi/phone";
import { sendPaymentRequestedMail } from "@/lib/mail/send-payment";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentRecord, StartPaymentResult, Wallet } from "@/lib/payments/types";

const NOT_READY = "Mobile money checkout is not ready yet. Try a card, or check back shortly.";

function missingTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = error.message || "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /could not find the table|schema cache/i.test(message)
  );
}

function friendly(message: string) {
  return studentPaymentError(message, "momo");
}

function methodFor(wallet: Wallet): CamerPayMethod {
  return wallet === "orange" ? "orange_money" : "mtn_momo";
}

function mediumFor(wallet: Wallet) {
  return wallet === "orange" ? "orange money" : "mobile money";
}

function toResult(payment: PaymentRecord, wallet: Wallet): StartPaymentResult {
  return {
    ok: true,
    paymentId: payment.id,
    courseId: payment.course_id,
    status: payment.status === "created" ? "pending" : payment.status,
    mode: "link",
    checkoutUrl: payment.checkout_url,
    amountXaf: payment.amount_xaf,
    phone: payment.phone || "",
    wallet,
    method: "momo",
    testMode: payment.environment === "sandbox",
  };
}

async function claimRequestEmail(payment: PaymentRecord, fullName: string | null, courseTitle: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("payments")
    .update({ request_notified_at: new Date().toISOString() })
    .eq("id", payment.id)
    .is("request_notified_at", null)
    .select("id");
  if (!data?.length) return;
  try {
    await sendPaymentRequestedMail({ payment, courseTitle, fullName });
  } catch (error) {
    console.error("Payment request email failed", error);
    await admin.from("payments").update({ request_notified_at: null }).eq("id", payment.id);
  }
}

export async function startMobileMoneyCheckout(input: {
  userId: string;
  courseId: string;
  phone: string;
  fullName: string | null;
  email: string | null;
}): Promise<StartPaymentResult> {
  const phone = normalizeCameroonPhone(input.phone);
  if (!phone) {
    return { ok: false, error: "Enter a Cameroon mobile number, 9 digits starting with 6." };
  }
  const wallet = classifyWallet(phone);
  if (!wallet) {
    return {
      ok: false,
      error: "Use an MTN Mobile Money or Orange Money number. Nexttel and Camtel numbers can't pay here.",
    };
  }
  if (!camerpayConfigured()) return { ok: false, error: NOT_READY };

  const admin = createAdminClient();
  const [{ data: course, error: courseError }, { data: enrollment }] = await Promise.all([
    admin.from("courses").select("id, title, price_cents").eq("id", input.courseId).maybeSingle(),
    admin
      .from("enrollments")
      .select("id")
      .eq("user_id", input.userId)
      .eq("course_id", input.courseId)
      .maybeSingle(),
  ]);
  if (courseError) return { ok: false, error: courseError.message };
  if (!course) return { ok: false, error: "That course is no longer available." };
  if (enrollment) return { ok: false, error: "You already own this course.", alreadyEnrolled: true };

  const environment = camerpayEnvironment();
  const amountXaf = courseAmountXaf(course.price_cents);
  const { data: openRows, error: openError } = await admin
    .from("payments")
    .select("*")
    .eq("user_id", input.userId)
    .eq("course_id", input.courseId)
    .eq("environment", environment)
    .neq("medium", "card")
    .in("status", ["created", "pending"])
    .order("created_at", { ascending: false })
    .limit(5);

  if (openError) {
    if (missingTable(openError)) return { ok: false, error: NOT_READY };
    return { ok: false, error: openError.message };
  }

  const reusable = ((openRows || []) as PaymentRecord[]).find((row) => {
    if (!isCamerPayTransactionId(row.trans_id) || !row.checkout_url) return false;
    if (row.phone !== phone || row.amount_xaf !== amountXaf) return false;
    return Date.now() - new Date(row.created_at).getTime() < 30 * 60 * 1000;
  });
  if (reusable) return toResult(reusable, wallet);

  const id = randomUUID();
  const returnUrl = checkoutReturnUrl(input.courseId, id);
  const origin = getAppUrl();
  const callbackUrl = origin.startsWith("https://") ? `${origin}/api/payments/camerpay` : "";
  if (!returnUrl || !callbackUrl) {
    return { ok: false, error: "Mobile money checkout needs an https site address before it can start." };
  }

  const now = new Date().toISOString();
  const { error: insertError } = await admin.from("payments").insert({
    id,
    user_id: input.userId,
    course_id: input.courseId,
    amount_xaf: amountXaf,
    price_cents: course.price_cents,
    status: "created",
    environment,
    external_id: id,
    phone,
    medium: mediumFor(wallet),
    payer_name: input.fullName,
    email: input.email,
    created_at: now,
    updated_at: now,
  });
  if (insertError) {
    if (missingTable(insertError)) return { ok: false, error: NOT_READY };
    return { ok: false, error: insertError.message };
  }

  const method = methodFor(wallet);
  const charged = await createCamerPayCheckout({
    method,
    amount: amountXaf,
    phone: `237${phone}`,
    email: input.email,
    name: input.fullName,
    invoiceId: id,
    callbackUrl,
    returnUrl,
  });
  if (!charged.ok) {
    if (providerDidNotRespond(charged.message)) {
      const fapshiEnv = activeFapshiEnvironment();
      const link = await initiatePay(fapshiEnv, {
        amount: amountXaf,
        email: input.email || undefined,
        redirectUrl: returnUrl,
        userId: input.userId,
        externalId: id,
        message: `Promptstack Classroom — ${course.title}`.slice(0, 140),
      });
      if (link.ok && link.data.transId && link.data.link) {
        const { data: saved, error: saveError } = await admin
          .from("payments")
          .update({
            trans_id: link.data.transId,
            status: "pending",
            checkout_url: link.data.link,
            environment: fapshiEnv,
            medium: mediumFor(wallet),
            financial_trans_id: null,
            notes: null,
            updated_at: new Date().toISOString(),
            last_checked_at: null,
          })
          .eq("id", id)
          .select("*")
          .maybeSingle();
        if (!saveError && saved) {
          const payment = saved as PaymentRecord;
          await claimRequestEmail(payment, input.fullName, course.title);
          return toResult(payment, wallet);
        }
      }
    }
    await admin
      .from("payments")
      .update({ status: "failed", notes: friendly(charged.message), updated_at: new Date().toISOString() })
      .eq("id", id)
      .in("status", ["created", "pending"]);
    return { ok: false, error: friendly(charged.message) };
  }

  const { data: saved, error: saveError } = await admin
    .from("payments")
    .update({
      trans_id: charged.data.uuid,
      status: "pending",
      checkout_url: charged.data.url,
      medium: mediumFor(wallet),
      financial_trans_id: method,
      updated_at: new Date().toISOString(),
      last_checked_at: null,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (saveError || !saved) {
    return {
      ok: false,
      error: "The mobile money page may already be open. Wait a moment before starting another payment.",
    };
  }

  const payment = saved as PaymentRecord;
  await claimRequestEmail(payment, input.fullName, course.title);
  return toResult(payment, wallet);
}
