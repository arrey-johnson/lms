import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StudentManager } from "@/components/admin/student-manager";
import {
  getCurriculum,
  masteredLessonCount,
} from "@/content/ai-foundations-module-1";
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

  const tutorCourseIds = ((courses ?? []) as Course[])
    .filter((course) => getCurriculum(course.curriculum_slug))
    .map((course) => course.id);

  const [{ data: enrollments }, { data: allModules }, { data: progress }, { data: tutorSessions }] =
    await Promise.all([
      studentIds.length
        ? admin
            .from("enrollments")
            .select("user_id, course_id, courses(title, curriculum_slug)")
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
      studentIds.length && tutorCourseIds.length
        ? admin
            .from("tutor_sessions")
            .select("user_id, course_id, lesson_index, completed")
            .in("user_id", studentIds)
            .in("course_id", tutorCourseIds)
        : Promise.resolve({ data: [] as never[] }),
    ]);

  const modulesByCourse = new Map<string, string[]>();
  for (const mod of allModules ?? []) {
    const list = modulesByCourse.get(mod.course_id) || [];
    list.push(mod.id);
    modulesByCourse.set(mod.course_id, list);
  }

  type EnrollmentRow = {
    user_id: string;
    course_id: string;
    courses: { title?: string; curriculum_slug?: string | null } | null;
  };
  type SessionRow = {
    user_id: string;
    course_id: string;
    lesson_index: number;
    completed: boolean;
  };

  const enrollmentRows = (enrollments ?? []) as EnrollmentRow[];
  const sessionRows = (tutorSessions ?? []) as SessionRow[];

  const enriched: StudentWithProgress[] = (students ?? []).map((student) => {
    const studentEnrollments = enrollmentRows.filter(
      (enrollment) => enrollment.user_id === student.id
    );
    let completed = 0;
    let total = 0;
    let tutorLessons = 0;
    let slideModules = 0;

    for (const enrollment of studentEnrollments) {
      const curriculum = getCurriculum(enrollment.courses?.curriculum_slug);
      if (curriculum) {
        const lessonCount = curriculum.lessons.length;
        const session = sessionRows.find(
          (row) =>
            row.user_id === student.id && row.course_id === enrollment.course_id
        );
        tutorLessons += lessonCount;
        total += lessonCount;
        completed += masteredLessonCount(
          session?.lesson_index ?? 0,
          Boolean(session?.completed),
          lessonCount
        );
        continue;
      }

      const moduleIds = modulesByCourse.get(enrollment.course_id) || [];
      slideModules += moduleIds.length;
      total += moduleIds.length;
      completed += (progress ?? []).filter(
        (row) =>
          row.user_id === student.id && moduleIds.includes(row.module_id)
      ).length;
    }

    return {
      ...(student as StudentWithProgress),
      enrollments: studentEnrollments.map((enrollment) => ({
        course_id: enrollment.course_id,
        course_title: enrollment.courses?.title || "Course",
      })),
      completed_modules: completed,
      total_modules: total,
      progress_unit:
        tutorLessons > 0 && slideModules === 0 ? "lessons" : "modules",
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
