import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getCurrentProfile(): Promise<{
  profile: Profile | null;
  userId: string | null;
}> {
  const { supabase, user } = await getSessionUser();
  if (!user) return { profile: null, userId: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { profile: profile as Profile | null, userId: user.id };
}

export async function requireAdmin() {
  const { profile, userId } = await getCurrentProfile();
  if (!userId || !profile || profile.role !== "admin" || profile.disabled) {
    redirect("/login");
  }
  return { profile, userId };
}

export async function requireStudent() {
  const { profile, userId } = await getCurrentProfile();
  if (!userId || !profile || profile.disabled) {
    redirect("/login");
  }
  if (profile.role === "admin") {
    // Allow admins into course preview; dashboard redirects via middleware
    return { profile, userId };
  }
  if (profile.role !== "student") {
    redirect("/login");
  }
  return { profile, userId };
}
