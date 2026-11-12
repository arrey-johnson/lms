"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createCourseAction(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!title) return { error: "Title is required." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({ title, description: description || null })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/admin/courses");
  return { success: true, id: data.id };
}

export async function updateCourseAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!id || !title) return { error: "Title is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update({ title, description: description || null })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${id}`);
  return { success: true };
}

export async function deleteCourseAction(courseId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: course }, { data: modules }] = await Promise.all([
    admin.from("courses").select("thumbnail_path").eq("id", courseId).single(),
    admin
      .from("modules")
      .select("video_path, thumbnail_path")
      .eq("course_id", courseId),
  ]);

  const paths = [
    course?.thumbnail_path,
    ...(modules ?? []).flatMap((m) => [m.video_path, m.thumbnail_path]),
  ].filter((p): p is string => Boolean(p));

  if (paths.length) {
    await admin.storage.from("course-videos").remove(paths);
  }

  const { error } = await admin.from("courses").delete().eq("id", courseId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/admin/courses");
  return { success: true };
}
