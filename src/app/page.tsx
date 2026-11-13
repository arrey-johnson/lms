import Link from "next/link";
import { ArrowRight, Brain, Sparkles, Target } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { HeroCarousel } from "@/components/hero-carousel";
import { SiteFooter } from "@/components/site-footer";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_18%_15%,#dbeafe_0%,transparent_40%),radial-gradient(circle_at_85%_0%,#eff6ff_0%,transparent_35%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_18%_15%,#1e3a8a_0%,transparent_40%),radial-gradient(circle_at_85%_0%,#172554_0%,transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-6">
        <BrandLogo href="/" size="lg" />
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-slate-700 transition hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center rounded-lg bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-20 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-16">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800 dark:bg-blue-950 dark:text-blue-200">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered learning
          </p>
          <h1>
            <BrandLogo size="hero" />
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            The unique AI-powered learning platform where people acquire
            practical skills across many areas — from prompting and
            productivity to design, data, communication, and more.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:bg-blue-800"
            >
              Start learning free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-xl border border-blue-200 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-blue-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-blue-200/40 via-blue-50/50 to-transparent blur-2xl dark:from-blue-900/40 dark:via-blue-950/20" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white/90 p-6 shadow-2xl shadow-blue-900/5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
            <HeroCarousel />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Brain, label: "AI skills" },
                { icon: Target, label: "Career paths" },
                { icon: Sparkles, label: "Practical mastery" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-xl border border-blue-100 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-950/60"
                >
                  <Icon className="mb-2 h-4 w-4 text-blue-700 dark:text-blue-400" />
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
