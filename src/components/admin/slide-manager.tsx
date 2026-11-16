"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImagePlus, Trash2 } from "lucide-react";
import {
  attachSlideImageAction,
  createSlideAction,
  deleteSlideAction,
  reorderSlidesAction,
  updateSlideAction,
} from "@/lib/actions/slides";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBytes } from "@/lib/utils";
import type { Slide } from "@/lib/types";

export function SlideManager({
  courseId,
  moduleId,
  slides,
}: {
  courseId: string;
  moduleId: string;
  slides: Slide[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(slides);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    setItems(slides);
  }, [slides]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const ids = useMemo(() => items.map((s) => s.id), [items]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((s) => s.id === active.id);
    const newIndex = items.findIndex((s) => s.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    startTransition(async () => {
      await reorderSlidesAction(
        moduleId,
        courseId,
        next.map((s) => s.id)
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/50">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Slides ({items.length})
        </p>
        <p className="text-xs text-slate-500">Drag to reorder</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((slide, index) => (
              <SortableSlideRow
                key={slide.id}
                slide={slide}
                index={index}
                courseId={courseId}
                disabled={pending}
                onSaved={() => router.refresh()}
                onDeleted={() => {
                  startTransition(async () => {
                    await deleteSlideAction(slide.id, courseId);
                    router.refresh();
                  });
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">
          No slides yet. Add the first slide below.
        </p>
      ) : null}

      <form
        className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          const formData = new FormData();
          formData.set("module_id", moduleId);
          formData.set("course_id", courseId);
          formData.set("title", title);
          formData.set("body", body);
          startTransition(async () => {
            const result = await createSlideAction(formData);
            if (result?.error) {
              setError(result.error);
              return;
            }
            setTitle("");
            setBody("");
            router.refresh();
          });
        }}
      >
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
          Add slide
        </p>
        <div>
          <Label htmlFor={`slide-title-${moduleId}`}>Title (optional)</Label>
          <Input
            id={`slide-title-${moduleId}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Slide title"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor={`slide-body-${moduleId}`}>Body</Label>
          <textarea
            id={`slide-body-${moduleId}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Teach one clear idea per slide…"
            className="mt-1.5 w-full rounded-lg border border-[color:var(--border)] bg-surface-elevated px-3 py-2 text-sm outline-none focus:border-[#0070F8] focus:ring-2 focus:ring-[#0070F8]/20 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Add slide"}
        </Button>
      </form>
    </div>
  );
}

function SortableSlideRow({
  slide,
  index,
  courseId,
  disabled,
  onSaved,
  onDeleted,
}: {
  slide: Slide;
  index: number;
  courseId: string;
  disabled: boolean;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: slide.id });
  const [title, setTitle] = useState(slide.title ?? "");
  const [body, setBody] = useState(slide.body ?? "");
  const [pending, startTransition] = useTransition();
  const [uploadMsg, setUploadMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(slide.title ?? "");
    setBody(slide.body ?? "");
  }, [slide.title, slide.body]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function uploadImage(file: File | null) {
    if (!file) return;
    setError("");
    setUploadMsg(`Uploading… (${formatBytes(file.size)})`);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${courseId}/${slide.module_id}/slides/${slide.id}-${Date.now()}.${ext}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("course-videos")
        .upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });
      if (uploadError) {
        setError(uploadError.message);
        setUploadMsg("");
        return;
      }
      const result = await attachSlideImageAction({
        courseId,
        slideId: slide.id,
        path,
      });
      if (result?.error) {
        setError(result.error);
        setUploadMsg("");
        return;
      }
      setUploadMsg("Image attached.");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setUploadMsg("");
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-[color:var(--border)] bg-surface-elevated p-3 dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab text-slate-400 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag slide"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Slide {index + 1}
        </span>
        <div className="ml-auto flex gap-1">
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-[#0070F8] dark:border-slate-700 dark:text-slate-300">
            <ImagePlus className="h-3.5 w-3.5" />
            Image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={disabled || pending}
              onChange={(e) => void uploadImage(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={disabled || pending}
            onClick={onDeleted}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Slide title"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-[color:var(--border)] bg-surface-elevated px-3 py-2 text-sm outline-none focus:border-[#0070F8] focus:ring-2 focus:ring-[#0070F8]/20 dark:border-slate-700 dark:bg-slate-950"
          placeholder="Slide body"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || disabled}
            onClick={() => {
              setError("");
              const formData = new FormData();
              formData.set("id", slide.id);
              formData.set("course_id", courseId);
              formData.set("title", title);
              formData.set("body", body);
              startTransition(async () => {
                const result = await updateSlideAction(formData);
                if (result?.error) {
                  setError(result.error);
                  return;
                }
                onSaved();
              });
            }}
          >
            {pending ? "Saving…" : "Save slide"}
          </Button>
          {slide.image_path ? (
            <span className="text-xs text-blue-700 dark:text-blue-300">
              Image attached
            </span>
          ) : null}
          {uploadMsg ? (
            <span className="text-xs text-slate-500">{uploadMsg}</span>
          ) : null}
        </div>
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </div>
    </div>
  );
}
