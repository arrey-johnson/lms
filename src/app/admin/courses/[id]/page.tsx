import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CourseForm } from "@/components/admin/course-form";
import { CourseThumbnailUpload } from "@/components/admin/course-thumbnail-upload";
import { DeleteCourseButton } from "@/components/admin/delete-course-button";
import { ModuleForm } from "@/components/admin/module-form";
import { ModuleList } from "@/components/admin/module-list";
import { getCurriculum } from "@/content/ai-foundations-module-1";
import type { Course, Module, Slide } from "@/lib/types";

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!course) notFound();

  const typedCourse = course as Course;
  const tutorCurriculum = getCurriculum(typedCourse.curriculum_slug);

  let thumbnailUrl: string | null = null;
  if (typedCourse.thumbnail_path) {
    const { data } = await supabase.storage
      .from("course-videos")
      .createSignedUrl(typedCourse.thumbnail_path, 60 * 60);
    thumbnailUrl = data?.signedUrl ?? null;
  }

  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", id)
    .order("order_index", { ascending: true });

  const typedModules = (modules ?? []) as Module[];
  const moduleIds = typedModules.map((m) => m.id);
  const { data: slides } = moduleIds.length
    ? await supabase
        .from("slides")
        .select("*")
        .in("module_id", moduleIds)
        .order("order_index", { ascending: true })
    : { data: [] as Slide[] };

  const slidesByModule: Record<string, Slide[]> = {};
  for (const slide of (slides ?? []) as Slide[]) {
    if (!slidesByModule[slide.module_id]) slidesByModule[slide.module_id] = [];
    slidesByModule[slide.module_id].push(slide);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/courses"
            className="text-sm text-blue-700 hover:underline dark:text-blue-400"
          >
            ← All courses
          </Link>
          <h1 className="mt-2 break-words font-[family-name:var(--font-display)] text-2xl text-slate-900 sm:text-3xl dark:text-white">
            {typedCourse.title}
          </h1>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            href={`/course/${typedCourse.id}`}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600"
          >
            Preview as student
          </Link>
          <DeleteCourseButton courseId={typedCourse.id} />
        </div>
      </div>

      <section className="rounded-2xl border border-[color:var(--border)] bg-surface-elevated p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Course details
        </h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <CourseForm course={typedCourse} />
          <CourseThumbnailUpload
            courseId={typedCourse.id}
            thumbnailUrl={thumbnailUrl}
          />
        </div>
      </section>

      {tutorCurriculum ? (
        <section className="rounded-2xl border border-[color:var(--border)] bg-surface-elevated p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {tutorCurriculum.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Students learn this course by conversation. The tutor asks questions,
            corrects misconceptions, and moves on only after they show they
            understand each lesson. Slide modules are hidden while this format
            is selected. Use Preview as student to try the tutor.
          </p>
          <ol className="mt-4 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {tutorCurriculum.lessons.map((lesson) => (
              <li key={lesson.id}>
                <span className="font-medium text-slate-900 dark:text-white">
                  {lesson.label}.
                </span>{" "}
                {lesson.title}
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <>
          <section className="space-y-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-slate-900 dark:text-white">
                Modules
              </h2>
              <p className="text-sm text-slate-500">
                Drag to reorder modules. Build each lesson as a slide deck.
              </p>
            </div>
            <ModuleList
              courseId={typedCourse.id}
              modules={typedModules}
              slidesByModule={slidesByModule}
            />
          </section>

          <section className="rounded-2xl border border-[color:var(--border)] bg-surface-elevated p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Add module
            </h2>
            <div className="mt-4">
              <ModuleForm courseId={typedCourse.id} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
