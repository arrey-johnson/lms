import { CurrencySwitcher } from "@/components/currency-switcher";
import { NavLinks, type NavItem } from "@/components/nav-links";
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
  wide = false,
}: {
  brandHref: string;
  nav: NavItem[];
  children: React.ReactNode;
  userLabel?: string;
  avatarUrl?: string | null;
  wide?: boolean;
}) {
  const mainNav = nav.filter((item) => item.href !== "/settings");

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <header className="sticky top-0 z-40 border-b border-[color:var(--border)]/60 bg-surface-elevated/70 backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/80">
        <div
          className={
            wide
              ? "mx-auto flex h-14 w-full max-w-[96rem] items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-4 md:px-6"
              : "mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:h-[4.25rem] sm:gap-4 sm:px-4 md:px-6"
          }
        >
          <div className="flex min-w-0 items-center gap-3 sm:gap-7">
            <BrandLogo href={brandHref} size="sm" className="max-w-[9.5rem] sm:max-w-none" />
            <NavLinks items={mainNav} />
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <CurrencySwitcher />
            <UserMenu userLabel={userLabel} avatarUrl={avatarUrl} />
          </div>
        </div>
      </header>
      <main
        className={
          wide
            ? "mx-auto w-full max-w-[96rem] flex-1 px-3 py-3 pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:px-4 lg:pb-4"
            : "mx-auto w-full max-w-6xl flex-1 px-3 py-5 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-8 md:px-6 lg:pb-8"
        }
      >
        {children}
      </main>
      <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <SiteFooter />
      </div>
      <MobileNav items={mainNav} />
    </div>
  );
}
