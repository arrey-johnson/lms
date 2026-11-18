import { randomUUID } from "crypto";
import { checkoutReturnUrl, getAppUrl } from "@/lib/app-url";
import { courseAmountXaf } from "@/lib/currency";
import { createCardCheckout, elyonConfigured, elyonEnvironment } from "@/lib/elyon/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentRecord, StartPaymentResult } from "@/lib/payments/types";

const NOT_READY = "Card payments are not ready yet. Try mobile money, or check back shortly.";

function internationalPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}

function friendly(message: string) {
  const clean = message.replace(/\s+/g, " ").trim();
  if (!clean || clean.length > 180) {
    return "ElyonPay could not start the card payment. Check the phone number and try again.";
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
  const phone = internationalPhone(input.phone);
  if (!phone) {
    return {
      ok: false,
      error: "Enter a phone number with the country code, like +237 or +1.",
    };
  }
  if (!elyonConfigured()) return { ok: false, error: NOT_READY };

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

  const environment = elyonEnvironment();
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
        phone: open.phone || phone,
        wallet: "mtn",
        method: "card",
        testMode: environment === "sandbox",
      };
    }
  }

  const id = open?.id || randomUUID();
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
      phone,
      medium: "card",
      payer_name: input.fullName,
      email: input.email,
      created_at: now,
      updated_at: now,
    });
    if (insertError) return { ok: false, error: insertError.message };
  }

  const returnUrl = checkoutReturnUrl(input.courseId, id);
  if (!returnUrl) {
    return { ok: false, error: "Card checkout needs an https site address before it can start." };
  }
  const origin = getAppUrl();
  const charged = await createCardCheckout({
    amount: amountXaf,
    phone,
    email: input.email,
    name: input.fullName,
    userId: input.userId,
    externalId: id,
    description: `Promptstack Classroom — ${course.title}`,
    successUrl: returnUrl,
    errorUrl: returnUrl,
    webhookUrl: origin.startsWith("https://") ? `${origin}/api/payments/elyon` : undefined,
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
      phone,
      medium: "card",
      financial_trans_id: charged.data.provider,
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
    phone,
    wallet: "mtn",
    method: "card",
    testMode: environment === "sandbox",
  };
}
