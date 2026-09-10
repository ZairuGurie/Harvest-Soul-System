import type { PlayerProgressState } from "@/lib/game/types";
import { EMPTY_PROGRESS } from "@/lib/game/types";

const STORAGE_KEY = "harvest-souls-stand-firm-v1";

export function loadLocalProgress(): PlayerProgressState {
  if (typeof window === "undefined") return { ...EMPTY_PROGRESS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<PlayerProgressState>;
    return {
      xp: Number(parsed.xp) || 0,
      level: Number(parsed.level) || 1,
      currentChapter: Number(parsed.currentChapter) || 1,
      completedScenarioIds: Array.isArray(parsed.completedScenarioIds)
        ? parsed.completedScenarioIds.map(String)
        : [],
      achievementIds: Array.isArray(parsed.achievementIds)
        ? parsed.achievementIds.map(String)
        : [],
      choicesByScenario:
        parsed.choicesByScenario && typeof parsed.choicesByScenario === "object"
          ? (parsed.choicesByScenario as Record<string, string>)
          : {},
    };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

export function saveLocalProgress(progress: PlayerProgressState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore quota / private mode failures.
  }
}
