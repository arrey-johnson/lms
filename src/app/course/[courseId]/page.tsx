import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { CoursePlayer } from "@/components/student/course-player";
import { TutorPlayer } from "@/components/student/tutor-player";
import { loadTutorSession } from "@/lib/actions/tutor";
import { getCurriculum } from "@/content/ai-foundations-module-1";
import { isModuleUnlocked } from "@/lib/module-access";
import type { Course, Module, Progress, Slide } from "@/lib/types";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { profile, userId } = await requireStudent();
  const { courseId } = await params;
  const supabase = await createClient();
  const isAdmin = profile.role === "admin";

  if (!isAdmin) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (!enrollment) {
      redirect("/dashboard");
    }
  }

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) notFound();

  const typedCourse = course as Course;
  const curriculum = getCurriculum(typedCourse.curriculum_slug);
  const shell = (children: ReactNode) => (
    <AppShell
      wide={Boolean(curriculum)}
      brandHref={isAdmin ? "/admin" : "/dashboard"}
      userLabel={profile.full_name || profile.email || "Student"}
      avatarUrl={profile.avatar_url}
      nav={
        isAdmin
          ? [
              { href: "/admin", label: "Overview" },
              { href: "/admin/courses", label: "Courses" },
              { href: "/admin/students", label: "Students" },
              { href: "/admin/payments", label: "Payments" },
            ]
          : [
              { href: "/dashboard", label: "My courses", shortLabel: "Courses" },
              { href: "/browse", label: "Browse courses", shortLabel: "Browse" },
            ]
      }
    >
      {children}
    </AppShell>
  );

  if (curriculum) {
    const session = await loadTutorSession(courseId);
    return shell(
      session.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {session.error}
        </p>
      ) : (
        <TutorPlayer
          courseId={courseId}
          courseTitle={typedCourse.title}
          courseDescription={typedCourse.description}
          lessons={curriculum.lessons.map((lesson) => ({
            id: lesson.id,
            label: lesson.label,
            title: lesson.title,
          }))}
          initialMessages={session.messages}
          initialLessonIndex={session.lessonIndex}
          initialCompleted={session.completed}
          previewMode={isAdmin}
          backHref={isAdmin ? `/admin/courses/${courseId}` : "/dashboard"}
          backLabel={isAdmin ? "← Back to course editor" : "← Back to courses"}
        />
      )
    );
  }

  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  const orderedModules = (modules ?? []) as Module[];
  const moduleIds = orderedModules.map((m) => m.id);

  const [{ data: progressRows }, { data: slides }] = await Promise.all([
    moduleIds.length
      ? supabase
          .from("progress")
          .select("*")
          .eq("user_id", userId)
          .in("module_id", moduleIds)
      : Promise.resolve({ data: [] as Progress[] }),
    moduleIds.length
      ? supabase
          .from("slides")
          .select("*")
          .in("module_id", moduleIds)
          .order("order_index", { ascending: true })
      : Promise.resolve({ data: [] as Slide[] }),
  ]);

  const progressByModule = new Map(
    (progressRows ?? []).map((p) => [p.module_id, p as Progress])
  );

  const slidesByModule = new Map<string, Slide[]>();
  for (const slide of (slides ?? []) as Slide[]) {
    const list = slidesByModule.get(slide.module_id) || [];
    list.push(slide);
    slidesByModule.set(slide.module_id, list);
  }

  let courseThumbnailUrl: string | null = null;
  if (typedCourse.thumbnail_path) {
    const { data } = await supabase.storage
      .from("course-videos")
      .createSignedUrl(typedCourse.thumbnail_path, 60 * 60);
    courseThumbnailUrl = data?.signedUrl ?? null;
  }

  const modulesWithSlides = await Promise.all(
    orderedModules.map(async (mod) => {
      const moduleSlides = slidesByModule.get(mod.id) || [];
      const unlocked = isModuleUnlocked(
        orderedModules.map((m) => ({
          id: m.id,
          slide_count: (slidesByModule.get(m.id) || []).length,
        })),
        mod.id,
        progressByModule,
        isAdmin
      );

      const slidesWithUrls = await Promise.all(
        moduleSlides.map(async (slide) => {
          let imageUrl: string | null = null;
          if (slide.image_path && unlocked) {
            const { data } = await supabase.storage
              .from("course-videos")
              .createSignedUrl(slide.image_path, 60 * 60);
            imageUrl = data?.signedUrl ?? null;
          }
          return { ...slide, imageUrl };
        })
      );

      return {
        ...mod,
        progress: progressByModule.get(mod.id) ?? null,
        slides: unlocked ? slidesWithUrls : slidesWithUrls.map((s) => ({
          ...s,
          imageUrl: null,
        })),
        slide_count: moduleSlides.length,
      };
    })
  );

  return shell(
    <CoursePlayer
      courseTitle={typedCourse.title}
      courseDescription={typedCourse.description}
      courseThumbnailUrl={courseThumbnailUrl}
      modules={modulesWithSlides}
      bypassLocks={isAdmin}
      previewMode={isAdmin}
      backHref={isAdmin ? `/admin/courses/${courseId}` : "/dashboard"}
      backLabel={isAdmin ? "← Back to course editor" : "← Back to courses"}
    />
  );
}
