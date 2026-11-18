"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  searchCoursesAction,
  type CourseSearchResult,
} from "@/lib/actions/search";
import { PriceLabel } from "@/components/price-label";
import { cn } from "@/lib/utils";

export function CourseSearch({ className }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CourseSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setError("");
      return;
    }

    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const { results: next, error: searchError } =
          await searchCoursesAction(q);
        setResults(next);
        setError(searchError || "");
        setOpen(true);
      });
    }, 220);

    return () => window.clearTimeout(timer);
  }, [query]);

  function goToCourse(courseId: string) {
    setOpen(false);
    router.push(`/courses#${courseId}`);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (results[0]) {
      goToCourse(results[0].id);
      return;
    }
    router.push(`/courses?q=${encodeURIComponent(q)}`);
  }

  return (
    <div ref={rootRef} className={cn("relative w-full max-w-md", className)}>
      <form onSubmit={onSubmit} className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          strokeWidth={1.75}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          placeholder="Search courses…"
          aria-label="Search courses"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open && (results.length > 0 || !!error)}
          className="h-11 w-full rounded-full border border-[color:var(--border)] bg-surface-elevated/90 pl-10 pr-10 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0070F8] focus:ring-2 focus:ring-[#0070F8]/20 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-surface hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        ) : null}
      </form>

      {open && query.trim().length >= 2 ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface-elevated shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
        >
          {pending && results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">Searching…</p>
          ) : null}
          {error ? (
            <p className="px-4 py-3 text-sm text-rose-600">{error}</p>
          ) : null}
          {!pending && !error && results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">
              No courses match “{query.trim()}”.
            </p>
          ) : null}
          <ul className="max-h-72 overflow-auto py-1">
            {results.map((course) => (
              <li key={course.id} role="option">
                <button
                  type="button"
                  onClick={() => goToCourse(course.id)}
                  className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-blue-50 dark:hover:bg-slate-800"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {course.title}
                    </span>
                    <PriceLabel
                      className="shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-200"
                      priceCents={
                        course.price_cents > 0 ? course.price_cents : 9900
                      }
                    />
                  </span>
                  {course.description ? (
                    <span className="line-clamp-1 text-xs text-slate-500">
                      {course.description}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 px-4 py-2 dark:border-slate-800">
            <Link
              href="/courses"
              className="text-xs font-medium text-[#0070F8] hover:underline"
              onClick={() => setOpen(false)}
            >
              See all courses
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
