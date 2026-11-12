"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export async function updateProfileAction(formData: FormData) {
  const { profile, userId } = await getCurrentProfile();
  if (!userId || !profile || profile.disabled) {
    return { error: "Unauthorized" };
  }

  const fullName = String(formData.get("full_name") || "").trim();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName || null })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { success: true };
}

export async function updatePasswordAction(formData: FormData) {
  const { profile, userId } = await getCurrentProfile();
  if (!userId || !profile || profile.disabled) {
    return { error: "Unauthorized" };
  }

  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm_password") || "");

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { success: true };
}

export async function enrollInCourseAction(courseId: string) {
  const { profile, userId } = await getCurrentProfile();
  if (!userId || !profile || profile.disabled) {
    return { error: "Unauthorized" };
  }
  if (profile.role === "admin") {
    return { error: "Admins do not need to enroll." };
  }
  if (!courseId) return { error: "Missing course." };

  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").insert({
    user_id: userId,
    course_id: courseId,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: true };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/course/${courseId}`);
  return { success: true };
}
