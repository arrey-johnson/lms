import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  camerPayStatusToPaymentStatus,
  camerpayEnvironment,
  getCamerPayTransaction,
  isCamerPayTransactionId,
  type CamerPayTransaction,
} from "@/lib/camerpay/client";
import {
  getPaymentStatus,
  type FapshiTransaction,
} from "@/lib/fapshi/client";
import { mediumLabel } from "@/lib/fapshi/phone";
import {
  sendPaymentFailedMail,
  sendPaymentMismatchMail,
  sendPaymentSuccessMail,
} from "@/lib/mail/send-payment";
import type {
  FapshiEnvironment,
  PaymentRecord,
  PaymentStatus,
  PublicPayment,
} from "@/lib/payments/types";

const MIN_CHECK_MS = 9_000;

export function isMissingPaymentsTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = error.message || "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /could not find the table/i.test(message) ||
    /schema cache/i.test(message)
  );
}

export function mapFapshiStatus(status: string | null | undefined): PaymentStatus {
  switch ((status || "").toUpperCase()) {
    case "SUCCESSFUL":
      return "successful";
    case "FAILED":
      return "failed";
    case "EXPIRED":
      return "expired";
    case "PENDING":
      return "pending";
    default:
      return "created";
  }
}

export function publicPaymentView(payment: PaymentRecord): PublicPayment {
  let message: string | null = null;
  if (
    payment.status !== "failed" &&
    payment.notes &&
    (payment.notes.toLowerCase().includes("does not match") || payment.notes.startsWith("CamerPay"))
  ) {
    message = "We're confirming this payment with support before unlocking the course.";
  } else if (payment.status === "failed") {
    message =
      payment.medium === "card" && payment.notes && payment.notes.length <= 180
        ? payment.notes
        : payment.medium === "card"
          ? "The card payment was not approved. You can try again."
          : "The payment was not approved. You can try again with the same number.";
  } else if (payment.status === "expired") {
    message = "This payment link expired. Start a new payment to continue.";
  }

  return {
    id: payment.id,
    courseId: payment.course_id,
    status: payment.status,
    amountXaf: payment.amount_xaf,
    phone: payment.phone,
    walletLabel: mediumLabel(payment.medium, payment.phone),
    checkoutUrl: payment.checkout_url,
    financialTransId: payment.financial_trans_id,
    message,
  };
}

function asPayment(row: PaymentRecord | null): PaymentRecord | null {
  return row;
}

async function loadPayment(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return asPayment(data as PaymentRecord | null);
}

async function claim(
  id: string,
  column: "success_notified_at" | "failure_notified_at" | "alerted_at"
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payments")
    .update({ [column]: new Date().toISOString() })
    .eq("id", id)
    .is(column, null)
    .select("id");
  if (error) return false;
  return Boolean(data?.length);
}

async function mailContext(payment: PaymentRecord) {
  const admin = createAdminClient();
  const [{ data: course }, { data: profile }] = await Promise.all([
    admin.from("courses").select("title").eq("id", payment.course_id).maybeSingle(),
    admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", payment.user_id)
      .maybeSingle(),
  ]);
  return {
    payment: {
      ...payment,
      email: payment.email || profile?.email || null,
    },
    courseTitle: course?.title || "your course",
    fullName: profile?.full_name as string | null,
  };
}

async function ensureEnrolled(payment: PaymentRecord) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", payment.user_id)
    .eq("course_id", payment.course_id)
    .maybeSingle();
  if (existing) return true;

  const { error } = await admin.from("enrollments").insert({
    user_id: payment.user_id,
    course_id: payment.course_id,
  });
  if (!error || error.code === "23505") return true;

  console.error("Enrollment failed after payment", error);
  await admin
    .from("payments")
    .update({
      notes: "Paid, but enrollment failed. It will be retried automatically.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id);
  return false;
}

function revalidateCourse(courseId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/browse");
  revalidatePath(`/course/${courseId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
}

async function notifySuccess(payment: PaymentRecord, revalidate: boolean) {
  const enrolled = await ensureEnrolled(payment);
  if (!enrolled) return payment;
  if (!(await claim(payment.id, "success_notified_at"))) return payment;
  if (revalidate) revalidateCourse(payment.course_id);
  try {
    await sendPaymentSuccessMail(await mailContext(payment));
  } catch (error) {
    console.error("Payment success email failed", error);
    const admin = createAdminClient();
    await admin
      .from("payments")
      .update({ success_notified_at: null })
      .eq("id", payment.id);
  }
  return payment;
}

function mismatchDetail(payment: PaymentRecord, remote: FapshiTransaction) {
  if (Number(remote.amount) !== Number(payment.amount_xaf)) {
    return `Fapshi collected ${remote.amount} XAF, but this order is ${payment.amount_xaf} XAF.`;
  }
  if (remote.externalId && remote.externalId !== payment.external_id) {
    return "Fapshi returned a different order id than the one we created.";
  }
  if (remote.transId && payment.trans_id && remote.transId !== payment.trans_id) {
    return "Fapshi returned a different transaction id than the one we stored.";
  }
  return null;
}

function patchFromRemote(remote: FapshiTransaction, status: PaymentStatus) {
  const now = new Date().toISOString();
  const patch: Record<string, string | number | null> = {
    status,
    last_checked_at: now,
    updated_at: now,
  };
  if (remote.transId) patch.trans_id = remote.transId;
  if (remote.medium) patch.medium = remote.medium;
  if (remote.financialTransId) patch.financial_trans_id = remote.financialTransId;
  if (typeof remote.revenue === "number") patch.revenue_xaf = remote.revenue;
  if (remote.payerName) patch.payer_name = remote.payerName;
  if (status === "successful") patch.confirmed_at = remote.dateConfirmed || now;
  return patch;
}

async function syncCardPayment(payment: PaymentRecord, revalidate: boolean) {
  if (!payment.trans_id) return { payment };
  const remoteResult = await getCamerPayTransaction(payment.trans_id);
  if (!remoteResult.ok) {
    return { payment, error: remoteResult.message };
  }
  const remote = remoteResult.data;
  const nextStatus = camerPayStatusToPaymentStatus(remote.status);
  const admin = createAdminClient();

  if (nextStatus === "successful") {
    const detail = cardMismatch(payment, remote);
    if (detail) {
      const now = new Date().toISOString();
      await admin
        .from("payments")
        .update({ notes: detail, last_checked_at: now, updated_at: now })
        .eq("id", payment.id);
      if (await claim(payment.id, "alerted_at")) {
        try {
          await sendPaymentMismatchMail({ ...(await mailContext(payment)), detail });
        } catch (error) {
          console.error("Card payment mismatch email failed", error);
        }
      }
      const fresh = (await loadPayment(payment.id)) || payment;
      return { payment: fresh, mismatch: true };
    }

    const now = new Date().toISOString();
    const { data: updated } = await admin
      .from("payments")
      .update({
        status: "successful",
        last_checked_at: now,
        updated_at: now,
        confirmed_at: remote.paidAt || now,
        financial_trans_id: payment.financial_trans_id || "stripe",
        phone: remote.phone || payment.phone,
        environment: remote.isSandbox === true ? "sandbox" : payment.environment,
      })
      .eq("id", payment.id)
      .neq("status", "successful")
      .select("*")
      .maybeSingle();
    const current = (updated as PaymentRecord | null) || (await loadPayment(payment.id)) || payment;
    await notifySuccess(current, revalidate);
    const fresh = (await loadPayment(payment.id)) || current;
    return { payment: fresh };
  }

  if (nextStatus === "failed") {
    const now = new Date().toISOString();
    const note =
      remote.status.toLowerCase() === "refunded"
        ? "CamerPay refunded this payment."
        : payment.notes;
    const { data: updated } = await admin
      .from("payments")
      .update({
        status: "failed",
        notes: note,
        last_checked_at: now,
        updated_at: now,
      })
      .eq("id", payment.id)
      .in("status", ["created", "pending", "failed"])
      .select("*")
      .maybeSingle();
    if (updated && remote.status.toLowerCase() !== "refunded" && (await claim(payment.id, "failure_notified_at"))) {
      try {
        await sendPaymentFailedMail({ ...(await mailContext(updated as PaymentRecord)), expired: false });
      } catch (error) {
        console.error("Card payment failure email failed", error);
        await admin.from("payments").update({ failure_notified_at: null }).eq("id", payment.id);
      }
    }
    const fresh = (await loadPayment(payment.id)) || payment;
    return { payment: fresh };
  }

  await admin
    .from("payments")
    .update({ last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", payment.id)
    .in("status", ["created", "pending"]);
  const fresh = (await loadPayment(payment.id)) || payment;
  return { payment: fresh };
}

function expectedCamerPayMethod(payment: PaymentRecord) {
  if (payment.medium === "card") return "stripe";
  if ((payment.medium || "").toLowerCase().includes("orange")) return "orange_money";
  return "mtn_momo";
}

function cardMismatch(payment: PaymentRecord, remote: CamerPayTransaction) {
  if (remote.isSandbox === true && payment.environment !== "sandbox" && camerpayEnvironment() !== "sandbox") {
    return "CamerPay marked this payment as a test, so the course stays locked.";
  }
  const expected = expectedCamerPayMethod(payment);
  if (remote.paymentMethod && remote.paymentMethod !== expected) {
    return "CamerPay confirmed a different payment method than the one this checkout started.";
  }
  if (remote.currency && remote.currency.toUpperCase() !== "XAF") {
    return `CamerPay collected ${remote.currency}, but this order is priced in FCFA.`;
  }
  if (remote.amount == null || Number(remote.amount) !== Number(payment.amount_xaf)) {
    return `CamerPay collected ${remote.amount ?? "an unknown amount"} XAF, but this order is ${payment.amount_xaf} XAF.`;
  }
  if (remote.invoiceId && remote.invoiceId !== payment.external_id) {
    return "CamerPay returned a different order id than the one we created.";
  }
  return null;
}

export async function syncPaymentById(
  paymentId: string,
  options?: {
    force?: boolean;
    revalidate?: boolean;
    hint?: FapshiTransaction | null;
  }
) {
  const payment = await loadPayment(paymentId);
  if (!payment) return { payment: null as PaymentRecord | null, error: "Payment not found." };

  const revalidate = options?.revalidate !== false;

  if (payment.status === "successful") {
    if (isCamerPayTransactionId(payment.trans_id) && options?.force && payment.trans_id) {
      const remoteResult = await getCamerPayTransaction(payment.trans_id);
      if (remoteResult.ok && remoteResult.data.status.toLowerCase() === "refunded") {
        const detail = "CamerPay refunded this payment after the course was unlocked.";
        const now = new Date().toISOString();
        await createAdminClient()
          .from("payments")
          .update({ notes: detail, updated_at: now, last_checked_at: now })
          .eq("id", payment.id);
        if (await claim(payment.id, "alerted_at")) {
          try {
            await sendPaymentMismatchMail({ ...(await mailContext(payment)), detail });
          } catch (error) {
            console.error("Card refund notice failed", error);
          }
        }
      }
    }
    await notifySuccess(payment, revalidate);
    const fresh = (await loadPayment(payment.id)) || payment;
    return { payment: fresh };
  }

  const directFailureIsFinal = payment.status === "failed" && !payment.checkout_url;
  if ((directFailureIsFinal || payment.status === "expired") && !options?.force) {
    return { payment };
  }

  if (!payment.trans_id && !options?.hint?.transId) {
    return { payment };
  }

  const checkedAt = payment.last_checked_at
    ? new Date(payment.last_checked_at).getTime()
    : 0;
  if (!options?.force && checkedAt && Date.now() - checkedAt < MIN_CHECK_MS) {
    return { payment };
  }

  if (payment.medium === "card" || isCamerPayTransactionId(payment.trans_id)) {
    return syncCardPayment(payment, revalidate);
  }

  const transId = payment.trans_id || options?.hint?.transId || "";
  const environment = payment.environment as FapshiEnvironment;
  const remoteResult = await getPaymentStatus(environment, transId);

  let remote: FapshiTransaction | null = remoteResult.ok ? remoteResult.data : null;
  if (!remoteResult.ok && remoteResult.status === 429 && options?.hint?.transId === transId) {
    remote = options.hint;
  }
  if (!remote) {
    return {
      payment,
      throttled: !remoteResult.ok && remoteResult.status === 429,
      error: remoteResult.ok ? undefined : remoteResult.message,
    };
  }

  const nextStatus = mapFapshiStatus(remote.status);
  const admin = createAdminClient();

  if (nextStatus === "successful") {
    const detail = mismatchDetail(payment, remote);
    if (detail) {
      const now = new Date().toISOString();
      await admin
        .from("payments")
        .update({
          notes: detail,
          last_checked_at: now,
          updated_at: now,
          financial_trans_id: remote.financialTransId || payment.financial_trans_id,
        })
        .eq("id", payment.id);
      if (await claim(payment.id, "alerted_at")) {
        try {
          await sendPaymentMismatchMail({
            ...(await mailContext(payment)),
            detail,
          });
        } catch (error) {
          console.error("Payment mismatch email failed", error);
        }
      }
      const fresh = (await loadPayment(payment.id)) || payment;
      return { payment: fresh, mismatch: true };
    }

    const { data: updated } = await admin
      .from("payments")
      .update(patchFromRemote(remote, "successful"))
      .eq("id", payment.id)
      .neq("status", "successful")
      .select("*")
      .maybeSingle();

    const current = (updated as PaymentRecord | null) || (await loadPayment(payment.id)) || payment;
    await notifySuccess(current, revalidate);
    const fresh = (await loadPayment(payment.id)) || current;
    return { payment: fresh };
  }

  if (nextStatus === "failed" || nextStatus === "expired") {
    const { data: updated } = await admin
      .from("payments")
      .update(patchFromRemote(remote, nextStatus))
      .eq("id", payment.id)
      .in("status", ["created", "pending", "failed"])
      .select("*")
      .maybeSingle();

    const current = (updated as PaymentRecord | null) || payment;
    if (updated && (await claim(payment.id, "failure_notified_at"))) {
      try {
        await sendPaymentFailedMail({
          ...(await mailContext(current)),
          expired: nextStatus === "expired",
        });
      } catch (error) {
        console.error("Payment failure email failed", error);
        await admin
          .from("payments")
          .update({ failure_notified_at: null })
          .eq("id", payment.id);
      }
    } else if (!updated) {
      await admin
        .from("payments")
        .update({ last_checked_at: new Date().toISOString() })
        .eq("id", payment.id);
    }

    const fresh = (await loadPayment(payment.id)) || current;
    return { payment: fresh };
  }

  await admin
    .from("payments")
    .update(patchFromRemote(remote, nextStatus === "created" ? "pending" : nextStatus))
    .eq("id", payment.id)
    .in("status", ["created", "pending"]);

  const fresh = (await loadPayment(payment.id)) || payment;
  return { payment: fresh };
}

export async function syncOpenPaymentsForUser(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["created", "pending", "successful"])
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    if (isMissingPaymentsTable(error)) return [];
    console.error("Could not load payments to reconcile", error);
    return [];
  }

  const todo = ((data || []) as PaymentRecord[])
    .filter((payment) => payment.status !== "successful" || !payment.success_notified_at)
    .slice(0, 4);

  const results: PaymentRecord[] = [];
  for (const payment of todo) {
    try {
      const synced = await syncPaymentById(payment.id, { revalidate: false });
      if (synced.payment) results.push(synced.payment);
    } catch (syncError) {
      console.error("Payment reconcile failed", syncError);
    }
  }
  return results;
}

export async function listOpenPayments(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payments")
    .select("id, course_id, status, amount_xaf, phone, created_at")
    .eq("user_id", userId)
    .in("status", ["created", "pending"])
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    if (isMissingPaymentsTable(error)) return [];
    return [];
  }
  return data || [];
}
