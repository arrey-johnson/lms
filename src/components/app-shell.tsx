import { ThemeToggle } from "@/components/theme-toggle";
import { NavLinks } from "@/components/nav-links";
import { MobileNav } from "@/components/mobile-nav";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { UserMenu } from "@/components/user-menu";

export function AppShell({
  brandHref,
  nav,
  children,
  userLabel,
  avatarUrl,
}: {
  brandHref: string;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
  userLabel?: string;
  avatarUrl?: string | null;
}) {
  const mainNav = nav.filter((item) => item.href !== "/settings");

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
      <header className="sticky top-0 z-40 border-b border-blue-100/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-7">
            <BrandLogo href={brandHref} size="sm" />
            <NavLinks items={mainNav} />
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <UserMenu userLabel={userLabel} avatarUrl={avatarUrl} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-24 sm:pb-8">
        {children}
      </main>
      <div className="pb-16 sm:pb-0">
        <SiteFooter />
      </div>
      <MobileNav items={mainNav} />
    </div>
  );
}
