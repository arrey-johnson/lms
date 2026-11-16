import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { VerifyEmailForm } from "@/components/verify-email-form";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = (params.email || "").trim().toLowerCase();

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_#dbeafe_0%,transparent_45%),linear-gradient(180deg,#ffffff,#f8fafc)] dark:bg-[radial-gradient(ellipse_at_top,_#1e3a8a_0%,transparent_40%),linear-gradient(180deg,#020617,#020617)]">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-8 shadow-xl shadow-blue-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <BrandLogo href="/" size="lg" />
          <h1 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
            Confirm your email
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter the 6-digit code from Promptstack Technologies
            (hello@promptstacktechnologies.com).
          </p>
          <div className="mt-6">
            {email ? (
              <VerifyEmailForm email={email} />
            ) : (
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <p>
                  Open this page from the signup flow, or sign in and we&apos;ll
                  guide you if your email still needs confirmation.
                </p>
                <Link
                  href="/login"
                  className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                >
                  Go to sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
