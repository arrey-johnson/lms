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
        className="mx-auto flex w-full max-w-6xl scroll-mt-4 flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-4 sm:py-6 md:px-6"
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

      <section className="relative mx-auto grid w-full max-w-6xl gap-8 px-3 pb-16 pt-6 sm:gap-10 sm:px-4 sm:pb-20 sm:pt-10 md:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-16">
        <div className="min-w-0">
          <p className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-[color:var(--border)] bg-surface-elevated/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#001C4C] shadow-sm sm:mb-4 sm:text-xs dark:border-transparent dark:bg-blue-950 dark:text-blue-200">
            <GraduationCap className="h-3.5 w-3.5 shrink-0 text-[#0070F8]" />
            <span className="truncate">Courses by Promptstack · Paid</span>
          </p>
          <h1 className="max-w-xl font-[family-name:var(--font-display)] text-[2rem] leading-[1.12] tracking-tight text-[#001C4C] sm:text-5xl lg:text-6xl dark:text-white">
            Build career-ready skills with courses{" "}
            <span className="text-[#0070F8]">made by us</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600 sm:mt-5 sm:text-lg dark:text-slate-300">
            Browse Promptstack Classroom for practical AI, productivity, and
            professional courses you can buy. Companies can train teams in one
            purchase.
          </p>
          <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href="#browse"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0070F8] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:bg-blue-700 sm:w-auto"
            >
              Browse courses
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-[color:var(--border)] bg-surface/80 px-5 text-sm font-semibold text-slate-700 transition hover:bg-surface-elevated hover:text-slate-900 sm:w-auto dark:border-transparent dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4">
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
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#0070F8]/12 via-[#001C4C]/05 to-transparent blur-2xl sm:-inset-6 dark:from-blue-900/40 dark:via-blue-950/20" />
          <div className="relative overflow-hidden rounded-2xl border border-[color:var(--border)]/80 bg-surface-elevated/85 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_40px_rgba(15,23,42,0.06)] backdrop-blur sm:rounded-[1.75rem] sm:p-6 dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-2xl">
            <HeroCarousel />
            <div className="mt-4 grid gap-2.5 sm:mt-5 sm:grid-cols-3 sm:gap-3">
              {[
                { icon: GraduationCap, label: "Paid courses" },
                { icon: ShieldCheck, label: "Built by Promptstack" },
                { icon: Building2, label: "For teams" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-surface/90 px-3 py-3 text-sm shadow-sm sm:block dark:border-slate-700 dark:bg-slate-950/60"
                >
                  <Icon className="h-4 w-4 shrink-0 text-[#0070F8] sm:mb-2" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="mt-auto">
        <SiteFooter />
      </div>
    </div>
  );
}
