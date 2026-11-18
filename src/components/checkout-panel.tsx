"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Loader2, Smartphone } from "lucide-react";
import { startCardPayment, startMobileMoneyPayment } from "@/lib/actions/payments";
import {
  classifyWallet,
  formatCameroonPhone,
  normalizeCameroonPhone,
  walletLabel,
} from "@/lib/fapshi/phone";
import { formatXaf } from "@/lib/currency";
import type { PaymentStatus, PublicPayment, Wallet } from "@/lib/payments/types";

type ActivePayment = {
  paymentId: string;
  status: PaymentStatus;
  mode: "prompt" | "link";
  checkoutUrl: string | null;
  phone: string;
  wallet: Wallet | null;
  method: "momo" | "card";
  message: string | null;
};

export function CheckoutPanel({
  courseId,
  courseTitle,
  amountXaf,
  testMode,
  initial,
}: {
  courseId: string;
  courseTitle: string;
  amountXaf: number;
  testMode: boolean;
  initial: ActivePayment | null;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<"momo" | "card">(initial?.method || "momo");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [active, setActive] = useState<ActivePayment | null>(
    initial && initial.status !== "failed" && initial.status !== "expired"
      ? initial
      : null
  );
  const [error, setError] = useState<string | null>(initial?.message || null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!active) return;
    if (
      active.status === "successful" ||
      active.status === "failed" ||
      active.status === "expired"
    ) {
      return;
    }

    let cancelled = false;
    let timer = 0;

    const tick = async () => {
      try {
        const response = await fetch(`/api/payments/${active.paymentId}/status`, {
          cache: "no-store",
        });
        const data = (await response.json()) as PublicPayment & { error?: string };
        if (cancelled) return;
        if (!response.ok || !data.status) {
          timer = window.setTimeout(tick, 11000);
          return;
        }
        setActive((current) =>
          current
            ? {
                ...current,
                status: data.status,
                checkoutUrl: data.checkoutUrl || current.checkoutUrl,
                message: data.message,
              }
            : current
        );
        if (
          data.status === "successful" ||
          data.status === "failed" ||
          data.status === "expired"
        ) {
          if (data.status !== "successful" && data.message) setError(data.message);
          if (data.status === "successful") {
            router.refresh();
          }
          return;
        }
      } catch {
        // The next tick retries.
      }
      timer = window.setTimeout(tick, 11000);
    };

    timer = window.setTimeout(tick, 9500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [active?.paymentId, active?.status, router]);

  useEffect(() => {
    if (active?.status !== "successful") return;
    const timer = window.setTimeout(() => {
      router.push(`/course/${courseId}`);
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [active?.status, courseId, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result =
      method === "card"
        ? await startCardPayment(courseId, "")
        : await startMobileMoneyPayment(courseId, phone);
    setPending(false);
    if (!result.ok) {
      if (result.alreadyEnrolled) {
        router.push(`/course/${courseId}`);
        return;
      }
      setError(result.error);
      return;
    }
    setPhone(result.phone);
    setActive({
      paymentId: result.paymentId,
      status: result.status,
      mode: result.mode,
      checkoutUrl: result.checkoutUrl,
      phone: result.phone,
      wallet: result.method === "card" ? null : result.wallet,
      method: result.method === "card" ? "card" : "momo",
      message: null,
    });
    if (result.mode === "link" && result.checkoutUrl) {
      window.location.assign(result.checkoutUrl);
    }
  }

  const amount = formatXaf(amountXaf);
  const previewWallet = classifyWallet(normalizeCameroonPhone(phone) || "");

  if (active?.status === "successful") {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">
          Payment received
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {courseTitle} is unlocked. A receipt is on its way to your email.
        </p>
      </div>
    );
  }

  if (active && active.status !== "failed" && active.status !== "expired") {
    const network = active.method === "card" ? "card" : walletLabel(active.wallet);
    return (
      <div className="rounded-3xl border border-[color:var(--border)] bg-surface-elevated p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0070F8]/10 text-[#0070F8]">
            {active.method === "card" ? <CreditCard className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {active.method === "card" ? `Pay ${amount} by card` : `Pay ${amount} with ${network}`}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {active.method === "card"
                ? "Finish the Visa or Mastercard payment on CamerPay. We’ll unlock the course as soon as it is confirmed."
                : active.checkoutUrl?.includes("fapshi.com")
                  ? "Finish the payment on Fapshi’s secure page. We’ll detect it and unlock the course."
                  : active.wallet === "orange"
                    ? `Continue on CamerPay. Orange Money then sends a direct USSD prompt to ${formatCameroonPhone(active.phone)}. Enter your PIN on the phone.`
                    : `Continue on CamerPay. MTN then sends a MoMo notification to ${formatCameroonPhone(active.phone)}. Approve it with your PIN.`}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-sm font-medium text-[#0070F8]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Watching for the payment
        </div>

        {active.mode === "link" && active.checkoutUrl ? (
          <a
            href={active.checkoutUrl}
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0070F8] text-sm font-semibold text-white hover:bg-blue-700"
          >
            {active.method === "card" ? "Continue card payment" : "Continue mobile money"}
          </a>
        ) : (
          <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            Keep this page open. As soon as {network} confirms the payment, the
            course unlocks and we email your receipt.
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-[color:var(--border)] bg-surface-elevated p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Pay once</p>
          <p className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {amount}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MethodButton
          active={method === "momo"}
          onClick={() => {
            setMethod("momo");
            setError(null);
          }}
        >
          <Smartphone className="h-4 w-4" />
          Mobile money
        </MethodButton>
        <MethodButton
          active={method === "card"}
          onClick={() => {
            setMethod("card");
            setError(null);
          }}
        >
          <CreditCard className="h-4 w-4" />
          Card
        </MethodButton>
      </div>

      {method === "momo" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <NetworkPill active={previewWallet === "mtn"} tone="mtn">
            MTN Mobile Money
          </NetworkPill>
          <NetworkPill active={previewWallet === "orange"} tone="orange">
            Orange Money
          </NetworkPill>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Visa and Mastercard, including cards issued outside Cameroon. You’ll enter the card on CamerPay’s secure page. The price stays in FCFA.
        </p>
      )}

      {method === "momo" ? (
        <>
          <label htmlFor="momo-phone" className="mt-6 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Mobile money number
          </label>
          <div className="mt-1.5 flex overflow-hidden rounded-xl border border-[color:var(--border)] bg-white focus-within:border-[#0070F8] focus-within:ring-2 focus-within:ring-[#0070F8]/20 dark:border-slate-700 dark:bg-slate-950">
            <span className="flex items-center border-r border-[color:var(--border)] px-3 text-sm font-semibold text-slate-500 dark:border-slate-700">
              +237
            </span>
            <input
              id="momo-phone"
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="6XX XX XX XX"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-12 w-full bg-transparent px-3 text-base text-slate-900 outline-none dark:text-white"
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            {previewWallet
              ? `We’ll request ${walletLabel(previewWallet)} on this number.`
              : "MTN numbers start with 67, 68, or 650–654. Orange numbers start with 69 or 655–659."}
          </p>
        </>
      ) : null}

      {testMode && method === "momo" ? (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          CamerPay sandbox — the payment page can simulate success or failure. No real money moves.
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0070F8] text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {pending
          ? method === "card"
            ? "Opening card payment…"
            : "Sending prompt…"
          : method === "card"
            ? `Pay ${amount} by card`
            : `Pay ${amount}`}
      </button>
      <p className="mt-3 text-center text-xs leading-5 text-slate-400">
        {method === "card"
          ? "You’ll get a receipt by email when the card payment is confirmed."
          : "You’ll get an email when the course unlocks. CamerPay sends the PIN request to your phone after you continue."}
      </p>
    </form>
  );
}

function MethodButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${
        active
          ? "border-[#0070F8] bg-[#0070F8] text-white"
          : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

function NetworkPill({
  children,
  active,
  tone,
}: {
  children: React.ReactNode;
  active: boolean;
  tone: "mtn" | "orange";
}) {
  const activeClass =
    tone === "mtn"
      ? "border-[#FFCC00] bg-[#FFCC00] text-slate-950"
      : "border-[#FF6600] bg-[#FF6600] text-white";
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        active
          ? activeClass
          : "border-slate-200 text-slate-500 dark:border-slate-700"
      }`}
    >
      {children}
    </span>
  );
}
