import { notFound, redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { CoursePlayer } from "@/components/student/course-player";
import { isModuleUnlocked } from "@/lib/module-access";
import type { Module, Progress } from "@/lib/types";

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

  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  const moduleIds = (modules ?? []).map((m) => m.id);
  const { data: progressRows } = moduleIds.length
    ? await supabase
        .from("progress")
        .select("*")
        .eq("user_id", userId)
        .in("module_id", moduleIds)
    : { data: [] as Progress[] };

  const progressByModule = new Map(
    (progressRows ?? []).map((p) => [p.module_id, p as Progress])
  );

  const orderedModules = (modules ?? []) as Module[];

  let courseThumbnailUrl: string | null = null;
  if (course.thumbnail_path) {
    const { data } = await supabase.storage
      .from("course-videos")
      .createSignedUrl(course.thumbnail_path, 60 * 60);
    courseThumbnailUrl = data?.signedUrl ?? null;
  }

  const modulesWithUrls = await Promise.all(
    orderedModules.map(async (mod) => {
      const unlocked = isModuleUnlocked(
        orderedModules,
        mod.id,
        progressByModule,
        isAdmin
      );

      let videoUrl: string | null = null;
      if (mod.video_path && unlocked) {
        const { data } = await supabase.storage
          .from("course-videos")
          .createSignedUrl(mod.video_path, 60 * 60);
        videoUrl = data?.signedUrl ?? null;
      }

      return {
        ...mod,
        progress: progressByModule.get(mod.id) ?? null,
        videoUrl,
      };
    })
  );

  return (
    <AppShell
      brandHref={isAdmin ? "/admin" : "/dashboard"}
      userLabel={profile.full_name || profile.email || "Student"}
      avatarUrl={profile.avatar_url}
      nav={
        isAdmin
          ? [
              { href: "/admin", label: "Overview" },
              { href: "/admin/courses", label: "Courses" },
              { href: "/admin/students", label: "Students" },
            ]
          : [{ href: "/dashboard", label: "My courses" }]
      }
    >
      <CoursePlayer
        courseTitle={course.title}
        courseDescription={course.description}
        courseThumbnailUrl={courseThumbnailUrl}
        modules={modulesWithUrls}
        bypassLocks={isAdmin}
      />
    </AppShell>
  );
}
