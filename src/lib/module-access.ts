import type { Module, Progress } from "@/lib/types";

/** Consider a module fully watched near the end (or when the player fires ended). */
export const COMPLETION_THRESHOLD = 95;

export function isModuleCompleted(progress?: Progress | null) {
  return Boolean(progress?.completed);
}

/**
 * A module is unlocked when every earlier module is either completed
 * or has no video yet (so students aren't blocked by empty slots).
 */
export function isModuleUnlocked(
  modules: Pick<Module, "id" | "video_path">[],
  moduleId: string,
  progressByModuleId: Map<string, Progress | null | undefined>,
  bypass = false
) {
  if (bypass) return true;

  const index = modules.findIndex((m) => m.id === moduleId);
  if (index <= 0) return true;

  for (let i = 0; i < index; i++) {
    const prev = modules[i];
    if (!prev.video_path) continue;
    if (!isModuleCompleted(progressByModuleId.get(prev.id))) {
      return false;
    }
  }
  return true;
}
