import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { SignupForm } from "@/components/signup-form";
import { SiteFooter } from "@/components/site-footer";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_#dbeafe_0%,transparent_45%),linear-gradient(180deg,#ffffff,#f8fafc)] dark:bg-[radial-gradient(ellipse_at_top,_#1e3a8a_0%,transparent_40%),linear-gradient(180deg,#020617,#020617)]">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-8 shadow-xl shadow-blue-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
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
