"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";

export function BrowseFilters({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="relative w-full max-w-md"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const q = String(form.get("q") || "").trim();
        startTransition(() => {
          router.push(q ? `/browse?q=${encodeURIComponent(q)}` : "/browse");
        });
      }}
    >
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        strokeWidth={1.75}
      />
      <input
        name="q"
        type="search"
        defaultValue={initialQuery}
        placeholder="Search courses to buy…"
        aria-label="Search courses to buy"
        className="h-11 w-full rounded-full border border-[color:var(--border)] bg-surface-elevated pl-10 pr-24 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0070F8] focus:ring-2 focus:ring-[#0070F8]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      <button
        type="submit"
        disabled={pending}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-[#0070F8] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "…" : "Search"}
      </button>
    </form>
  );
}
