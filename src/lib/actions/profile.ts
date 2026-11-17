"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

function revalidateAccountPaths() {
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/course", "layout");
}

export async function updateProfileAction(formData: FormData) {
  const { profile, userId } = await getCurrentProfile();
  if (!userId || !profile || profile.disabled) {
    return { error: "Unauthorized" };
  }

  const fullName = String(formData.get("full_name") || "").trim();
  if (!fullName) {
    return { error: "Full name is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidateAccountPaths();
  return { success: true };
}

export async function updateAvatarAction(input: {
  avatarUrl: string | null;
}) {
  const { profile, userId } = await getCurrentProfile();
  if (!userId || !profile || profile.disabled) {
    return { error: "Unauthorized" };
  }

  const avatarUrl =
    input.avatarUrl === null ? null : input.avatarUrl?.trim() || null;

  if (
    avatarUrl &&
    !avatarUrl.includes("/storage/v1/object/public/avatars/")
  ) {
    return { error: "Invalid profile photo." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidateAccountPaths();
  return { success: true, avatarUrl };
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

export async function enrollInCourseAction(_courseId: string) {
  return {
    error:
      "Courses are paid. Pay with mobile money from the course checkout page.",
  };
}
