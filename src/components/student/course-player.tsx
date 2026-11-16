"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle, Lock, Layers } from "lucide-react";
import { SlidePlayer } from "@/components/student/slide-player";
import { isModuleUnlocked } from "@/lib/module-access";
import { cn, formatPercent } from "@/lib/utils";
import type { Module, Progress, Slide } from "@/lib/types";

type ModuleWithProgress = Module & {
  progress?: Progress | null;
  slides: (Slide & { imageUrl?: string | null })[];
  slide_count: number;
};

function ModuleButton({
  mod,
  isActive,
  done,
  unlocked,
  onSelect,
  compact = false,
}: {
  mod: ModuleWithProgress;
  isActive: boolean;
  done: boolean;
  unlocked: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={!unlocked}
      onClick={() => {
        if (unlocked) onSelect();
      }}
      className={cn(
        "flex items-start gap-3 rounded-xl text-left transition",
        compact
          ? "min-w-[11.5rem] shrink-0 px-3 py-2.5"
          : "w-full px-3 py-3",
        !unlocked && "cursor-not-allowed opacity-55",
        isActive
          ? "bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100"
          : unlocked
            ? "hover:bg-surface dark:hover:bg-slate-800"
            : ""
      )}
    >
      <span className="mt-0.5 shrink-0 text-slate-400">
        {!unlocked ? (
          <Lock className="h-4 w-4" />
        ) : done ? (
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
        ) : isActive ? (
          <Layers className="h-4 w-4 text-blue-700" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{mod.title}</span>
        {!unlocked ? (
          <span className="block text-xs text-slate-500">
            Complete previous to unlock
          </span>
        ) : mod.slide_count > 0 ? (
          <span className="block text-xs text-slate-500">
            {mod.slide_count} slide{mod.slide_count === 1 ? "" : "s"}
            {mod.progress && mod.progress.watched_percentage > 0
              ? ` · ${formatPercent(mod.progress.watched_percentage)}`
              : ""}
          </span>
        ) : (
          <span className="block text-xs text-amber-600">No slides yet</span>
        )}
      </span>
    </button>
  );
}

export function CoursePlayer({
  courseTitle,
  courseDescription,
  courseThumbnailUrl,
  modules,
  bypassLocks = false,
}: {
  courseTitle: string;
  courseDescription: string | null;
  courseThumbnailUrl?: string | null;
  modules: ModuleWithProgress[];
  bypassLocks?: boolean;
}) {
  const router = useRouter();
  const progressByModule = useMemo(() => {
    const map = new Map<string, Progress | null | undefined>();
    for (const mod of modules) map.set(mod.id, mod.progress);
    return map;
  }, [modules]);

  const unlockedIds = useMemo(() => {
    return new Set(
      modules
        .filter((m) =>
          isModuleUnlocked(modules, m.id, progressByModule, bypassLocks)
        )
        .map((m) => m.id)
    );
  }, [modules, progressByModule, bypassLocks]);

  const firstPlayable =
    modules.find(
      (m) =>
        unlockedIds.has(m.id) && m.slide_count > 0 && !m.progress?.completed
    ) ||
    modules.find((m) => unlockedIds.has(m.id)) ||
    modules[0];

  const [activeId, setActiveId] = useState(firstPlayable?.id);

  const active = useMemo(
    () => modules.find((m) => m.id === activeId) || modules[0],
    [modules, activeId]
  );

  const activeUnlocked = active ? unlockedIds.has(active.id) : false;

  const completedCount = modules.filter((m) => m.progress?.completed).length;
  const overall =
    modules.length === 0 ? 0 : (completedCount / modules.length) * 100;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface-elevated shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-start sm:p-5">
          {courseThumbnailUrl ? (
            <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl bg-slate-200 sm:aspect-auto sm:h-24 sm:w-40 dark:bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={courseThumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <Link
              href="/dashboard"
              className="text-sm text-blue-700 hover:underline dark:text-blue-400"
            >
              ← Back to courses
            </Link>
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="break-words font-[family-name:var(--font-display)] text-xl text-slate-900 sm:text-2xl md:text-3xl dark:text-white">
                  {courseTitle}
                </h1>
                {courseDescription ? (
                  <p className="mt-1 max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-300">
                    {courseDescription}
                  </p>
                ) : null}
              </div>
              <p className="w-fit shrink-0 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                {formatPercent(overall)} complete
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / tablet module scroller */}
      <div className="lg:hidden">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Modules
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="rounded-xl border border-[color:var(--border)] bg-surface-elevated dark:border-slate-800 dark:bg-slate-900"
            >
              <ModuleButton
                mod={mod}
                compact
                isActive={mod.id === active?.id}
                done={Boolean(mod.progress?.completed)}
                unlocked={unlockedIds.has(mod.id)}
                onSelect={() => setActiveId(mod.id)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {!activeUnlocked ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-100 px-6 text-center text-sm text-slate-500 sm:min-h-[280px] dark:border-slate-700 dark:bg-slate-900">
              <Lock className="h-5 w-5" />
              Finish the previous module to unlock this one.
            </div>
          ) : (
            <SlidePlayer
              key={active?.id}
              moduleId={active?.id || ""}
              slides={active?.slides ?? []}
              initialIndex={Math.floor(active?.progress?.last_position || 0)}
              onCompleted={() => router.refresh()}
            />
          )}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl dark:text-white">
              {active?.title}
            </h2>
            {active?.description ? (
              <p className="mt-1 whitespace-pre-line text-sm text-slate-600 sm:text-base dark:text-slate-300">
                {active.description}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="hidden rounded-2xl border border-[color:var(--border)] bg-surface-elevated p-3 shadow-sm lg:block dark:border-slate-800 dark:bg-slate-900">
          <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Modules
          </p>
          <ul className="space-y-1">
            {modules.map((mod) => (
              <li key={mod.id}>
                <ModuleButton
                  mod={mod}
                  isActive={mod.id === active?.id}
                  done={Boolean(mod.progress?.completed)}
                  unlocked={unlockedIds.has(mod.id)}
                  onSelect={() => setActiveId(mod.id)}
                />
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
