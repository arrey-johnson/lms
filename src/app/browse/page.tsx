import Link from "next/link";
import { ArrowLeft, PlayCircle, Search } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { EnrollButton } from "@/components/enroll-button";
import { PriceLabel } from "@/components/price-label";
import { courseStudyLabel } from "@/content/ai-foundations-module-1";
import type { Course } from "@/lib/types";
import { BrowseFilters } from "@/components/student/browse-filters";

function coursePrice(course: { price_cents?: number | null }) {
  return typeof course.price_cents === "number" && course.price_cents > 0
    ? course.price_cents
    : 9900;
}

export default async function BrowseCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { profile, userId } = await requireStudent();
  const { q } = await searchParams;
  const query = (q || "").trim().toLowerCase();
  const supabase = await createClient();

  const [{ data: enrollments }, { data: allCourses }] = await Promise.all([
    supabase.from("enrollments").select("course_id").eq("user_id", userId),
    supabase.from("courses").select("*").order("created_at", { ascending: false }),
  ]);

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.course_id));
  let availableCourses = ((allCourses ?? []) as Course[]).filter(
    (c) => !enrolledIds.has(c.id)
  );

  if (query) {
    availableCourses = availableCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        (c.description || "").toLowerCase().includes(query)
    );
  }

  const courseIds = availableCourses.map((c) => c.id);
  const { data: modules } = courseIds.length
    ? await supabase
        .from("modules")
        .select("id, course_id")
        .in("course_id", courseIds)
    : { data: [] as { id: string; course_id: string }[] };

  const modulesByCourse = new Map<string, number>();
  for (const mod of modules ?? []) {
    modulesByCourse.set(
      mod.course_id,
      (modulesByCourse.get(mod.course_id) || 0) + 1
    );
  }

  const thumbnails = new Map<string, string | null>();
  await Promise.all(
    availableCourses.map(async (course) => {
      if (!course.thumbnail_path) return;
      const { data } = await supabase.storage
        .from("course-videos")
        .createSignedUrl(course.thumbnail_path, 60 * 60);
      thumbnails.set(course.id, data?.signedUrl ?? null);
    })
  );

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
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-blue-700 dark:hover:text-blue-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to my courses
            </Link>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-slate-900 sm:text-3xl dark:text-white">
              Browse courses
            </h1>
            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Paid courses from Promptstack — pick one and buy access.
            </p>
          </div>
          <p className="text-sm text-slate-400">
            {availableCourses.length} course
            {availableCourses.length === 1 ? "" : "s"} available
          </p>
        </div>

        <BrowseFilters initialQuery={q || ""} />

        {availableCourses.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {availableCourses.map((course) => {
              const thumb = thumbnails.get(course.id);
              const priceCents = coursePrice(course);
              const moduleCount = modulesByCourse.get(course.id) || 0;
              return (
                <article
                  key={course.id}
                  className="flex flex-col overflow-hidden rounded-lg border border-[color:var(--border)] bg-surface-elevated shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
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
                      <PriceLabel priceCents={priceCents} />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-3">
                    <div className="flex-1">
                      <h2 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 dark:text-white">
                        {course.title}
                      </h2>
                      {course.description ? (
                        <p className="mt-1 line-clamp-3 text-xs text-slate-500">
                          {course.description}
                        </p>
                      ) : null}
                      <p className="mt-2 text-[11px] text-slate-400">
                        {courseStudyLabel(course.curriculum_slug, moduleCount)}
                      </p>
                    </div>
                    <EnrollButton
                      courseId={course.id}
                      courseTitle={course.title}
                      priceCents={priceCents}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700">
            <Search className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
              {query
                ? `No courses match “${q}”`
                : "No courses left to buy"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {query
                ? "Try another search, or clear the filter."
                : "You’re enrolled in every course. New ones will show up here."}
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#0070F8] px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Go to my courses
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
