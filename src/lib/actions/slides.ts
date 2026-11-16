"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function revalidateCourse(courseId: string) {
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/course/${courseId}`);
  revalidatePath("/dashboard");
}

export async function createSlideAction(formData: FormData) {
  await requireAdmin();
  const moduleId = String(formData.get("module_id") || "");
  const courseId = String(formData.get("course_id") || "");
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!moduleId || !courseId) return { error: "Missing module." };
  if (!body && !title) return { error: "Add a slide title or body." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("slides")
    .select("order_index")
    .eq("module_id", moduleId)
    .order("order_index", { ascending: false })
    .limit(1);

  const orderIndex = (existing?.[0]?.order_index ?? -1) + 1;

  const { error } = await supabase.from("slides").insert({
    module_id: moduleId,
    title: title || null,
    body: body || "",
    order_index: orderIndex,
  });

  if (error) return { error: error.message };

  await revalidateCourse(courseId);
  return { success: true };
}

export async function updateSlideAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const courseId = String(formData.get("course_id") || "");
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!id) return { error: "Missing slide." };
  if (!body && !title) return { error: "Add a slide title or body." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("slides")
    .update({
      title: title || null,
      body: body || "",
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await revalidateCourse(courseId);
  return { success: true };
}

export async function deleteSlideAction(
  slideId: string,
  courseId: string
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: slide } = await admin
    .from("slides")
    .select("image_path, module_id")
    .eq("id", slideId)
    .single();

  if (slide?.image_path) {
    await admin.storage.from("course-videos").remove([slide.image_path]);
  }

  const { error } = await admin.from("slides").delete().eq("id", slideId);
  if (error) return { error: error.message };

  if (slide?.module_id) {
    const { data: remaining } = await admin
      .from("slides")
      .select("id")
      .eq("module_id", slide.module_id)
      .order("order_index", { ascending: true });

    if (remaining?.length) {
      await Promise.all(
        remaining.map((s, index) =>
          admin.from("slides").update({ order_index: index }).eq("id", s.id)
        )
      );
    }
  }

  await revalidateCourse(courseId);
  return { success: true };
}

export async function reorderSlidesAction(
  moduleId: string,
  courseId: string,
  orderedIds: string[]
) {
  await requireAdmin();
  const supabase = await createClient();

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("slides").update({ order_index: index }).eq("id", id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  await revalidateCourse(courseId);
  return { success: true };
}

export async function attachSlideImageAction(input: {
  courseId: string;
  slideId: string;
  path: string;
}) {
  await requireAdmin();
  const { courseId, slideId, path } = input;
  if (!courseId || !slideId || !path) {
    return { error: "Missing slide or path." };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("slides")
    .select("image_path")
    .eq("id", slideId)
    .single();

  const { error } = await admin
    .from("slides")
    .update({ image_path: path })
    .eq("id", slideId);

  if (error) return { error: error.message };

  if (existing?.image_path && existing.image_path !== path) {
    await admin.storage.from("course-videos").remove([existing.image_path]);
  }

  await revalidateCourse(courseId);
  return { success: true };
}
