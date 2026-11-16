"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function parsePriceCents(formData: FormData): number | { error: string } {
  const raw = String(formData.get("price") || "").trim();
  const dollars = Number.parseFloat(raw);
  if (!Number.isFinite(dollars) || dollars <= 0) {
    return { error: "Price must be greater than $0 — courses are not free." };
  }
  return Math.round(dollars * 100);
}

export async function createCourseAction(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priceCents = parsePriceCents(formData);

  if (!title) return { error: "Title is required." };
  if (typeof priceCents === "object") return priceCents;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({
      title,
      description: description || null,
      price_cents: priceCents,
    })
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
  const priceCents = parsePriceCents(formData);

  if (!id || !title) return { error: "Title is required." };
  if (typeof priceCents === "object") return priceCents;

  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update({
      title,
      description: description || null,
      price_cents: priceCents,
    })
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
    admin.from("modules").select("id").eq("course_id", courseId),
  ]);

  const moduleIds = (modules ?? []).map((m) => m.id);
  const { data: slides } = moduleIds.length
    ? await admin.from("slides").select("image_path").in("module_id", moduleIds)
    : { data: [] as { image_path: string | null }[] };

  const paths = [
    course?.thumbnail_path,
    ...(slides ?? []).map((s) => s.image_path),
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
