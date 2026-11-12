"use client";

import { useState, useTransition } from "react";
import {
  updatePasswordAction,
  updateProfileAction,
} from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/types";

export function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        setError("");
        setMessage("");
        startTransition(async () => {
          const result = await updateProfileAction(formData);
          if (result?.error) {
            setError(result.error);
            return;
          }
          setMessage("Profile updated.");
        });
      }}
    >
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={profile.email ?? ""} disabled />
        <p className="mt-1 text-xs text-slate-400">Email can’t be changed here.</p>
      </div>
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name ?? ""}
          placeholder="Your name"
        />
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-blue-700">{message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

export function PasswordSettingsForm() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        setError("");
        setMessage("");
        startTransition(async () => {
          const result = await updatePasswordAction(formData);
          if (result?.error) {
            setError(result.error);
            return;
          }
          setMessage("Password updated.");
          (document.getElementById("password") as HTMLInputElement | null)?.form?.reset();
        });
      }}
    >
      <div>
        <Label htmlFor="password">New password</Label>
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
        <Label htmlFor="confirm_password">Confirm new password</Label>
        <PasswordInput
          id="confirm_password"
          name="confirm_password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Repeat password"
        />
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-blue-700">{message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
