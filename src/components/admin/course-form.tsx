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
          if (result?.error) {
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
        <Label htmlFor="price">Price (USD)</Label>
        <Input
          id="price"
          name="price"
          type="number"
          required
          min="0.01"
          step="0.01"
          defaultValue={
            course?.price_cents != null
              ? (course.price_cents / 100).toFixed(2)
              : "14.99"
          }
          placeholder="14.99"
        />
        <p className="mt-1 text-xs text-slate-500">
          Courses are paid — price must be greater than $0.
        </p>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : course ? "Save changes" : "Create course"}
      </Button>
    </form>
  );
}
