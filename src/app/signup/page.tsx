import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { SignupForm } from "@/components/signup-form";
import { SiteFooter } from "@/components/site-footer";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
        <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)]/80 bg-surface-elevated/90 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-xl">
          <BrandLogo href="/" size="lg" />
          <h1 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Join Promptstack Classroom and start building in-demand skills with
            AI-powered learning.
          </p>
          <div className="mt-6">
            <SignupForm />
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
