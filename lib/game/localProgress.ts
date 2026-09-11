import type { PlayerProgressState } from "@/lib/game/types";
import { EMPTY_PROGRESS } from "@/lib/game/types";
import { normalizeProgress } from "@/lib/game/merge";

const STORAGE_KEY = "harvest-souls-stand-firm-v1";

export function loadLocalProgress(): PlayerProgressState {
  if (typeof window === "undefined") return { ...EMPTY_PROGRESS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<PlayerProgressState>;
    return normalizeProgress(parsed);
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

export function clearLocalProgress() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
