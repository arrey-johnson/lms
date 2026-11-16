"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  next,
  initialError,
  initialEmail,
  verified,
}: {
  next?: string;
  initialError?: string;
  initialEmail?: string;
  verified?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState(initialError || "");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        setError("");
        startTransition(async () => {
          const result = await loginAction(formData);
          if (result?.needsVerification && result.email) {
            router.push(
              `/verify-email?email=${encodeURIComponent(result.email)}`
            );
            return;
          }
          if (result?.error) setError(result.error);
        });
      }}
    >
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {verified ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          Email confirmed. You can sign in now.
        </p>
      ) : null}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={initialEmail || ""}
          placeholder="you@email.com"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>
      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-slate-500">
        New here?{" "}
        <Link
          href="/signup"
          className="font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
