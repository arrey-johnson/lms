import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { CourseSearch } from "@/components/course-search";
import { HeroCarousel } from "@/components/hero-carousel";
import { SiteFooter } from "@/components/site-footer";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-transparent">
      <header
        id="browse"
        className="mx-auto flex w-full max-w-6xl scroll-mt-4 flex-col gap-2.5 px-3 py-3 sm:gap-3 sm:px-4 sm:py-4 md:px-6"
      >
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <BrandLogo
            href="/"
            size="lg"
            className="max-w-[10.5rem] sm:max-w-[12rem] md:max-w-none"
          />
          <div className="mx-2 hidden min-w-0 flex-1 justify-center lg:flex">
            <CourseSearch />
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-700 transition hover:bg-surface-elevated/80 sm:inline-flex sm:px-4 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-lg bg-[#0070F8] px-3 text-xs font-medium text-white transition hover:bg-blue-700 sm:h-10 sm:px-4 sm:text-sm"
            >
              Get started
            </Link>
          </div>
        </div>
        <div className="lg:hidden">
          <CourseSearch className="max-w-none" />
        </div>
      </header>

      <section className="relative mx-auto grid w-full max-w-6xl gap-6 px-3 pb-10 pt-4 sm:gap-8 sm:px-4 sm:pb-12 sm:pt-6 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:pt-8">
        <div className="min-w-0">
          <p className="mb-2.5 inline-flex max-w-full items-center gap-2 rounded-full border border-[color:var(--border)] bg-surface-elevated/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#001C4C] shadow-sm sm:mb-3 sm:text-xs dark:border-transparent dark:bg-blue-950 dark:text-blue-200">
            <GraduationCap className="h-3.5 w-3.5 shrink-0 text-[#0070F8]" />
            <span className="truncate">
              Courses by Promptstack · Learn by doing
            </span>
          </p>
          <h1 className="max-w-xl font-[family-name:var(--font-display)] text-[1.75rem] leading-[1.15] tracking-tight text-[#001C4C] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12] dark:text-white">
            Career skills that stick — taught with{" "}
            <span className="text-[#0070F8]">guided practice</span>, not
            endless videos.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-600 sm:mt-3.5 sm:text-base dark:text-slate-300">
            From technology and AI to finance, forex, digital marketing, and
            management — Promptstack Classroom trains you with real workflows,
            an interactive tutor, and mastery checkpoints you can use on the job.
          </p>
          <div className="mt-4 flex w-full flex-col gap-2.5 sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <Link
              href="/signup"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0070F8] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:bg-blue-700 sm:w-auto"
            >
              Start learning
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[color:var(--border)] bg-surface/80 px-5 text-sm font-semibold text-slate-700 transition hover:bg-surface-elevated hover:text-slate-900 sm:w-auto dark:border-transparent dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-3">
            <a
              href="mailto:hello@promptstacktechnologies.com?subject=Train%20your%20team%20%E2%80%94%20Promptstack%20Classroom"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0070F8] transition hover:underline"
            >
              <Building2 className="h-4 w-4" strokeWidth={1.75} />
              Train your team
              <span aria-hidden="true">→</span>
            </a>
          </p>
        </div>

        <div className="relative min-w-0">
          <div className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-[#0070F8]/12 via-[#001C4C]/05 to-transparent blur-2xl sm:-inset-4 dark:from-blue-900/40 dark:via-blue-950/20" />
          <div className="relative overflow-hidden rounded-2xl border border-[color:var(--border)]/80 bg-surface-elevated/85 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_40px_rgba(15,23,42,0.06)] backdrop-blur sm:p-4 dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-2xl">
            <HeroCarousel />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-3 pb-14 sm:px-4 sm:pb-16 md:px-6">
        <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
          {[
            { icon: GraduationCap, label: "Tech · Finance · Marketing" },
            { icon: ShieldCheck, label: "Guided practice" },
            { icon: Building2, label: "For teams" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-surface/90 px-3 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-950/60"
            >
              <Icon className="h-4 w-4 shrink-0 text-[#0070F8]" />
              {label}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-auto">
        <SiteFooter />
      </div>
    </div>
  );
}
