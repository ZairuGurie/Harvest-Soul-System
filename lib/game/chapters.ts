import type { GameChapterDef, GameMapId } from "./types";
import { LEVELS_PER_CHAPTER, TARGET_CHAPTER_COUNT } from "./types";

/**
 * Canonical chapter catalog for STAND FIRM.
 * Level ranges are derived — avoid hard-coding "if level === 50" elsewhere.
 */
export const GAME_CHAPTERS: GameChapterDef[] = [
  {
    id: 1,
    title: "Standing Firm",
    subtitle: "Village Path",
    theme: "integrity",
    mapId: "village_center",
    levelStart: 1,
    levelEnd: 5,
  },
  {
    id: 2,
    title: "Truth & Integrity",
    subtitle: "Market District",
    theme: "truth",
    mapId: "market_district",
    levelStart: 6,
    levelEnd: 10,
  },
  {
    id: 3,
    title: "Peer Pressure",
    subtitle: "School Yard",
    theme: "peer_pressure",
    mapId: "school_yard",
    levelStart: 11,
    levelEnd: 15,
  },
  {
    id: 4,
    title: "Temptation",
    subtitle: "Residential Paths",
    theme: "temptation",
    mapId: "residential",
    levelStart: 16,
    levelEnd: 20,
  },
  {
    id: 5,
    title: "Relationships",
    subtitle: "Countryside",
    theme: "relationships",
    mapId: "countryside",
    levelStart: 21,
    levelEnd: 25,
  },
  {
    id: 6,
    title: "Pride & Humility",
    subtitle: "Forest Paths",
    theme: "humility",
    mapId: "forest",
    levelStart: 26,
    levelEnd: 30,
  },
  {
    id: 7,
    title: "Money & Stewardship",
    subtitle: "River Crossing",
    theme: "stewardship",
    mapId: "river_bridge",
    levelStart: 31,
    levelEnd: 35,
  },
  {
    id: 8,
    title: "Forgiveness & Conflict",
    subtitle: "Town District",
    theme: "forgiveness",
    mapId: "town_district",
    levelStart: 36,
    levelEnd: 40,
  },
  {
    id: 9,
    title: "Faith Under Pressure",
    subtitle: "High Ground",
    theme: "faith_under_pressure",
    mapId: "high_ground",
    levelStart: 41,
    levelEnd: 45,
  },
  {
    id: 10,
    title: "The Test of Faithfulness",
    subtitle: "Final Grove",
    theme: "faith_under_pressure",
    mapId: "final_grove",
    levelStart: 46,
    levelEnd: 50,
  },
];

export function getChapter(id: number): GameChapterDef | undefined {
  return GAME_CHAPTERS.find((c) => c.id === id);
}

export function chapterForLevel(levelNumber: number): GameChapterDef | undefined {
  return GAME_CHAPTERS.find(
    (c) => levelNumber >= c.levelStart && levelNumber <= c.levelEnd
  );
}

export function mapIdForChapter(chapterId: number): GameMapId {
  return getChapter(chapterId)?.mapId ?? "village_center";
}

export function expectedLevelCount(): number {
  return TARGET_CHAPTER_COUNT * LEVELS_PER_CHAPTER;
}
