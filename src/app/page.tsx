import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { CourseSearch } from "@/components/course-search";
import { HeroCarousel } from "@/components/hero-carousel";
import { SiteFooter } from "@/components/site-footer";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_18%_15%,#dbeafe_0%,transparent_40%),radial-gradient(circle_at_85%_0%,#eff6ff_0%,transparent_35%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_18%_15%,#1e3a8a_0%,transparent_40%),radial-gradient(circle_at_85%_0%,#172554_0%,transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <header
        id="browse"
        className="mx-auto flex w-full max-w-6xl scroll-mt-4 flex-col gap-4 px-4 py-5 sm:py-6"
      >
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <BrandLogo href="/" size="lg" />
          <div className="mx-2 hidden min-w-0 flex-1 justify-center md:flex">
            <CourseSearch />
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-700 transition hover:bg-white/70 sm:px-4 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center rounded-lg bg-[#0070F8] px-3 text-sm font-medium text-white transition hover:bg-blue-700 sm:px-4"
            >
              Get started
            </Link>
          </div>
        </div>
        <div className="md:hidden">
          <CourseSearch />
        </div>
      </header>

      <section className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-20 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-16">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#001C4C] dark:bg-blue-950 dark:text-blue-200">
            <GraduationCap className="h-3.5 w-3.5 text-[#0070F8]" />
            Courses by Promptstack · Free &amp; paid
          </p>
          <h1 className="max-w-xl font-[family-name:var(--font-display)] text-4xl leading-[1.1] tracking-tight text-[#001C4C] sm:text-5xl lg:text-6xl dark:text-white">
            Build career-ready skills with courses{" "}
            <span className="text-[#0070F8]">made by us</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            Browse Promptstack Classroom for practical AI, productivity, and
            professional courses — take free ones or buy the ones that move you
            forward. Companies can train teams in one purchase.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#browse"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#0070F8] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:bg-blue-700"
            >
              Browse courses
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-xl px-5 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
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

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-blue-200/40 via-blue-50/50 to-transparent blur-2xl dark:from-blue-900/40 dark:via-blue-950/20" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white/90 p-6 shadow-2xl shadow-blue-900/5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
            <HeroCarousel />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { icon: GraduationCap, label: "Free & paid courses" },
                { icon: ShieldCheck, label: "Built by Promptstack" },
                { icon: Building2, label: "For teams" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-xl border border-blue-100 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-950/60"
                >
                  <Icon className="mb-2 h-4 w-4 text-[#0070F8]" />
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
