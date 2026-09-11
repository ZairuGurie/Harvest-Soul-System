import type { GameScenario } from "./types";
import { SEED_ACHIEVEMENTS } from "./content/achievements";
import { CHAPTER_1_SCENARIOS } from "./content/chapter1";
import { CHAPTER_2_SCENARIOS } from "./content/chapter2";
import { CHAPTER_3_SCENARIOS } from "./content/chapter3";

export { SEED_ACHIEVEMENTS } from "./content/achievements";

/**
 * Authoritative seed used when DB is unavailable; mirrors migrations.
 * Chapters 4–10 content can be added as separate modules without rewriting this barrel.
 */
export const SEED_SCENARIOS: GameScenario[] = [
  ...CHAPTER_1_SCENARIOS,
  ...CHAPTER_2_SCENARIOS,
  ...CHAPTER_3_SCENARIOS,
];

export function getSeedScenario(id: string): GameScenario | null {
  return SEED_SCENARIOS.find((s) => s.id === id) ?? null;
}

export function listSeedScenarios(chapter?: number): GameScenario[] {
  return SEED_SCENARIOS.filter(
    (s) => s.isActive && (chapter == null || s.chapter === chapter)
  ).sort((a, b) => a.levelNumber - b.levelNumber || a.sortOrder - b.sortOrder);
}

export function listSeedScenariosByMap(mapId: string): GameScenario[] {
  return SEED_SCENARIOS.filter((s) => s.isActive && s.mapId === mapId).sort(
    (a, b) => a.levelNumber - b.levelNumber
  );
}

export { CHAPTER_1_SCENARIOS, CHAPTER_2_SCENARIOS, CHAPTER_3_SCENARIOS };
