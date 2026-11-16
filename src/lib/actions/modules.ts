"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createModuleAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("course_id") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!courseId || !title) return { error: "Title is required." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("modules")
    .select("order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: false })
    .limit(1);

  const orderIndex = (existing?.[0]?.order_index ?? -1) + 1;

  const { data, error } = await supabase
    .from("modules")
    .insert({
      course_id: courseId,
      title,
      description: description || null,
      order_index: orderIndex,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/admin/courses/${courseId}`);
  return { success: true, id: data.id };
}

export async function updateModuleAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const courseId = String(formData.get("course_id") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!id || !title) return { error: "Title is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("modules")
    .update({ title, description: description || null })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/admin/courses/${courseId}`);
  return { success: true };
}

export async function deleteModuleAction(moduleId: string, courseId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: slides } = await admin
    .from("slides")
    .select("image_path")
    .eq("module_id", moduleId);

  const paths = (slides ?? [])
    .map((s) => s.image_path)
    .filter((p): p is string => Boolean(p));

  if (paths.length) {
    await admin.storage.from("course-videos").remove(paths);
  }

  const { error } = await admin.from("modules").delete().eq("id", moduleId);
  if (error) return { error: error.message };

  const { data: remaining } = await admin
    .from("modules")
    .select("id")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  if (remaining?.length) {
    await Promise.all(
      remaining.map((m, index) =>
        admin.from("modules").update({ order_index: index }).eq("id", m.id)
      )
    );
  }

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/course/${courseId}`);
  return { success: true };
}

export async function reorderModulesAction(
  courseId: string,
  orderedIds: string[]
) {
  await requireAdmin();
  const supabase = await createClient();

  const updates = orderedIds.map((id, index) =>
    supabase.from("modules").update({ order_index: index }).eq("id", id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath(`/admin/courses/${courseId}`);
  return { success: true };
}
