import Link from "next/link";
import { BookOpen, Users, Layers } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ count: courseCount }, { count: studentCount }, { count: moduleCount }] =
    await Promise.all([
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student"),
      supabase.from("modules").select("*", { count: "exact", head: true }),
    ]);

  const cards = [
    {
      href: "/admin/courses",
      label: "Courses",
      value: courseCount ?? 0,
      icon: BookOpen,
    },
    {
      href: "/admin/courses",
      label: "Modules",
      value: moduleCount ?? 0,
      icon: Layers,
    },
    {
      href: "/admin/students",
      label: "Students",
      value: studentCount ?? 0,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-slate-900 dark:text-white">
          Instructor dashboard
        </h1>
        <p className="mt-1 text-slate-500">
          Manage courses, upload lessons, and create student accounts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ href, label, value, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
          >
            <Icon className="h-5 w-5 text-blue-700 dark:text-blue-400" />
            <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
              {value}
            </p>
            <p className="text-sm text-slate-500">{label}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/courses"
          className="inline-flex h-11 items-center rounded-lg bg-blue-700 px-4 text-sm font-medium text-white hover:bg-blue-800"
        >
          Manage courses
        </Link>
        <Link
          href="/admin/students"
          className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-800 hover:bg-white dark:border-slate-600 dark:text-slate-100"
        >
          Manage students
        </Link>
      </div>
    </div>
  );
}
