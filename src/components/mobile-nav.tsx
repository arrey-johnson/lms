"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MobileNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur sm:hidden dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl justify-around gap-1">
        {items.map((item) => {
          const active =
            item.href === "/admin" || item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                "flex-1 rounded-lg px-2 py-2 text-center text-xs font-medium",
                active
                  ? "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                  : "text-slate-500"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
