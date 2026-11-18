"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export function SignupForm({ next = "" }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        setError("");
        startTransition(async () => {
          const result = await signupAction(formData);
          if (result?.needsVerification && result.email) {
            const params = new URLSearchParams({ email: result.email });
            if (result.error) params.set("mailError", result.error);
            if (next) params.set("next", next);
            router.push(`/verify-email?${params.toString()}`);
            return;
          }
          if (result?.error) {
            setError(result.error);
          }
        });
      }}
    >
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          name="full_name"
          autoComplete="name"
          placeholder="Ada Lovelace"
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@email.com"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="At least 6 characters"
        />
      </div>
      <div>
        <Label htmlFor="confirm_password">Confirm password</Label>
        <PasswordInput
          id="confirm_password"
          name="confirm_password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Repeat password"
        />
      </div>
      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-slate-500">
        Already learning with us?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
