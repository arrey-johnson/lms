import { randomUUID } from "crypto";
import { checkoutReturnUrl, getAppUrl } from "@/lib/app-url";
import { createCardCheckout, camerpayConfigured, camerpayEnvironment } from "@/lib/camerpay/client";
import { courseAmountXaf } from "@/lib/currency";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentRecord, StartPaymentResult } from "@/lib/payments/types";

const NOT_READY = "Card payments are not ready yet. Try mobile money, or check back shortly.";

function cardPhone(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return { ok: true as const, phone: null };
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) {
    return {
      ok: false as const,
      error: "Enter a phone number with the country code, or leave it blank.",
    };
  }
  return { ok: true as const, phone: `+${digits}` };
}

function friendly(message: string) {
  const clean = message.replace(/\s+/g, " ").trim();
  if (!clean || clean.length > 180) {
    return "CamerPay could not start the card payment. Try again in a moment.";
  }
  return clean;
}

export async function startCardCheckout(input: {
  userId: string;
  courseId: string;
  phone: string;
  fullName: string | null;
  email: string | null;
}): Promise<StartPaymentResult> {
  const phone = cardPhone(input.phone);
  if (!phone.ok) return { ok: false, error: phone.error };
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
  if (enrollment) {
    return { ok: false, error: "You already own this course.", alreadyEnrolled: true };
  }

  const environment = camerpayEnvironment();
  const amountXaf = courseAmountXaf(course.price_cents);
  const { data: openRow } = await admin
    .from("payments")
    .select("*")
    .eq("user_id", input.userId)
    .eq("course_id", input.courseId)
    .eq("environment", environment)
    .eq("medium", "card")
    .in("status", ["created", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const open = openRow as PaymentRecord | null;
  if (open?.checkout_url && open.trans_id) {
    const age = Date.now() - new Date(open.created_at).getTime();
    if (age < 30 * 60 * 1000) {
      return {
        ok: true,
        paymentId: open.id,
        courseId: open.course_id,
        status: open.status === "created" ? "pending" : open.status,
        mode: "link",
        checkoutUrl: open.checkout_url,
        amountXaf: open.amount_xaf,
        phone: open.phone || phone.phone || "",
        wallet: null,
        method: "card",
        testMode: environment === "sandbox",
      };
    }
  }

  const id = open?.id || randomUUID();
  const returnUrl = checkoutReturnUrl(input.courseId, id);
  const origin = getAppUrl();
  const callbackUrl = origin.startsWith("https://") ? `${origin}/api/payments/camerpay` : "";
  if (!returnUrl || !callbackUrl) {
    return { ok: false, error: "Card checkout needs an https site address before it can start." };
  }

  const now = new Date().toISOString();
  if (!open) {
    const { error: insertError } = await admin.from("payments").insert({
      id,
      user_id: input.userId,
      course_id: input.courseId,
      amount_xaf: amountXaf,
      price_cents: course.price_cents,
      status: "created",
      environment,
      external_id: id,
      phone: phone.phone,
      medium: "card",
      payer_name: input.fullName,
      email: input.email,
      created_at: now,
      updated_at: now,
    });
    if (insertError) return { ok: false, error: insertError.message };
  }

  const charged = await createCardCheckout({
    amount: amountXaf,
    phone: phone.phone,
    email: input.email,
    name: input.fullName,
    invoiceId: id,
    callbackUrl,
    returnUrl,
  });

  if (!charged.ok) {
    await admin
      .from("payments")
      .update({ status: "failed", notes: charged.message, updated_at: new Date().toISOString() })
      .eq("id", id)
      .in("status", ["created", "pending"]);
    return { ok: false, error: friendly(charged.message) };
  }

  const { error: saveError } = await admin
    .from("payments")
    .update({
      trans_id: charged.data.uuid,
      status: "pending",
      checkout_url: charged.data.url,
      phone: phone.phone,
      medium: "card",
      financial_trans_id: "stripe",
      updated_at: new Date().toISOString(),
      last_checked_at: null,
    })
    .eq("id", id);
  if (saveError) {
    return {
      ok: false,
      error: "The card page may already be open. Wait a moment before starting another payment.",
    };
  }

  return {
    ok: true,
    paymentId: id,
    courseId: input.courseId,
    status: "pending",
    mode: "link",
    checkoutUrl: charged.data.url,
    amountXaf,
    phone: phone.phone || "",
    wallet: null,
    method: "card",
    testMode: environment === "sandbox",
  };
}
