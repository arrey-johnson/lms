"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";
import { VideoPlayer } from "@/components/video-player";
import { isModuleUnlocked } from "@/lib/module-access";
import { cn, formatPercent } from "@/lib/utils";
import type { Module, Progress } from "@/lib/types";

type ModuleWithProgress = Module & {
  progress?: Progress | null;
  videoUrl?: string | null;
};

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
      (m) => unlockedIds.has(m.id) && m.video_path && !m.progress?.completed
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
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {courseThumbnailUrl ? (
          <div className="relative aspect-[21/9] overflow-hidden bg-slate-200 dark:bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={courseThumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
              <h1 className="font-[family-name:var(--font-display)] text-2xl text-white sm:text-3xl">
                {courseTitle}
              </h1>
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap items-end justify-between gap-3 p-5 sm:p-6">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-blue-700 hover:underline dark:text-blue-400"
            >
              ← Back to courses
            </Link>
            {!courseThumbnailUrl ? (
              <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-slate-900 dark:text-white">
                {courseTitle}
              </h1>
            ) : null}
            {courseDescription ? (
              <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
                {courseDescription}
              </p>
            ) : null}
          </div>
          <p className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200">
            {formatPercent(overall)} complete
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {!activeUnlocked ? (
            <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-100 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
              <Lock className="h-5 w-5" />
              Finish watching the previous module to unlock this one.
            </div>
          ) : active?.videoUrl ? (
            <VideoPlayer
              key={active.id}
              src={active.videoUrl}
              moduleId={active.id}
              initialPosition={active.progress?.last_position || 0}
              onCompleted={() => router.refresh()}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
              No video uploaded for this module yet.
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {active?.title}
            </h2>
            {active?.description ? (
              <p className="mt-1 whitespace-pre-line text-slate-600 dark:text-slate-300">
                {active.description}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Modules
          </p>
          <ul className="space-y-1">
            {modules.map((mod) => {
              const isActive = mod.id === active?.id;
              const done = Boolean(mod.progress?.completed);
              const unlocked = unlockedIds.has(mod.id);

              return (
                <li key={mod.id}>
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => {
                      if (unlocked) setActiveId(mod.id);
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition",
                      !unlocked && "cursor-not-allowed opacity-55",
                      isActive
                        ? "bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100"
                        : unlocked
                          ? "hover:bg-slate-50 dark:hover:bg-slate-800"
                          : ""
                    )}
                  >
                    <span className="mt-0.5 text-slate-400">
                      {!unlocked ? (
                        <Lock className="h-4 w-4" />
                      ) : done ? (
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      ) : isActive ? (
                        <PlayCircle className="h-4 w-4 text-blue-700" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {mod.title}
                      </span>
                      {!unlocked ? (
                        <span className="block text-xs text-slate-500">
                          Complete previous module to unlock
                        </span>
                      ) : mod.progress && mod.progress.watched_percentage > 0 ? (
                        <span className="block text-xs text-slate-500">
                          {formatPercent(mod.progress.watched_percentage)} watched
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}
