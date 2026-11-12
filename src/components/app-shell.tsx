import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { NavLinks } from "@/components/nav-links";
import { MobileNav } from "@/components/mobile-nav";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";

export function AppShell({
  brandHref,
  nav,
  children,
  userLabel,
}: {
  brandHref: string;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
  userLabel?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
      <header className="sticky top-0 z-40 border-b border-blue-100/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-8">
            <BrandLogo href={brandHref} size="sm" />
            <NavLinks items={nav} />
          </div>
          <div className="flex items-center gap-2">
            {userLabel ? (
              <span className="hidden text-sm text-slate-500 sm:inline dark:text-slate-400">
                {userLabel}
              </span>
            ) : null}
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-24 sm:pb-8">
        {children}
      </main>
      <div className="pb-16 sm:pb-0">
        <SiteFooter />
      </div>
      <MobileNav items={nav} />
    </div>
  );
}
