"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, LockKeyhole, Sparkles, Trash2 } from "lucide-react";
import {
  updateAvatarAction,
  updatePasswordAction,
  updateProfileAction,
} from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/types";

export function ProfileSettingsPanel({
  profile,
}: {
  profile: Profile & { avatar_url?: string | null };
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  async function saveProfile() {
    setError("");
    setMessage("");
    const formData = new FormData();
    formData.set("full_name", fullName);
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage("Profile saved.");
      router.refresh();
    });
  }

  async function uploadPhoto(file: File | null) {
    if (!file) return;
    setError("");
    setMessage("");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;
      setAvatarUrl(publicUrl);
      const result = await updateAvatarAction({ avatarUrl: publicUrl });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage("Photo uploaded.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await updateAvatarAction({ avatarUrl: null });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setAvatarUrl(null);
      setMessage("Photo removed.");
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[color:var(--border)] bg-surface-elevated shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 px-6 pb-16 pt-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
              <Sparkles className="h-3.5 w-3.5" />
              Your profile
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
              {fullName || "Add your name"}
            </h2>
            <p className="mt-1 text-sm text-blue-100/90">{profile.email}</p>
          </div>
        </div>
      </div>

      <div className="relative px-6 pb-6">
        <div className="-mt-12 flex flex-wrap items-end gap-3">
          <Avatar
            avatarUrl={avatarUrl}
            name={fullName || profile.email}
            size="xl"
            className="ring-4 ring-white shadow-lg dark:ring-slate-900"
          />
          <div className="flex flex-wrap gap-2 pb-1">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[color:var(--border)] bg-surface-elevated px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
              <Camera className="h-4 w-4" strokeWidth={1.75} />
              {uploading
                ? "Uploading…"
                : avatarUrl
                  ? "Change photo"
                  : "Add photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading || pending}
                onChange={(e) => void uploadPhoto(e.target.files?.[0] ?? null)}
              />
            </label>
            {avatarUrl ? (
              <button
                type="button"
                disabled={pending || uploading}
                onClick={() => void removePhoto()}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-surface-elevated px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-rose-300 hover:text-rose-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                Remove
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Optional. JPG, PNG, or WebP. Without a photo, your initials are shown.
        </p>

        <div className="mt-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile.email ?? ""}
                disabled
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-slate-400">
                Email is tied to your login and can’t be changed here.
              </p>
            </div>
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
            size="lg"
            disabled={pending || uploading || !fullName.trim()}
            onClick={() => void saveProfile()}
          >
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PasswordSettingsForm() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-[1.75rem] border border-[color:var(--border)] bg-surface-elevated p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <LockKeyhole className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Password
          </h2>
          <p className="text-sm text-slate-500">
            Keep your Promptstack Classroom account secure.
          </p>
        </div>
      </div>

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
            (
              document.getElementById("password") as HTMLInputElement | null
            )?.form?.reset();
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
            className="mt-1.5"
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
            className="mt-1.5"
          />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm text-blue-700">{message}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
