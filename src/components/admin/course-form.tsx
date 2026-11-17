"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCourseAction,
  updateCourseAction,
} from "@/lib/actions/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CURRICULUM_OPTIONS } from "@/content/curriculum-options";
import type { Course } from "@/lib/types";

export function CourseForm({
  course,
  onDone,
}: {
  course?: Course;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        setError("");
        startTransition(async () => {
          const result = course
            ? await updateCourseAction(formData)
            : await createCourseAction(formData);
          if ("error" in result && result.error) {
            setError(result.error);
            return;
          }
          onDone?.();
          if (!course && "id" in result && result.id) {
            router.push(`/admin/courses/${result.id}`);
          } else {
            router.refresh();
          }
        });
      }}
    >
      {course ? <input type="hidden" name="id" value={course.id} /> : null}
      <div>
        <Label htmlFor="title">Course title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={course?.title}
          placeholder="Introduction to Web Development"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={course?.description ?? ""}
          placeholder="What students will learn…"
        />
      </div>
      <div>
        <Label htmlFor="price">Price (FCFA)</Label>
        <Input
          id="price"
          name="price"
          type="number"
          required
          min="100"
          step="1"
          defaultValue={
            course?.price_cents != null && course.price_cents > 0
              ? String(course.price_cents)
              : "9900"
          }
          placeholder="9900"
        />
        <p className="mt-1 text-xs text-slate-500">
          Charged in FCFA with MTN Mobile Money or Orange Money. Minimum 100 FCFA.
        </p>
      </div>
      <div>
        <Label htmlFor="curriculum_slug">Teaching format</Label>
        <select
          id="curriculum_slug"
          name="curriculum_slug"
          defaultValue={course?.curriculum_slug ?? ""}
          className="flex h-10 w-full rounded-lg border border-[color:var(--border)] bg-surface-elevated px-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          {CURRICULUM_OPTIONS.map((option) => (
            <option key={option.slug || "slides"} value={option.slug}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-500">
          The interactive tutor replaces the slide player for this course.
        </p>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : course ? "Save changes" : "Create course"}
      </Button>
    </form>
  );
}
