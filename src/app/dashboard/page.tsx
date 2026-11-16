import Link from "next/link";
import { ArrowRight, BookOpen, PlayCircle, ShoppingBag } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { EnrollButton } from "@/components/enroll-button";
import { formatPercent, formatPrice } from "@/lib/utils";
import type { Course } from "@/lib/types";

function coursePrice(course: { price_cents?: number | null }) {
  return typeof course.price_cents === "number" && course.price_cents > 0
    ? course.price_cents
    : 1499;
}

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
  const availableCourses = ((allCourses ?? []) as Course[]).filter(
    (c) => !enrolledIds.has(c.id)
  );
  const courseIds = (enrollments ?? []).map((e) => e.course_id);
  const allCourseIds = (allCourses ?? []).map((c) => c.id);

  const { data: modules } = allCourseIds.length
    ? await supabase
        .from("modules")
        .select("id, course_id")
        .in("course_id", allCourseIds)
    : { data: [] as { id: string; course_id: string }[] };

  const enrolledModuleIds = (modules ?? [])
    .filter((m) => enrolledIds.has(m.course_id))
    .map((m) => m.id);

  const { data: progress } = enrolledModuleIds.length
    ? await supabase
        .from("progress")
        .select("module_id, completed")
        .eq("user_id", userId)
        .in("module_id", enrolledModuleIds)
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
    ...(enrollments ?? []).map(
      (e) =>
        e.courses as unknown as {
          id: string;
          thumbnail_path?: string | null;
        } | null
    ),
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

  const myCourses = (enrollments ?? [])
    .map((enrollment) => {
      const course = enrollment.courses as unknown as Course | null;
      if (!course) return null;
      const courseModules = modulesByCourse.get(course.id) || [];
      const completed = courseModules.filter((id) => completedSet.has(id)).length;
      const pct =
        courseModules.length === 0
          ? 0
          : (completed / courseModules.length) * 100;
      return {
        course,
        completed,
        total: courseModules.length,
        pct,
        thumb: thumbnails.get(course.id) ?? null,
      };
    })
    .filter(Boolean) as {
    course: Course;
    completed: number;
    total: number;
    pct: number;
    thumb: string | null;
  }[];

  const continueCourse =
    myCourses.find((c) => c.pct > 0 && c.pct < 100) ??
    myCourses.find((c) => c.pct === 0) ??
    null;

  const inProgressCount = myCourses.filter((c) => c.pct > 0 && c.pct < 100).length;
  const completedCount = myCourses.filter((c) => c.pct >= 100).length;
  const catalogPreview = availableCourses.slice(0, 4);

  const studentNav = [
    { href: "/dashboard", label: "My courses", shortLabel: "Courses" },
    { href: "/browse", label: "Browse courses", shortLabel: "Browse" },
  ];

  return (
    <AppShell
      brandHref="/dashboard"
      userLabel={profile.full_name || profile.email || "Student"}
      avatarUrl={profile.avatar_url}
      nav={studentNav}
    >
      <div className="space-y-10">
        <section className="overflow-hidden rounded-2xl border border-[color:var(--border)]/80 bg-gradient-to-br from-surface-elevated via-[#e8f1fc]/70 to-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)] sm:p-6 md:p-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-none">
          <div className="flex flex-col gap-5 md:gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#0070F8]">Your learning</p>
              <h1 className="mt-1 break-words font-[family-name:var(--font-display)] text-2xl text-slate-900 sm:text-3xl md:text-4xl dark:text-white">
                Welcome{profile.full_name ? `, ${profile.full_name}` : ""}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-500 sm:text-base dark:text-slate-400">
                Continue a course you own, or browse more skills to buy.
              </p>
            </div>
            <div className="grid w-full grid-cols-3 gap-2 sm:gap-3 lg:w-auto lg:min-w-[22rem]">
              <div className="rounded-xl border border-[color:var(--border)] bg-surface-elevated/90 px-2.5 py-3 sm:px-4 dark:border-slate-700 dark:bg-slate-950/60">
                <p className="text-xl font-semibold text-slate-900 sm:text-2xl dark:text-white">
                  {myCourses.length}
                </p>
                <p className="text-[10px] text-slate-500 sm:text-xs">Owned</p>
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-surface-elevated/90 px-2.5 py-3 sm:px-4 dark:border-slate-700 dark:bg-slate-950/60">
                <p className="text-xl font-semibold text-slate-900 sm:text-2xl dark:text-white">
                  {inProgressCount}
                </p>
                <p className="text-[10px] text-slate-500 sm:text-xs">In progress</p>
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-surface-elevated/90 px-2.5 py-3 sm:px-4 dark:border-slate-700 dark:bg-slate-950/60">
                <p className="text-xl font-semibold text-slate-900 sm:text-2xl dark:text-white">
                  {availableCourses.length}
                </p>
                <p className="text-[10px] text-slate-500 sm:text-xs">To buy</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:flex-wrap sm:gap-3">
            {continueCourse ? (
              <Link
                href={`/course/${continueCourse.course.id}`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0070F8] px-4 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
              >
                <PlayCircle className="h-4 w-4" />
                Continue learning
              </Link>
            ) : null}
            <Link
              href="/browse"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--border)] bg-surface-elevated px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-800 sm:w-auto dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-300"
            >
              <ShoppingBag className="h-4 w-4" />
              Browse courses
            </Link>
          </div>
        </section>

        {continueCourse ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Continue where you left off
              </h2>
              <p className="text-xs text-slate-400">
                {formatPercent(continueCourse.pct)} complete
              </p>
            </div>
            <Link
              href={`/course/${continueCourse.course.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface-elevated shadow-sm transition hover:border-blue-300 hover:shadow-md sm:flex-row dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
            >
              <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-slate-200 sm:aspect-auto sm:h-auto sm:w-56 md:w-72 dark:bg-slate-800">
                {continueCourse.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={continueCourse.thumb}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full min-h-[140px] items-center justify-center text-slate-400">
                    <BookOpen className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center gap-3 p-5">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                    {continueCourse.course.title}
                  </h3>
                  {continueCourse.course.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {continueCourse.course.description}
                    </p>
                  ) : null}
                </div>
                <div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${continueCourse.pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {continueCourse.completed} of {continueCourse.total} modules
                    completed
                  </p>
                </div>
              </div>
            </Link>
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                My courses
              </h2>
              <p className="text-sm text-slate-500">
                Courses you already own
                {completedCount > 0
                  ? ` · ${completedCount} completed`
                  : ""}
              </p>
            </div>
          </div>

          {myCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {myCourses.map(({ course, pct, thumb }) => (
                <Link
                  key={course.id}
                  href={`/course/${course.id}`}
                  className="group overflow-hidden rounded-lg border border-[color:var(--border)] bg-surface-elevated transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-200 dark:bg-slate-800">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <PlayCircle className="h-8 w-8" />
                      </div>
                    )}
                    <span className="absolute right-2 top-2 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {formatPercent(pct)}
                    </span>
                  </div>
                  <div className="space-y-2 p-3">
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                      {course.title}
                    </h3>
                    <div className="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                You don’t own a course yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Browse the catalog and buy a course to start learning.
              </p>
              <Link
                href="/browse"
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0070F8] px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Browse courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Courses you can buy
              </h2>
              <p className="text-sm text-slate-500">
                Expand your skills with more Promptstack courses
              </p>
            </div>
            {availableCourses.length > catalogPreview.length ? (
              <Link
                href="/browse"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#0070F8] hover:underline"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>

          {catalogPreview.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {catalogPreview.map((course) => {
                const thumb = thumbnails.get(course.id);
                const priceCents = coursePrice(course);
                const moduleCount = (modulesByCourse.get(course.id) || []).length;
                return (
                  <div
                    key={course.id}
                    className="flex flex-col overflow-hidden rounded-lg border border-[color:var(--border)] bg-surface-elevated dark:border-slate-800 dark:bg-slate-900"
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
                          <PlayCircle className="h-8 w-8" />
                        </div>
                      )}
                      <span className="absolute left-2 top-2 rounded bg-surface-elevated/95 px-1.5 py-0.5 text-[10px] font-bold text-slate-900 shadow-sm dark:bg-slate-950/90 dark:text-white">
                        {formatPrice(priceCents)}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <div className="flex-1">
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 dark:text-white">
                          {course.title}
                        </h3>
                        {course.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {course.description}
                          </p>
                        ) : null}
                        <p className="mt-2 text-[11px] text-slate-400">
                          {moduleCount} module{moduleCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <EnrollButton
                        courseId={course.id}
                        courseTitle={course.title}
                        priceCents={priceCents}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
              You’re enrolled in every course in the catalog. Check back for new
              releases.
            </p>
          )}

          {availableCourses.length > 0 ? (
            <div className="flex justify-center pt-1">
              <Link
                href="/browse"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[color:var(--border)] bg-surface-elevated px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Browse full catalog
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
