import type { GameScenario, PlayerProgressState } from "./types";
import { EMPTY_PROGRESS } from "./types";
import { deriveXpFromCompletions, levelFromXp } from "./progression";

/**
 * Deterministic guest ↔ cloud merge.
 * Never sum guest XP + cloud XP. XP is derived from authoritative completions.
 *
 * Conflict rule for choices:
 * - Cloud choice wins when both completed the same scenario
 *   (authenticated record is authoritative).
 * - Union of completed scenarios and achievements otherwise.
 */
export function mergeGuestAndCloudProgress(
  guest: PlayerProgressState | null | undefined,
  cloud: PlayerProgressState | null | undefined,
  allScenarios: GameScenario[]
): PlayerProgressState {
  const g = guest ?? EMPTY_PROGRESS;
  const c = cloud ?? EMPTY_PROGRESS;

  const choicesByScenario: Record<string, string> = {
    ...g.choicesByScenario,
    ...c.choicesByScenario, // cloud overwrites conflicts
  };

  const completedScenarioIds = [
    ...new Set([...g.completedScenarioIds, ...c.completedScenarioIds]),
  ];

  const achievementIds = [
    ...new Set([...g.achievementIds, ...c.achievementIds]),
  ];

  const decisionFlags = [
    ...new Set([...(g.decisionFlags ?? []), ...(c.decisionFlags ?? [])]),
  ];

  const xp = deriveXpFromCompletions(choicesByScenario, allScenarios);
  const level = levelFromXp(xp);

  const maxChapter = Math.max(g.currentChapter || 1, c.currentChapter || 1);
  let currentChapter = maxChapter;
  for (const scenario of allScenarios) {
    if (completedScenarioIds.includes(scenario.id)) {
      currentChapter = Math.max(currentChapter, scenario.chapter);
    }
  }

  return {
    xp,
    level,
    currentChapter,
    completedScenarioIds,
    achievementIds,
    choicesByScenario,
    decisionFlags,
  };
}

export function normalizeProgress(
  partial: Partial<PlayerProgressState> | null | undefined
): PlayerProgressState {
  if (!partial) return { ...EMPTY_PROGRESS };
  return {
    xp: Number(partial.xp) || 0,
    level: Number(partial.level) || 1,
    currentChapter: Number(partial.currentChapter) || 1,
    completedScenarioIds: Array.isArray(partial.completedScenarioIds)
      ? partial.completedScenarioIds.map(String)
      : [],
    achievementIds: Array.isArray(partial.achievementIds)
      ? partial.achievementIds.map(String)
      : [],
    choicesByScenario:
      partial.choicesByScenario && typeof partial.choicesByScenario === "object"
        ? (partial.choicesByScenario as Record<string, string>)
        : {},
    decisionFlags: Array.isArray(partial.decisionFlags)
      ? partial.decisionFlags.map(String)
      : [],
  };
}
