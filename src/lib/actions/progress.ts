"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { isModuleUnlocked } from "@/lib/module-access";
import type { Progress } from "@/lib/types";

export async function saveSlideProgressAction(input: {
  moduleId: string;
  slideIndex: number;
  slideCount: number;
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
    .select("id, course_id")
    .eq("id", input.moduleId)
    .maybeSingle();

  if (!currentModule) return { error: "Module not found." };

  const { data: courseModules } = await supabase
    .from("modules")
    .select("id, order_index")
    .eq("course_id", currentModule.course_id)
    .order("order_index", { ascending: true });

  const moduleIds = (courseModules ?? []).map((m) => m.id);

  const { data: slideRows } = moduleIds.length
    ? await supabase
        .from("slides")
        .select("module_id")
        .in("module_id", moduleIds)
    : { data: [] as { module_id: string }[] };

  const slideCountByModule = new Map<string, number>();
  for (const row of slideRows ?? []) {
    slideCountByModule.set(
      row.module_id,
      (slideCountByModule.get(row.module_id) || 0) + 1
    );
  }

  const modulesWithCounts = (courseModules ?? []).map((m) => ({
    id: m.id,
    slide_count: slideCountByModule.get(m.id) || 0,
  }));

  if (!isAdmin) {
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
      modulesWithCounts,
      input.moduleId,
      progressByModule,
      false
    );

    if (!unlocked) {
      return { error: "Finish the previous module before continuing." };
    }
  }

  const slideCount = Math.max(0, input.slideCount);
  const slideIndex = Math.max(
    0,
    Math.min(slideCount > 0 ? slideCount - 1 : 0, input.slideIndex)
  );
  const watchedPercentage =
    slideCount <= 0
      ? 0
      : Math.min(100, Math.round(((slideIndex + 1) / slideCount) * 100));

  const completed =
    input.completed === true ||
    (slideCount > 0 && slideIndex >= slideCount - 1 && watchedPercentage >= 100);

  const { data: existing } = await supabase
    .from("progress")
    .select("last_position, watched_percentage, completed")
    .eq("user_id", userId)
    .eq("module_id", input.moduleId)
    .maybeSingle();

  const lastPosition = Math.max(
    existing?.last_position ?? 0,
    slideIndex
  );
  const bestPercentage = Math.max(
    existing?.watched_percentage ?? 0,
    watchedPercentage
  );

  const { error } = await supabase.from("progress").upsert(
    {
      user_id: userId,
      module_id: input.moduleId,
      watched_percentage: bestPercentage,
      last_position: lastPosition,
      completed: Boolean(existing?.completed) || completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,module_id" }
  );

  if (error) return { error: error.message };
  return {
    success: true,
    completed: Boolean(existing?.completed) || completed,
  };
}
