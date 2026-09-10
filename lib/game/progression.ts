import type { GameAchievement, PlayerProgressState } from "./types";
import { SEED_ACHIEVEMENTS } from "./content";

/** XP thresholds are game progression only — not spiritual worth. */
const XP_PER_LEVEL = 50;

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
}

export function xpIntoLevel(xp: number): { level: number; into: number; need: number } {
  const level = levelFromXp(xp);
  const base = (level - 1) * XP_PER_LEVEL;
  return { level, into: xp - base, need: XP_PER_LEVEL };
}

export function evaluateAchievements(
  progress: PlayerProgressState,
  scenarioId: string,
  theme: string,
  chapterScenarioIds: string[]
): GameAchievement[] {
  const earned = new Set(progress.achievementIds);
  const newly: GameAchievement[] = [];

  const tryEarn = (id: string) => {
    if (earned.has(id)) return;
    const def = SEED_ACHIEVEMENTS.find((a) => a.id === id);
    if (!def) return;
    earned.add(id);
    newly.push(def);
  };

  if (progress.completedScenarioIds.length === 0) {
    tryEarn("first_stand");
  }
  if (theme === "peer_pressure" || scenarioId.startsWith("peer-pressure")) {
    tryEarn("peer_pressure");
  }
  if (theme === "honesty" || scenarioId.startsWith("honesty")) {
    tryEarn("honest_heart");
  }

  const completed = new Set([...progress.completedScenarioIds, scenarioId]);
  if (chapterScenarioIds.every((id) => completed.has(id))) {
    tryEarn("chapter_one");
  }

  return newly;
}

export function applyChoiceToProgress(
  progress: PlayerProgressState,
  args: {
    scenarioId: string;
    choiceId: string;
    xpReward: number;
    theme: string;
    chapterScenarioIds: string[];
  }
): {
  next: PlayerProgressState;
  xpEarned: number;
  leveledUp: boolean;
  alreadyCompleted: boolean;
  newlyEarnedAchievements: GameAchievement[];
} {
  const alreadyCompleted = progress.completedScenarioIds.includes(args.scenarioId);
  if (alreadyCompleted) {
    return {
      next: progress,
      xpEarned: 0,
      leveledUp: false,
      alreadyCompleted: true,
      newlyEarnedAchievements: [],
    };
  }

  const xpEarned = Math.max(0, args.xpReward);
  const xpTotal = progress.xp + xpEarned;
  const prevLevel = progress.level;
  const level = levelFromXp(xpTotal);
  const newlyEarnedAchievements = evaluateAchievements(
    progress,
    args.scenarioId,
    args.theme,
    args.chapterScenarioIds
  );

  const next: PlayerProgressState = {
    xp: xpTotal,
    level,
    currentChapter: progress.currentChapter,
    completedScenarioIds: [...progress.completedScenarioIds, args.scenarioId],
    achievementIds: [
      ...progress.achievementIds,
      ...newlyEarnedAchievements.map((a) => a.id),
    ],
    choicesByScenario: {
      ...progress.choicesByScenario,
      [args.scenarioId]: args.choiceId,
    },
  };

  return {
    next,
    xpEarned,
    leveledUp: level > prevLevel,
    alreadyCompleted: false,
    newlyEarnedAchievements,
  };
}
