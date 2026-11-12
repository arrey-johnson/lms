"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createModuleAction,
  updateModuleAction,
} from "@/lib/actions/modules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Module } from "@/lib/types";

export function ModuleForm({
  courseId,
  module,
  onDone,
}: {
  courseId: string;
  module?: Module;
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
          const result = module
            ? await updateModuleAction(formData)
            : await createModuleAction(formData);
          if (result?.error) {
            setError(result.error);
            return;
          }
          onDone?.();
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="course_id" value={courseId} />
      {module ? <input type="hidden" name="id" value={module.id} /> : null}
      <div>
        <Label htmlFor="module-title">Module title</Label>
        <Input
          id="module-title"
          name="title"
          required
          defaultValue={module?.title}
          placeholder="Lesson 1 — Getting started"
        />
      </div>
      <div>
        <Label htmlFor="module-description">Description</Label>
        <Textarea
          id="module-description"
          name="description"
          defaultValue={module?.description ?? ""}
          placeholder="Optional notes for students"
        />
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : module ? "Save module" : "Add module"}
      </Button>
    </form>
  );
}
