import { requireStudent } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import {
  PasswordSettingsForm,
  ProfileSettingsForm,
} from "@/components/settings-forms";

export default async function SettingsPage() {
  const { profile } = await requireStudent();
  const isAdmin = profile.role === "admin";

  return (
    <AppShell
      brandHref={isAdmin ? "/admin" : "/dashboard"}
      userLabel={profile.full_name || profile.email || "Account"}
      nav={
        isAdmin
          ? [
              { href: "/admin", label: "Overview" },
              { href: "/admin/courses", label: "Courses" },
              { href: "/admin/students", label: "Students" },
              { href: "/settings", label: "Settings" },
            ]
          : [
              { href: "/dashboard", label: "My courses" },
              { href: "/settings", label: "Settings" },
            ]
      }
    >
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-slate-900 dark:text-white">
            Account settings
          </h1>
          <p className="mt-1 text-slate-500">
            Manage your profile and password.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Profile
          </h2>
          <div className="mt-4">
            <ProfileSettingsForm profile={profile} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Password
          </h2>
          <div className="mt-4">
            <PasswordSettingsForm />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
