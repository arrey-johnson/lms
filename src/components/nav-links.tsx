"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  LayoutGrid,
  Library,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconsByHref: Record<string, LucideIcon> = {
  "/dashboard": GraduationCap,
  "/admin": LayoutGrid,
  "/admin/courses": Library,
  "/admin/students": Users,
};

export function NavLinks({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const filtered = items.filter((item) => item.href !== "/settings");

  return (
    <nav className="hidden items-center gap-1 sm:flex">
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
                ? "bg-blue-50 text-blue-800 shadow-sm shadow-blue-900/5 dark:bg-blue-950 dark:text-blue-300"
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
