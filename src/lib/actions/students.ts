"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createStudentAction(formData: FormData) {
  await requireAdmin();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const courseIds = formData.getAll("course_ids").map(String).filter(Boolean);

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const admin = createAdminClient();

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "student",
      },
    });

  if (authError || !authData.user) {
    return { error: authError?.message || "Failed to create user." };
  }

  const userId = authData.user.id;

  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    email,
    full_name: fullName || null,
    role: "student",
    disabled: false,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return { error: profileError.message };
  }

  if (courseIds.length) {
    const rows = courseIds.map((course_id) => ({
      user_id: userId,
      course_id,
    }));
    const { error: enrollError } = await admin.from("enrollments").insert(rows);
    if (enrollError) {
      return {
        error: `Student created but enrollment failed: ${enrollError.message}`,
      };
    }
  }

  revalidatePath("/admin/students");
  return { success: true };
}

export async function updateStudentEnrollmentsAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("user_id") || "");
  const courseIds = formData.getAll("course_ids").map(String).filter(Boolean);

  if (!userId) return { error: "Missing student." };

  const admin = createAdminClient();
  await admin.from("enrollments").delete().eq("user_id", userId);

  if (courseIds.length) {
    const { error } = await admin.from("enrollments").insert(
      courseIds.map((course_id) => ({ user_id: userId, course_id }))
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/students");
  return { success: true };
}

export async function setStudentDisabledAction(
  userId: string,
  disabled: boolean
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ disabled })
    .eq("id", userId)
    .eq("role", "student");

  if (error) return { error: error.message };

  revalidatePath("/admin/students");
  return { success: true };
}

export async function deleteStudentAction(userId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/students");
  return { success: true };
}
