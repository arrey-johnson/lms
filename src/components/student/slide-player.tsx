"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { saveSlideProgressAction } from "@/lib/actions/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Slide } from "@/lib/types";

export function SlidePlayer({
  moduleId,
  slides,
  initialIndex = 0,
  onCompleted,
}: {
  moduleId: string;
  slides: (Slide & { imageUrl?: string | null })[];
  initialIndex?: number;
  onCompleted?: () => void;
}) {
  const [index, setIndex] = useState(
    Math.min(Math.max(0, initialIndex), Math.max(0, slides.length - 1))
  );
  const [pending, startTransition] = useTransition();
  const [justCompleted, setJustCompleted] = useState(false);

  const slide = slides[index];
  const total = slides.length;
  const isLast = index >= total - 1;

  useEffect(() => {
    setIndex(Math.min(Math.max(0, initialIndex), Math.max(0, slides.length - 1)));
    setJustCompleted(false);
  }, [moduleId, initialIndex, slides.length]);

  function persist(nextIndex: number, completed?: boolean) {
    startTransition(async () => {
      const result = await saveSlideProgressAction({
        moduleId,
        slideIndex: nextIndex,
        slideCount: total,
        completed,
      });
      if (result?.completed) {
        setJustCompleted(true);
        onCompleted?.();
      }
    });
  }

  useEffect(() => {
    if (!slide || total === 0) return;
    persist(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  function goTo(next: number) {
    const clamped = Math.max(0, Math.min(total - 1, next));
    setIndex(clamped);
    persist(clamped, clamped >= total - 1);
  }

  if (total === 0 || !slide) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-100 px-6 text-center text-sm text-slate-500 sm:min-h-[280px] dark:border-slate-700 dark:bg-slate-900">
        No slides in this module yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface-elevated shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 sm:px-4 dark:border-slate-800">
        <p className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Slide {index + 1} of {total}
        </p>
        <div className="flex max-w-[55%] gap-1 overflow-x-auto [scrollbar-width:none] sm:max-w-none">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 w-3 shrink-0 rounded-full transition sm:w-4",
                i === index
                  ? "bg-[#0070F8]"
                  : i < index
                    ? "bg-blue-300 dark:bg-blue-800"
                    : "bg-slate-200 dark:bg-slate-700"
              )}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr] lg:grid-cols-[1.1fr_0.9fr]">
        {slide.imageUrl ? (
          <div className="bg-slate-100 dark:bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.imageUrl}
              alt=""
              className="mx-auto h-full max-h-[240px] w-full object-contain sm:max-h-[320px] md:max-h-[420px]"
            />
          </div>
        ) : (
          <div className="flex min-h-[160px] items-center justify-center bg-gradient-to-br from-[#c5d8f5]/35 to-[#dce5f0] px-6 sm:min-h-[220px] dark:from-slate-950 dark:to-slate-900">
            <p className="text-center text-sm text-slate-400">
              {slide.title || "Lesson slide"}
            </p>
          </div>
        )}

        <div className="flex flex-col justify-between p-4 sm:p-5 md:p-6">
          <div>
            {slide.title ? (
              <h3 className="font-[family-name:var(--font-display)] text-xl text-[#001C4C] sm:text-2xl dark:text-white">
                {slide.title}
              </h3>
            ) : null}
            <p
              className={cn(
                "whitespace-pre-line text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300",
                slide.title ? "mt-3" : ""
              )}
            >
              {slide.body || "—"}
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={index === 0 || pending}
              onClick={() => goTo(index - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {isLast ? (
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={pending}
                onClick={() => {
                  persist(index, true);
                  setJustCompleted(true);
                  onCompleted?.();
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                {justCompleted ? "Completed" : "Mark complete"}
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={pending}
                onClick={() => goTo(index + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
