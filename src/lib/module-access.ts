import type { Module, Progress } from "@/lib/types";

/** Module is complete when the learner finishes the slide deck. */
export const COMPLETION_THRESHOLD = 100;

export function isModuleCompleted(progress?: Progress | null) {
  return Boolean(progress?.completed);
}

type ModuleGate = Pick<Module, "id"> & { slide_count?: number };

/**
 * A module is unlocked when every earlier module is either completed
 * or has no slides yet (so empty modules don't block the path).
 */
export function isModuleUnlocked(
  modules: ModuleGate[],
  moduleId: string,
  progressByModuleId: Map<string, Progress | null | undefined>,
  bypass = false
) {
  if (bypass) return true;

  const index = modules.findIndex((m) => m.id === moduleId);
  if (index <= 0) return true;

  for (let i = 0; i < index; i++) {
    const prev = modules[i];
    const slideCount = prev.slide_count ?? 0;
    if (slideCount <= 0) continue;
    if (!isModuleCompleted(progressByModuleId.get(prev.id))) {
      return false;
    }
  }
  return true;
}
