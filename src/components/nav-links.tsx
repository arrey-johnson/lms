"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  LayoutGrid,
  Library,
  Receipt,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconsByHref: Record<string, LucideIcon> = {
  "/dashboard": GraduationCap,
  "/browse": ShoppingBag,
  "/admin": LayoutGrid,
  "/admin/courses": Library,
  "/admin/students": Users,
  "/admin/payments": Receipt,
};

export type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
};

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const filtered = items.filter((item) => item.href !== "/settings");

  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {filtered.map((item) => {
        const active =
          item.href === "/admin" || item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        const Icon = iconsByHref[item.href] ?? BookOpen;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all",
              active
                ? "bg-[#e8f1fc] text-[#001C4C] dark:bg-blue-950 dark:text-blue-200"
                : "text-slate-500 hover:bg-[#e8f1fc]/80 hover:text-[#001C4C] dark:text-slate-300 dark:hover:bg-blue-950/70 dark:hover:text-blue-200"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
