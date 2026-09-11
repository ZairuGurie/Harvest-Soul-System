import type { GameAchievement, GameScenario, PlayerProgressState } from "./types";
import { TARGET_LEVEL_COUNT } from "./types";
import { SEED_ACHIEVEMENTS } from "./content/achievements";
import { GAME_CHAPTERS } from "./chapters";

/**
 * XP curve for TARGET_LEVEL_COUNT levels.
 * Completing ~50 preferred choices (~28–40 XP each) reaches the final band
 * without absurd totals or instant leveling.
 *
 * XP / levels are game progression only — not spiritual worth.
 */
function buildXpThresholds(maxLevel: number): number[] {
  const thresholds = [0, 0]; // index = level; level 1 requires 0
  let total = 0;
  for (let level = 2; level <= maxLevel + 1; level++) {
    const prev = level - 1;
    // Cost to advance from `prev` → `prev+1`
    const base = 28;
    const ramp = prev * 0.55;
    const decade = Math.floor((prev - 1) / 10) * 6;
    const cost = Math.round(base + ramp + decade);
    total += cost;
    thresholds[level] = total;
  }
  return thresholds;
}

/** Cumulative XP required to *reach* each level index. Extensible beyond 50. */
export const XP_TO_REACH_LEVEL = buildXpThresholds(TARGET_LEVEL_COUNT);

export function xpToReachLevel(level: number): number {
  if (level <= 1) return 0;
  if (level < XP_TO_REACH_LEVEL.length) return XP_TO_REACH_LEVEL[level]!;
  // Extrapolate beyond curated curve for future expansion
  const last = XP_TO_REACH_LEVEL.length - 1;
  const lastXp = XP_TO_REACH_LEVEL[last]!;
  const extraLevels = level - last;
  const avgStep = Math.round(
    (XP_TO_REACH_LEVEL[last]! - XP_TO_REACH_LEVEL[last - 1]!) * 1.05
  );
  return lastXp + extraLevels * Math.max(40, avgStep);
}

export function levelFromXp(xp: number): number {
  const safe = Math.max(0, xp);
  let level = 1;
  while (xpToReachLevel(level + 1) <= safe) {
    level += 1;
    if (level > 500) break; // hard safety, not a content cap
  }
  return level;
}

export function xpIntoLevel(xp: number): { level: number; into: number; need: number } {
  const level = levelFromXp(xp);
  const base = xpToReachLevel(level);
  const next = xpToReachLevel(level + 1);
  return { level, into: xp - base, need: Math.max(1, next - base) };
}

/** Recalculate XP as sum of authoritative choice rewards for completed scenarios. */
export function deriveXpFromCompletions(
  choicesByScenario: Record<string, string>,
  scenarios: GameScenario[]
): number {
  let xp = 0;
  const byId = new Map(scenarios.map((s) => [s.id, s]));
  for (const [scenarioId, choiceId] of Object.entries(choicesByScenario)) {
    const scenario = byId.get(scenarioId);
    const choice = scenario?.choices.find((c) => c.id === choiceId);
    if (choice) xp += Math.max(0, choice.xpReward);
  }
  return xp;
}

export function evaluateAchievements(
  progress: PlayerProgressState,
  scenario: GameScenario,
  allScenarios: GameScenario[]
): GameAchievement[] {
  const earned = new Set(progress.achievementIds);
  const newly: GameAchievement[] = [];
  const completed = new Set([...progress.completedScenarioIds, scenario.id]);

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

  const theme = scenario.theme;
  if (theme === "peer_pressure" || scenario.id.startsWith("peer-pressure")) {
    tryEarn("peer_pressure");
  }
  if (theme === "honesty" || scenario.id.startsWith("honesty")) {
    tryEarn("honest_heart");
  }
  if (theme === "truth" || theme === "academic_integrity") {
    tryEarn("truth_teller");
  }
  if (theme === "humility" || theme === "pride") {
    tryEarn("humble_heart");
  }
  if (theme === "stewardship" || theme === "money") {
    tryEarn("faithful_steward");
  }
  if (theme === "forgiveness") {
    tryEarn("forgiving_heart");
  }
  if (theme === "faith_under_pressure") {
    tryEarn("courage_under_pressure");
  }

  for (const chapter of GAME_CHAPTERS) {
    const chapterIds = allScenarios
      .filter((s) => s.chapter === chapter.id && s.isActive)
      .map((s) => s.id);
    if (chapterIds.length > 0 && chapterIds.every((id) => completed.has(id))) {
      tryEarn(`chapter_${chapter.id}`);
      if (chapter.id === 1) tryEarn("chapter_one"); // legacy alias
      if (chapter.id === 3) tryEarn("courage_under_pressure");
    }
  }

  const activeIds = allScenarios.filter((s) => s.isActive).map((s) => s.id);
  if (activeIds.length > 0 && activeIds.every((id) => completed.has(id))) {
    tryEarn("stand_firm");
  }

  // If curated content reaches TARGET_LEVEL_COUNT completions
  const completedLevels = allScenarios.filter(
    (s) => s.isActive && completed.has(s.id)
  ).length;
  if (completedLevels >= TARGET_LEVEL_COUNT) {
    tryEarn("stand_firm");
  }

  return newly;
}

export function applyChoiceToProgress(
  progress: PlayerProgressState,
  args: {
    scenario: GameScenario;
    choiceId: string;
    xpReward: number;
    allScenarios: GameScenario[];
  }
): {
  next: PlayerProgressState;
  xpEarned: number;
  leveledUp: boolean;
  alreadyCompleted: boolean;
  newlyEarnedAchievements: GameAchievement[];
  nextScenarioId: string | null;
} {
  const alreadyCompleted = progress.completedScenarioIds.includes(args.scenario.id);
  if (alreadyCompleted) {
    return {
      next: progress,
      xpEarned: 0,
      leveledUp: false,
      alreadyCompleted: true,
      newlyEarnedAchievements: [],
      nextScenarioId: null,
    };
  }

  const choice = args.scenario.choices.find((c) => c.id === args.choiceId);
  const xpEarned = Math.max(0, args.xpReward);
  const xpTotal = progress.xp + xpEarned;
  const prevLevel = progress.level;
  const level = levelFromXp(xpTotal);
  const newlyEarnedAchievements = evaluateAchievements(
    progress,
    args.scenario,
    args.allScenarios
  );

  const newFlags = [
    ...new Set([
      ...(progress.decisionFlags ?? []),
      ...(choice?.flagsGranted ?? []),
    ]),
  ];

  const completedScenarioIds = [...progress.completedScenarioIds, args.scenario.id];
  const chapterCompleted = args.allScenarios
    .filter((s) => s.chapter === args.scenario.chapter && s.isActive)
    .every((s) => completedScenarioIds.includes(s.id));

  const next: PlayerProgressState = {
    xp: xpTotal,
    level,
    currentChapter: chapterCompleted
      ? Math.max(progress.currentChapter, args.scenario.chapter + 1)
      : Math.max(progress.currentChapter, args.scenario.chapter),
    completedScenarioIds,
    achievementIds: [
      ...progress.achievementIds,
      ...newlyEarnedAchievements.map((a) => a.id),
    ],
    choicesByScenario: {
      ...progress.choicesByScenario,
      [args.scenario.id]: args.choiceId,
    },
    decisionFlags: newFlags,
  };

  return {
    next,
    xpEarned,
    leveledUp: level > prevLevel,
    alreadyCompleted: false,
    newlyEarnedAchievements,
    nextScenarioId: choice?.nextScenarioId ?? null,
  };
}
