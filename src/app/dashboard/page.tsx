import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { EnrollButton } from "@/components/enroll-button";
import { formatPercent } from "@/lib/utils";

export default async function StudentDashboardPage() {
  const { profile, userId } = await requireStudent();
  const supabase = await createClient();

  const [{ data: enrollments }, { data: allCourses }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("course_id, courses(*)")
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false }),
    supabase.from("courses").select("*").order("created_at", { ascending: false }),
  ]);

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.course_id));
  const availableCourses = (allCourses ?? []).filter((c) => !enrolledIds.has(c.id));
  const courseIds = (enrollments ?? []).map((e) => e.course_id);

  const { data: modules } = courseIds.length
    ? await supabase
        .from("modules")
        .select("id, course_id")
        .in("course_id", courseIds)
    : { data: [] as { id: string; course_id: string }[] };

  const moduleIds = (modules ?? []).map((m) => m.id);
  const { data: progress } = moduleIds.length
    ? await supabase
        .from("progress")
        .select("module_id, completed")
        .eq("user_id", userId)
        .in("module_id", moduleIds)
    : { data: [] as { module_id: string; completed: boolean }[] };

  const completedSet = new Set(
    (progress ?? []).filter((p) => p.completed).map((p) => p.module_id)
  );

  const modulesByCourse = new Map<string, string[]>();
  for (const mod of modules ?? []) {
    const list = modulesByCourse.get(mod.course_id) || [];
    list.push(mod.id);
    modulesByCourse.set(mod.course_id, list);
  }

  const thumbnails = new Map<string, string | null>();
  const coursesNeedingThumbs = [
    ...(enrollments ?? []).map((e) => e.courses as unknown as { id: string; thumbnail_path?: string | null } | null),
    ...availableCourses,
  ].filter(Boolean);

  await Promise.all(
    coursesNeedingThumbs.map(async (course) => {
      if (!course?.thumbnail_path || thumbnails.has(course.id)) return;
      const { data } = await supabase.storage
        .from("course-videos")
        .createSignedUrl(course.thumbnail_path, 60 * 60);
      thumbnails.set(course.id, data?.signedUrl ?? null);
    })
  );

  const studentNav = [
    { href: "/dashboard", label: "My courses" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <AppShell
      brandHref="/dashboard"
      userLabel={profile.full_name || profile.email || "Student"}
      nav={studentNav}
    >
      <div className="space-y-10">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-slate-900 dark:text-white">
            Welcome{profile.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="mt-1 text-slate-500">
            Continue learning — or explore new skills to add.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            My courses
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {(enrollments ?? []).map((enrollment) => {
              const course = enrollment.courses as unknown as {
                id: string;
                title: string;
                description: string | null;
                thumbnail_path?: string | null;
              } | null;
              if (!course) return null;

              const courseModules = modulesByCourse.get(course.id) || [];
              const completed = courseModules.filter((id) =>
                completedSet.has(id)
              ).length;
              const pct =
                courseModules.length === 0
                  ? 0
                  : (completed / courseModules.length) * 100;
              const thumb = thumbnails.get(course.id);

              return (
                <Link
                  key={course.id}
                  href={`/course/${course.id}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-200 dark:bg-slate-800">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <PlayCircle className="h-10 w-10" />
                      </div>
                    )}
                    <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-blue-800 shadow-sm dark:bg-slate-950/90 dark:text-blue-200">
                      {formatPercent(pct)}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-slate-900 group-hover:text-blue-800 dark:text-white dark:group-hover:text-blue-300">
                      {course.title}
                    </h3>
                    {course.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                        {course.description}
                      </p>
                    ) : null}
                    <div className="mt-5">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        {completed} of {courseModules.length} modules completed
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {(enrollments ?? []).length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
              You haven’t enrolled in a course yet. Browse the catalog below.
            </p>
          ) : null}
        </section>

        {availableCourses.length > 0 ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Explore skills
              </h2>
              <p className="text-sm text-slate-500">
                Free courses you can join instantly.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {availableCourses.map((course) => {
                const thumb = thumbnails.get(course.id);
                return (
                  <div
                    key={course.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-200 dark:bg-slate-800">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <PlayCircle className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-4 p-5">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                          {course.title}
                        </h3>
                        {course.description ? (
                          <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                            {course.description}
                          </p>
                        ) : null}
                      </div>
                      <EnrollButton courseId={course.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
