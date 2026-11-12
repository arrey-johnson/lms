import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CourseForm } from "@/components/admin/course-form";
import { DeleteCourseButton } from "@/components/admin/delete-course-button";

export default async function AdminCoursesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*, modules(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-slate-900 dark:text-white">
          Courses
        </h1>
        <p className="mt-1 text-slate-500">
          Create courses, then add ordered video modules.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          New course
        </h2>
        <div className="mt-4">
          <CourseForm />
        </div>
      </section>

      <section className="space-y-3">
        {(courses ?? []).map((course) => {
          const moduleCount =
            Array.isArray(course.modules) && course.modules[0]?.count != null
              ? course.modules[0].count
              : 0;
          return (
            <div
              key={course.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="text-lg font-semibold text-slate-900 hover:text-blue-700 dark:text-white dark:hover:text-blue-300"
                >
                  {course.title}
                </Link>
                {course.description ? (
                  <p className="mt-1 max-w-2xl text-sm text-slate-500">
                    {course.description}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-slate-400">
                  {moduleCount} module{moduleCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="inline-flex h-8 items-center rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600"
                >
                  Manage modules
                </Link>
                <DeleteCourseButton courseId={course.id} />
              </div>
            </div>
          );
        })}
        {(courses ?? []).length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
            No courses yet. Create your first one above.
          </p>
        ) : null}
      </section>
    </div>
  );
}
