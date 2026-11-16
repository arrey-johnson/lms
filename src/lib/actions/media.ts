"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function attachCourseThumbnailAction(input: {
  courseId: string;
  path: string;
}) {
  await requireAdmin();
  const { courseId, path } = input;
  if (!courseId || !path) return { error: "Missing course or path." };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("courses")
    .select("thumbnail_path")
    .eq("id", courseId)
    .single();

  const { error } = await admin
    .from("courses")
    .update({ thumbnail_path: path })
    .eq("id", courseId);

  if (error) return { error: error.message };

  if (existing?.thumbnail_path && existing.thumbnail_path !== path) {
    await admin.storage.from("course-videos").remove([existing.thumbnail_path]);
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
