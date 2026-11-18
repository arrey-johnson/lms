import { BrandLogo } from "@/components/brand-logo";
import { SignupForm } from "@/components/signup-form";
import { SiteFooter } from "@/components/site-footer";
import { safeNextPath } from "@/lib/next-path";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);
  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <div className="flex flex-1 items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
        <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)]/80 bg-surface-elevated/90 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-xl">
          <BrandLogo href="/" size="lg" />
          <h1 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {next.startsWith("/checkout/")
              ? "Create your account, confirm your email, then you’ll continue to checkout for this course."
              : "Join for technology, finance, forex, digital marketing, management, and more — taught with guided practice you can use on the job."}
          </p>
          <div className="mt-6">
            <SignupForm next={next} />
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
