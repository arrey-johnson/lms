"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import {
  COMPLETION_THRESHOLD,
  isModuleUnlocked,
} from "@/lib/module-access";
import type { Progress } from "@/lib/types";

export async function saveProgressAction(input: {
  moduleId: string;
  watchedPercentage: number;
  lastPosition: number;
  completed?: boolean;
}) {
  const { profile, userId } = await getCurrentProfile();
  if (!userId || !profile || profile.disabled) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const isAdmin = profile.role === "admin";

  const { data: currentModule } = await supabase
    .from("modules")
    .select("id, course_id, video_path")
    .eq("id", input.moduleId)
    .maybeSingle();

  if (!currentModule) return { error: "Module not found." };

  if (!isAdmin) {
    const { data: courseModules } = await supabase
      .from("modules")
      .select("id, video_path, order_index")
      .eq("course_id", currentModule.course_id)
      .order("order_index", { ascending: true });

    const moduleIds = (courseModules ?? []).map((m) => m.id);
    const { data: progressRows } = moduleIds.length
      ? await supabase
          .from("progress")
          .select("*")
          .eq("user_id", userId)
          .in("module_id", moduleIds)
      : { data: [] as Progress[] };

    const progressByModule = new Map(
      (progressRows ?? []).map((p) => [p.module_id, p as Progress])
    );

    const unlocked = isModuleUnlocked(
      courseModules ?? [],
      input.moduleId,
      progressByModule,
      false
    );

    if (!unlocked) {
      return { error: "Finish the previous module before continuing." };
    }
  }

  const watchedPercentage = Math.min(
    100,
    Math.max(0, input.watchedPercentage)
  );
  const completed =
    input.completed === true || watchedPercentage >= COMPLETION_THRESHOLD;

  const { error } = await supabase.from("progress").upsert(
    {
      user_id: userId,
      module_id: input.moduleId,
      watched_percentage: watchedPercentage,
      last_position: Math.max(0, input.lastPosition),
      completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,module_id" }
  );

  if (error) return { error: error.message };
  return { success: true, completed };
}
