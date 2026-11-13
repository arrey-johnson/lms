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

export function MobileNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const filtered = items.filter((item) => item.href !== "/settings");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/90 px-3 py-2.5 backdrop-blur-xl sm:hidden dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl justify-around gap-1">
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
                "flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition",
                active
                  ? "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                  : "text-slate-500"
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
