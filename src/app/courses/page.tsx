import Link from "next/link";
import { PlayCircle, Search } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { CourseSearch } from "@/components/course-search";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { EnrollButton } from "@/components/enroll-button";
import { PriceLabel } from "@/components/price-label";
import { SiteFooter } from "@/components/site-footer";
import { BrowseFilters } from "@/components/student/browse-filters";
import { courseStudyLabel } from "@/content/ai-foundations-module-1";
import { getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Course } from "@/lib/types";

function coursePrice(course: { price_cents?: number | null }) {
  return typeof course.price_cents === "number" && course.price_cents > 0
    ? course.price_cents
    : 9900;
}

export default async function PublicCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q || "").trim().toLowerCase();
  const { supabase, user } = await getSessionUser();
  const admin = createAdminClient();

  const [{ data: allCourses }, { data: enrollmentRows }] = await Promise.all([
    admin.from("courses").select("*").order("created_at", { ascending: false }),
    user
      ? supabase.from("enrollments").select("course_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { course_id: string }[] }),
  ]);

  const enrolledIds = new Set((enrollmentRows ?? []).map((row) => row.course_id));
  let courses = (allCourses ?? []) as Course[];
  if (query) {
    courses = courses.filter(
      (course) =>
        course.title.toLowerCase().includes(query) ||
        (course.description || "").toLowerCase().includes(query)
    );
  }

  const courseIds = courses.map((course) => course.id);
  const { data: modules } = courseIds.length
    ? await admin.from("modules").select("id, course_id").in("course_id", courseIds)
    : { data: [] as { id: string; course_id: string }[] };

  const modulesByCourse = new Map<string, number>();
  for (const mod of modules ?? []) {
    modulesByCourse.set(mod.course_id, (modulesByCourse.get(mod.course_id) || 0) + 1);
  }

  const thumbnails = new Map<string, string | null>();
  await Promise.all(
    courses.map(async (course) => {
      if (!course.thumbnail_path) return;
      const { data } = await admin.storage
        .from("course-videos")
        .createSignedUrl(course.thumbnail_path, 60 * 60);
      thumbnails.set(course.id, data?.signedUrl ?? null);
    })
  );

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-2.5 px-3 py-3 sm:gap-3 sm:px-4 sm:py-4 md:px-6">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <BrandLogo href="/" size="lg" className="max-w-[10.5rem] sm:max-w-[12rem] md:max-w-none" />
          <div className="mx-2 hidden min-w-0 flex-1 justify-center lg:flex">
            <CourseSearch />
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <CurrencySwitcher />
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center rounded-lg bg-[#0070F8] px-3 text-xs font-medium text-white transition hover:bg-blue-700 sm:h-10 sm:px-4 sm:text-sm"
              >
                My courses
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800 sm:inline-flex sm:px-4"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-9 items-center rounded-lg bg-[#0070F8] px-3 text-xs font-medium text-white transition hover:bg-blue-700 sm:h-10 sm:px-4 sm:text-sm"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="lg:hidden">
          <CourseSearch className="max-w-none" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-4 sm:py-8 md:px-6">
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h1 className="font-[family-name:var(--font-display)] text-2xl text-white sm:text-3xl">
                Courses
              </h1>
              <p className="mt-1 text-sm text-slate-400 sm:text-base">
                Look through the catalog. Buy takes you to an account, then checkout for that course.
              </p>
            </div>
            <p className="text-sm text-slate-400">
              {courses.length} course{courses.length === 1 ? "" : "s"}
            </p>
          </div>

          <BrowseFilters initialQuery={q || ""} path="/courses" />

          {courses.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {courses.map((course) => {
                const thumb = thumbnails.get(course.id);
                const priceCents = coursePrice(course);
                const owned = enrolledIds.has(course.id);
                const checkoutPath = `/checkout/${course.id}`;
                const buyHref = user
                  ? checkoutPath
                  : `/signup?next=${encodeURIComponent(checkoutPath)}`;
                return (
                  <article
                    id={course.id}
                    key={course.id}
                    className="flex scroll-mt-24 flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-sm"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-800">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <PlayCircle className="h-8 w-8" />
                        </div>
                      )}
                      <span className="absolute left-2 top-2 rounded bg-slate-950/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        <PriceLabel priceCents={priceCents} />
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-3">
                      <div className="flex-1">
                        <h2 className="line-clamp-2 text-sm font-bold leading-snug text-white">
                          {course.title}
                        </h2>
                        {course.description ? (
                          <p className="mt-1 line-clamp-3 text-xs text-slate-400">{course.description}</p>
                        ) : null}
                        <p className="mt-2 text-[11px] text-slate-500">
                          {courseStudyLabel(course.curriculum_slug, modulesByCourse.get(course.id) || 0)}
                        </p>
                      </div>
                      <EnrollButton
                        courseId={course.id}
                        courseTitle={course.title}
                        priceCents={priceCents}
                        cta={owned ? "Open" : "Buy"}
                        href={owned ? `/course/${course.id}` : buyHref}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-16 text-center">
              <Search className="mx-auto h-10 w-10 text-slate-500" />
              <p className="mt-3 text-sm font-medium text-slate-200">
                {query ? `No courses match “${q}”` : "No courses yet"}
              </p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
