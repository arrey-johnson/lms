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
import { GripVertical, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import {
  deleteModuleAction,
  reorderModulesAction,
} from "@/lib/actions/modules";
import { ModuleForm } from "@/components/admin/module-form";
import { ModuleUpload } from "@/components/admin/module-upload";
import { Button } from "@/components/ui/button";
import type { Module } from "@/lib/types";

export function ModuleList({
  courseId,
  modules,
}: {
  courseId: string;
  modules: Module[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(modules);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const ids = useMemo(() => items.map((m) => m.id), [items]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((m) => m.id === active.id);
    const newIndex = items.findIndex((m) => m.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    startTransition(async () => {
      await reorderModulesAction(
        courseId,
        next.map((m) => m.id)
      );
      router.refresh();
    });
  }

  useEffect(() => {
    setItems(modules);
  }, [modules]);

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {items.map((mod, index) => (
            <SortableModuleCard
              key={mod.id}
              module={mod}
              index={index}
              courseId={courseId}
              editing={editingId === mod.id}
              onEdit={() =>
                setEditingId((id) => (id === mod.id ? null : mod.id))
              }
              onDelete={() => {
                if (!confirm("Delete this module?")) return;
                startTransition(async () => {
                  await deleteModuleAction(mod.id, courseId);
                  router.refresh();
                });
              }}
            />
          ))}
        </SortableContext>
      </DndContext>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
          No modules yet. Add your first lesson below.
        </p>
      ) : null}
    </div>
  );
}

function SortableModuleCard({
  module,
  index,
  courseId,
  editing,
  onEdit,
  onDelete,
}: {
  module: Module;
  index: number;
  courseId: string;
  editing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 cursor-grab text-slate-400 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Module {index + 1}
              </p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {module.title}
              </h3>
              {module.description ? (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {module.description}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span
                  className={
                    module.video_path
                      ? "inline-flex items-center gap-1 text-blue-700 dark:text-blue-300"
                      : "text-amber-700 dark:text-amber-300"
                  }
                >
                  {module.video_path ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Video uploaded
                    </>
                  ) : (
                    "No video yet"
                  )}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button type="button" variant="danger" size="sm" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {editing ? (
            <ModuleForm
              courseId={courseId}
              module={module}
              onDone={onEdit}
            />
          ) : null}

          <ModuleUpload
            moduleId={module.id}
            courseId={courseId}
            hasVideo={Boolean(module.video_path)}
          />
        </div>
      </div>
    </div>
  );
}
