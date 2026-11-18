import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { VerifyEmailForm } from "@/components/verify-email-form";
import { safeNextPath } from "@/lib/next-path";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; mailError?: string; next?: string }>;
}) {
  const params = await searchParams;
  const email = (params.email || "").trim().toLowerCase();
  const mailError = (params.mailError || "").trim();
  const next = safeNextPath(params.next);

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <div className="flex flex-1 items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
        <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)]/80 bg-surface-elevated/90 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-xl">
          <BrandLogo href="/" size="lg" />
          <h1 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
            Confirm your email
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter the 6-digit code from Promptstack Classroom
            (support@promptstackclassroom.com).
          </p>
          {mailError ? (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              We couldn&apos;t send the email yet: {mailError}. Use Resend after
              the mail setup is fixed.
            </p>
          ) : null}
          <div className="mt-6">
            {email ? (
              <VerifyEmailForm email={email} next={next} />
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
