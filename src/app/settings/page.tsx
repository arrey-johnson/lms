import { requireStudent } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import {
  PasswordSettingsForm,
  ProfileSettingsPanel,
} from "@/components/settings-forms";

export default async function SettingsPage() {
  const { profile } = await requireStudent();
  const isAdmin = profile.role === "admin";

  return (
    <AppShell
      brandHref={isAdmin ? "/admin" : "/dashboard"}
      userLabel={profile.full_name || profile.email || "Account"}
      avatarUrl={profile.avatar_url}
      nav={
        isAdmin
          ? [
              { href: "/admin", label: "Overview" },
              { href: "/admin/courses", label: "Courses" },
              { href: "/admin/students", label: "Students" },
            ]
          : [{ href: "/dashboard", label: "My courses" }]
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-slate-900 dark:text-white">
            Profile & settings
          </h1>
          <p className="mt-1 text-slate-500">
            Personalize your LearnSpace identity and keep your account secure.
          </p>
        </div>

        <ProfileSettingsPanel profile={profile} />
        <PasswordSettingsForm />
      </div>
    </AppShell>
  );
}
