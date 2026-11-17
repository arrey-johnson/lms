import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { CheckoutPanel } from "@/components/checkout-panel";
import { courseStudyLabel } from "@/content/ai-foundations-module-1";
import { activeFapshiEnvironment } from "@/lib/fapshi/client";
import { classifyWallet } from "@/lib/fapshi/phone";
import { courseAmountXaf } from "@/lib/currency";
import { syncPaymentById } from "@/lib/payments/sync";
import type { PaymentRecord, Wallet } from "@/lib/payments/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { profile, userId } = await requireStudent();
  const { courseId } = await params;
  const { payment: paymentQuery } = await searchParams;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, price_cents, curriculum_slug, thumbnail_path")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) notFound();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (enrollment) redirect(`/course/${courseId}`);

  let payment: PaymentRecord | null = null;
  if (paymentQuery) {
    const { data } = await admin
      .from("payments")
      .select("*")
      .eq("id", paymentQuery)
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();
    payment = (data as PaymentRecord | null) ?? null;
  }

  if (!payment) {
    const { data } = await admin
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    payment = (data as PaymentRecord | null) ?? null;
  }

  const canRefresh =
    payment?.trans_id &&
    payment.status !== "expired" &&
    !(payment.status === "failed" && !payment.checkout_url);
  if (payment && canRefresh) {
    try {
      const synced = await syncPaymentById(payment.id, {
        force: Boolean(paymentQuery),
      });
      payment = synced.payment;
    } catch (error) {
      console.error("Checkout payment sync failed", error);
    }
  }

  if (payment?.status === "successful") redirect(`/course/${courseId}`);

  const priceCents =
    typeof course.price_cents === "number" && course.price_cents > 0
      ? course.price_cents
      : 9900;
  const amountXaf = payment?.amount_xaf || courseAmountXaf(priceCents);
  const wallet = (payment?.phone ? classifyWallet(payment.phone) : null) as Wallet | null;

  let thumbnailUrl: string | null = null;
  if (course.thumbnail_path) {
    const { data } = await supabase.storage
      .from("course-videos")
      .createSignedUrl(course.thumbnail_path, 60 * 60);
    thumbnailUrl = data?.signedUrl ?? null;
  }

  const { count } = await supabase
    .from("modules")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  const initial =
    payment && wallet
      ? {
          paymentId: payment.id,
          status: payment.status,
          mode: payment.checkout_url ? ("link" as const) : ("prompt" as const),
          checkoutUrl: payment.checkout_url,
          phone: payment.phone || "",
          wallet,
          message:
            payment.status === "failed"
              ? "The last payment was not approved. You can send a new prompt."
              : payment.status === "expired"
                ? "The last payment link expired. Start a new payment."
                : null,
        }
      : null;

  return (
    <AppShell
      brandHref="/dashboard"
      userLabel={profile.full_name || profile.email || "Student"}
      avatarUrl={profile.avatar_url}
      nav={[
        { href: "/dashboard", label: "My courses", shortLabel: "Courses" },
        { href: "/browse", label: "Browse courses", shortLabel: "Browse" },
      ]}
    >
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <section className="overflow-hidden rounded-3xl border border-[color:var(--border)] bg-surface-elevated dark:border-slate-800 dark:bg-slate-900">
          <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-800">
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="space-y-3 p-6">
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to courses
            </Link>
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-slate-900 dark:text-white">
              {course.title}
            </h1>
            {course.description ? (
              <p className="text-sm leading-6 text-slate-500">{course.description}</p>
            ) : null}
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {courseStudyLabel(course.curriculum_slug, count || 0)}
            </p>
            <p className="text-sm leading-6 text-slate-500">
              Pay with MTN Mobile Money or Orange Money. The course unlocks the
              moment the payment is confirmed, and we email your receipt.
            </p>
          </div>
        </section>

        <CheckoutPanel
          courseId={courseId}
          courseTitle={course.title}
          amountXaf={amountXaf}
          testMode={activeFapshiEnvironment() === "sandbox"}
          initial={initial}
        />
      </div>
    </AppShell>
  );
}
