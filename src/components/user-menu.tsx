"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Settings2 } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";

export function UserMenu({
  userLabel,
  avatarUrl,
  settingsHref = "/settings",
}: {
  userLabel?: string;
  avatarUrl?: string | null;
  settingsHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className={cn(
          "rounded-full transition hover:scale-[1.03]",
          open && "ring-2 ring-blue-300 ring-offset-2 dark:ring-blue-500 dark:ring-offset-slate-950"
        )}
      >
        <Avatar avatarUrl={avatarUrl} name={userLabel} size="md" />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.55rem)] z-50 w-64 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-xl shadow-slate-900/10 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <Avatar avatarUrl={avatarUrl} name={userLabel} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                Account
              </p>
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {userLabel || "Learner"}
              </p>
            </div>
          </div>
          <div className="p-1.5">
            <Link
              href={settingsHref}
              prefetch
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-blue-50 hover:text-blue-800 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-300"
            >
              <Settings2 className="h-4 w-4" strokeWidth={1.75} />
              Profile & settings
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-rose-50 hover:text-rose-700 dark:text-slate-200 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.75} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
