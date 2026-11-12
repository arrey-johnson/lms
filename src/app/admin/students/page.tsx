import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StudentManager } from "@/components/admin/student-manager";
import type { Course, StudentWithProgress } from "@/lib/types";

export default async function AdminStudentsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("title", { ascending: true });

  const { data: students } = await admin
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  const studentIds = (students ?? []).map((s) => s.id);

  const [{ data: enrollments }, { data: allModules }, { data: progress }] =
    await Promise.all([
      studentIds.length
        ? admin
            .from("enrollments")
            .select("user_id, course_id, courses(title)")
            .in("user_id", studentIds)
        : Promise.resolve({ data: [] as never[] }),
      admin.from("modules").select("id, course_id"),
      studentIds.length
        ? admin
            .from("progress")
            .select("user_id, module_id, completed")
            .in("user_id", studentIds)
            .eq("completed", true)
        : Promise.resolve({ data: [] as never[] }),
    ]);

  const modulesByCourse = new Map<string, string[]>();
  for (const mod of allModules ?? []) {
    const list = modulesByCourse.get(mod.course_id) || [];
    list.push(mod.id);
    modulesByCourse.set(mod.course_id, list);
  }

  const enriched: StudentWithProgress[] = (students ?? []).map((student) => {
    const studentEnrollments = (enrollments ?? [])
      .filter((e) => e.user_id === student.id)
      .map((e) => ({
        course_id: e.course_id,
        course_title:
          (e.courses as { title?: string } | null)?.title || "Course",
      }));

    const enrolledModuleIds = studentEnrollments.flatMap(
      (e) => modulesByCourse.get(e.course_id) || []
    );
    const completed = (progress ?? []).filter(
      (p) =>
        p.user_id === student.id && enrolledModuleIds.includes(p.module_id)
    ).length;

    return {
      ...(student as StudentWithProgress),
      enrollments: studentEnrollments,
      completed_modules: completed,
      total_modules: enrolledModuleIds.length,
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-slate-900 dark:text-white">
          Students
        </h1>
        <p className="mt-1 text-slate-500">
          Create accounts, enroll in courses, and track progress.
        </p>
      </div>
      <StudentManager
        courses={(courses ?? []) as Course[]}
        students={enriched}
      />
    </div>
  );
}
