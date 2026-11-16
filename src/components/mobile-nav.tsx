"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  LayoutGrid,
  Library,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/components/nav-links";

const iconsByHref: Record<string, LucideIcon> = {
  "/dashboard": GraduationCap,
  "/browse": ShoppingBag,
  "/admin": LayoutGrid,
  "/admin/courses": Library,
  "/admin/students": Users,
};

export function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const filtered = items.filter((item) => item.href !== "/settings");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--border)]/60 bg-surface-elevated/90 px-2 pt-2 backdrop-blur-2xl lg:hidden dark:border-slate-800 dark:bg-slate-950/90"
      style={{ paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-6xl justify-around gap-1">
        {filtered.map((item) => {
          const active =
            item.href === "/admin" || item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const Icon = iconsByHref[item.href] ?? BookOpen;
          const label = item.shortLabel || item.label;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1.5 py-2 text-[10px] font-medium transition sm:text-[11px]",
                active
                  ? "bg-[#e8f1fc] text-[#001C4C] dark:bg-blue-950 dark:text-blue-200"
                  : "text-slate-500 active:bg-[#e8f1fc]/80 active:text-[#001C4C] dark:active:bg-blue-950/70 dark:active:text-blue-200"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              <span className="max-w-full truncate px-0.5 text-center leading-tight">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
