import { randomUUID } from "crypto";
import { checkoutReturnUrl } from "@/lib/app-url";
import { courseAmountXaf } from "@/lib/currency";
import {
  activeFapshiEnvironment,
  directPay,
  findTransactionByExternalId,
  initiatePay,
  isDirectPayUnavailable,
  type FapshiTransaction,
} from "@/lib/fapshi/client";
import { classifyWallet, normalizeCameroonPhone } from "@/lib/fapshi/phone";
import { sendPaymentRequestedMail } from "@/lib/mail/send-payment";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  FapshiEnvironment,
  PaymentRecord,
  StartPaymentResult,
  Wallet,
} from "@/lib/payments/types";

const NOT_READY =
  "Mobile money checkout is not ready yet. Create the payments table from supabase/payments.sql, then try again.";

function missingTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = error.message || "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /could not find the table|schema cache/i.test(message)
  );
}

function friendlyFapshiError(message: string) {
  const clean = message.replace(/\s+/g, " ").trim();
  if (!clean || clean.length > 180 || /fapshi\.com|forbidden request/i.test(clean)) {
    return "Fapshi could not start the payment. Check the number and try again.";
  }
  return clean;
}

function reusableCharge(
  remote: FapshiTransaction | null | undefined
): remote is FapshiTransaction {
  if (!remote?.transId) return false;
  const status = (remote.status || "").toUpperCase();
  if ((status === "FAILED" || status === "EXPIRED") && !remote.link) return false;
  return true;
}

function toResult(payment: PaymentRecord, wallet: Wallet): StartPaymentResult {
  return {
    ok: true,
    paymentId: payment.id,
    courseId: payment.course_id,
    status: payment.status === "created" ? "pending" : payment.status,
    mode: payment.checkout_url ? "link" : "prompt",
    checkoutUrl: payment.checkout_url,
    amountXaf: payment.amount_xaf,
    phone: payment.phone || "",
    wallet,
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
    await sendPaymentRequestedMail({
      payment,
      courseTitle,
      fullName,
    });
  } catch (error) {
    console.error("Payment request email failed", error);
    await admin
      .from("payments")
      .update({ request_notified_at: null })
      .eq("id", payment.id);
  }
}

async function saveCharge(
  payment: PaymentRecord,
  remote: FapshiTransaction,
  checkoutUrl: string | null
) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("payments")
    .update({
      trans_id: remote.transId,
      status: "pending",
      checkout_url: checkoutUrl,
      medium: remote.medium || payment.medium,
      updated_at: now,
      last_checked_at: null,
    })
    .eq("id", payment.id)
    .select("*")
    .maybeSingle();
  if (error || !data) {
    throw new Error(error?.message || "Could not save the Fapshi transaction.");
  }
  return data as PaymentRecord;
}

async function markStartFailed(paymentId: string, notes: string) {
  const admin = createAdminClient();
  await admin
    .from("payments")
    .update({
      status: "failed",
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .in("status", ["created", "pending"]);
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
    return {
      ok: false,
      error: "Enter a Cameroon mobile number, 9 digits starting with 6.",
    };
  }
  const wallet = classifyWallet(phone);
  if (!wallet) {
    return {
      ok: false,
      error:
        "Use an MTN Mobile Money or Orange Money number. Nexttel and Camtel numbers can't pay here.",
    };
  }

  const admin = createAdminClient();
  const [{ data: course, error: courseError }, { data: enrollment }] =
    await Promise.all([
      admin
        .from("courses")
        .select("id, title, price_cents")
        .eq("id", input.courseId)
        .maybeSingle(),
      admin
        .from("enrollments")
        .select("id")
        .eq("user_id", input.userId)
        .eq("course_id", input.courseId)
        .maybeSingle(),
    ]);

  if (courseError) return { ok: false, error: courseError.message };
  if (!course) return { ok: false, error: "That course is no longer available." };
  if (enrollment) {
    return { ok: false, error: "You already own this course.", alreadyEnrolled: true };
  }

  const environment = activeFapshiEnvironment();
  const amountXaf = courseAmountXaf(course.price_cents);
  const priceCents = course.price_cents;

  const { data: openRow, error: openError } = await admin
    .from("payments")
    .select("*")
    .eq("user_id", input.userId)
    .eq("course_id", input.courseId)
    .eq("environment", environment)
    .neq("medium", "card")
    .in("status", ["created", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openError) {
    if (missingTable(openError)) return { ok: false, error: NOT_READY };
    return { ok: false, error: openError.message };
  }

  let payment = openRow as PaymentRecord | null;

  if (payment?.trans_id) {
    const storedWallet = payment.phone ? classifyWallet(payment.phone) || wallet : wallet;
    return toResult(payment, storedWallet);
  }

  if (payment && !payment.trans_id) {
    const recovered = await findTransactionByExternalId(
      environment,
      input.userId,
      payment.external_id
    );
    if (!recovered.ok && recovered.status === 0) {
      return { ok: false, error: recovered.message };
    }
    if (recovered.ok && recovered.data?.transId) {
      const saved = await saveCharge(
        payment,
        recovered.data,
        payment.checkout_url
      );
      await claimRequestEmail(saved, input.fullName, course.title);
      return toResult(saved, wallet);
    }
    const age = Date.now() - new Date(payment.created_at).getTime();
    if (age < 90_000) {
      return {
        ok: false,
        error: "A payment is already being created. Wait a moment, then try again.",
      };
    }
  }

  if (!payment) {
    const id = randomUUID();
    const now = new Date().toISOString();
    const { data: inserted, error: insertError } = await admin
      .from("payments")
      .insert({
        id,
        user_id: input.userId,
        course_id: input.courseId,
        amount_xaf: amountXaf,
        price_cents: priceCents,
        status: "created",
        environment,
        external_id: id,
        phone,
        medium: wallet === "orange" ? "orange money" : "mobile money",
        payer_name: input.fullName,
        email: input.email,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .maybeSingle();

    if (insertError || !inserted) {
      if (missingTable(insertError)) return { ok: false, error: NOT_READY };
      return {
        ok: false,
        error: insertError?.message || "Could not create the payment.",
      };
    }
    payment = inserted as PaymentRecord;
  } else if (payment.phone !== phone) {
    const { data: updated } = await admin
      .from("payments")
      .update({
        phone,
        medium: wallet === "orange" ? "orange money" : "mobile money",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .select("*")
      .maybeSingle();
    if (updated) payment = updated as PaymentRecord;
  }

  let charged: Awaited<ReturnType<typeof chargeFapshi>>;
  try {
    charged = await chargeFapshi({
      payment,
      environment,
      wallet,
      fullName: input.fullName,
      email: input.email,
      courseTitle: course.title,
    });
  } catch (error) {
    console.error("Saving the Fapshi payment failed", error);
    return {
      ok: false,
      error:
        "The payment request may already be on your phone. Wait a moment and try again before approving a second prompt.",
    };
  }

  if (!charged.ok) {
    await markStartFailed(payment.id, charged.error);
    return charged;
  }

  await claimRequestEmail(charged.payment, input.fullName, course.title);
  return toResult(charged.payment, wallet);
}

async function chargeFapshi(input: {
  payment: PaymentRecord;
  environment: FapshiEnvironment;
  wallet: Wallet;
  fullName: string | null;
  email: string | null;
  courseTitle: string;
}): Promise<{ ok: true; payment: PaymentRecord } | { ok: false; error: string }> {
  const message = `Promptstack Classroom — ${input.courseTitle}`.slice(0, 140);
  const phone = input.payment.phone || "";
  const shared = {
    amount: input.payment.amount_xaf,
    name: input.fullName || undefined,
    email: input.email || undefined,
    userId: input.payment.user_id,
    externalId: input.payment.external_id,
    message,
  };

  const direct = await directPay(input.environment, {
    ...shared,
    phone,
    wallet: input.wallet,
  });

  if (direct.ok && direct.data.transId) {
    const payment = await saveCharge(input.payment, direct.data, null);
    return { ok: true, payment };
  }

  if (!direct.ok && direct.status === 0) {
    const recovered = await findTransactionByExternalId(
      input.environment,
      input.payment.user_id,
      input.payment.external_id
    );
    if (recovered.ok && recovered.data?.transId) {
      const payment = await saveCharge(input.payment, recovered.data, null);
      return { ok: true, payment };
    }
    return { ok: false, error: direct.message };
  }

  const directMessage = direct.ok
    ? "Fapshi accepted the payment but did not return a transaction id."
    : direct.message;

  if (!direct.ok && !isDirectPayUnavailable(direct.message, direct.status)) {
    const recovered = await findTransactionByExternalId(
      input.environment,
      input.payment.user_id,
      input.payment.external_id
    );
    if (recovered.ok && reusableCharge(recovered.data)) {
      const payment = await saveCharge(input.payment, recovered.data, null);
      return { ok: true, payment };
    }
    return { ok: false, error: friendlyFapshiError(directMessage) };
  }

  const recoveredBeforeLink = await findTransactionByExternalId(
    input.environment,
    input.payment.user_id,
    input.payment.external_id
  );
  if (recoveredBeforeLink.ok && reusableCharge(recoveredBeforeLink.data)) {
    const payment = await saveCharge(
      input.payment,
      recoveredBeforeLink.data,
      input.payment.checkout_url
    );
    return { ok: true, payment };
  }

  const redirectUrl = checkoutReturnUrl(input.payment.course_id, input.payment.id);
  const link = await initiatePay(input.environment, {
    amount: input.payment.amount_xaf,
    email: input.email || undefined,
    redirectUrl: redirectUrl || undefined,
    userId: input.payment.user_id,
    externalId: input.payment.external_id,
    message,
  });

  if (link.ok && link.data.transId && link.data.link) {
    const payment = await saveCharge(input.payment, link.data, link.data.link);
    return { ok: true, payment };
  }

  if (!link.ok && link.status === 0) {
    return { ok: false, error: link.message };
  }

  return {
    ok: false,
    error: friendlyFapshiError(
      link.ok ? directMessage : link.message || directMessage
    ),
  };
}
