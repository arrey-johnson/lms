"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurriculum } from "@/content/ai-foundations-module-1";

function parsePriceCents(formData: FormData): number | { error: string } {
  const raw = String(formData.get("price") || "").trim();
  const dollars = Number.parseFloat(raw);
  if (!Number.isFinite(dollars) || dollars <= 0) {
    return { error: "Price must be greater than $0 — courses are not free." };
  }
  return Math.round(dollars * 100);
}

function missingCurriculumColumn(message: string) {
  return /curriculum_slug|schema cache/i.test(message);
}

function courseWriteError(message: string) {
  if (missingCurriculumColumn(message)) {
    return "Run supabase/tutor.sql in the Supabase SQL editor, then save again.";
  }
  return message;
}

function parseCurriculumSlug(formData: FormData) {
  const slug = String(formData.get("curriculum_slug") || "").trim();
  if (!slug) return null;
  if (!getCurriculum(slug)) return { error: "Unknown teaching format." };
  return slug;
}

export async function createCourseAction(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priceCents = parsePriceCents(formData);
  const curriculumSlug = parseCurriculumSlug(formData);

  if (!title) return { error: "Title is required." };
  if (typeof priceCents === "object") return priceCents;
  if (curriculumSlug && typeof curriculumSlug === "object") return curriculumSlug;

  const supabase = await createClient();
  const details = {
    title,
    description: description || null,
    price_cents: priceCents,
  };
  let { data, error } = await supabase
    .from("courses")
    .insert({ ...details, curriculum_slug: curriculumSlug })
    .select("id")
    .single();

  if (error && !curriculumSlug && missingCurriculumColumn(error.message)) {
    const retry = await supabase.from("courses").insert(details).select("id").single();
    data = retry.data;
    error = retry.error;
  }

  if (error) return { error: courseWriteError(error.message) };
  if (!data) return { error: "Could not create the course." };

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
  const curriculumSlug = parseCurriculumSlug(formData);

  if (!id || !title) return { error: "Title is required." };
  if (typeof priceCents === "object") return priceCents;
  if (curriculumSlug && typeof curriculumSlug === "object") return curriculumSlug;

  const supabase = await createClient();
  const details = {
    title,
    description: description || null,
    price_cents: priceCents,
  };
  let { error } = await supabase
    .from("courses")
    .update({ ...details, curriculum_slug: curriculumSlug })
    .eq("id", id);

  if (error && !curriculumSlug && missingCurriculumColumn(error.message)) {
    const retry = await supabase.from("courses").update(details).eq("id", id);
    error = retry.error;
  }

  if (error) return { error: courseWriteError(error.message) };

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
