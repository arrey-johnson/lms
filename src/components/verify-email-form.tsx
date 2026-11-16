"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import {
  resendEmailOtpAction,
  verifyEmailOtpAction,
} from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VerifyEmailForm({ email }: { email: string }) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join("");

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  function updateDigit(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    const chars = cleaned.slice(0, 6 - index).split("");
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((char, offset) => {
        next[index + offset] = char;
      });
      return next;
    });

    const focusIndex = Math.min(index + chars.length, 5);
    inputsRef.current[focusIndex]?.focus();
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = Array.from({ length: 6 }, (_, i) => pasted[i] || "");
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function copyEnteredCode() {
    if (code.length !== 6) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy. Select the digits manually.");
    }
  }

  function submitCode() {
    setError("");
    setMessage("");
    const formData = new FormData();
    formData.set("email", email);
    formData.set("code", code);
    startTransition(async () => {
      const result = await verifyEmailOtpAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  function resendCode() {
    setError("");
    setMessage("");
    const formData = new FormData();
    formData.set("email", email);
    startTransition(async () => {
      const result = await resendEmailOtpAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage(result?.message || "Code sent.");
      setDigits(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {email}
          </span>
          . Enter it below to confirm your email.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Confirmation code
        </p>
        <button
          type="button"
          onClick={() => void copyEnteredCode()}
          disabled={code.length !== 6}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 disabled:opacity-40 dark:text-blue-400"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
          )}
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>

      <div className="flex justify-between gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={6}
            value={digit}
            onChange={(e) => updateDigit(index, e.target.value)}
            onKeyDown={(e) => onKeyDown(index, e)}
            onPaste={onPaste}
            className={cn(
              "h-14 w-11 rounded-xl border border-slate-200 bg-white text-center text-xl font-semibold tracking-wide text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:h-16 sm:w-12"
            )}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>

      {error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          {message}
        </p>
      ) : null}

      <Button
        type="button"
        className="w-full"
        size="lg"
        disabled={pending || code.length !== 6}
        onClick={() => submitCode()}
      >
        {pending ? "Verifying…" : "Confirm email"}
      </Button>

      <div className="flex flex-col items-center gap-2 text-sm text-slate-500">
        <button
          type="button"
          disabled={pending}
          onClick={() => resendCode()}
          className="font-medium text-blue-700 hover:underline disabled:opacity-60 dark:text-blue-400"
        >
          Resend code
        </button>
        <Link href="/login" className="hover:text-slate-800 dark:hover:text-slate-200">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
