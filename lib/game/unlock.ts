import type {
  ChapterUnlockState,
  GameScenario,
  LevelUnlockState,
  PlayerProgressState,
} from "./types";
import { GAME_CHAPTERS, getChapter } from "./chapters";

function hasPrerequisite(
  scenario: GameScenario,
  progress: PlayerProgressState,
  byLevel: Map<number, GameScenario>
): boolean {
  if (scenario.requiredChoiceId) {
    const made = Object.values(progress.choicesByScenario).includes(
      scenario.requiredChoiceId
    );
    if (!made) return false;
  }
  if (scenario.requiredFlags?.length) {
    const flags = new Set(progress.decisionFlags ?? []);
    if (!scenario.requiredFlags.every((f) => flags.has(f))) return false;
  }

  if (scenario.prerequisiteScenarioId) {
    return progress.completedScenarioIds.includes(scenario.prerequisiteScenarioId);
  }

  // Default linear unlock: level 1 open; else previous level number must be done
  if (scenario.levelNumber <= 1) return true;
  const prev = byLevel.get(scenario.levelNumber - 1);
  if (!prev) return true;
  return progress.completedScenarioIds.includes(prev.id);
}

export function isScenarioUnlocked(
  scenario: GameScenario,
  progress: PlayerProgressState,
  allScenarios: GameScenario[]
): boolean {
  if (!scenario.isActive) return false;
  const byLevel = new Map(
    allScenarios.filter((s) => s.isActive).map((s) => [s.levelNumber, s])
  );
  return hasPrerequisite(scenario, progress, byLevel);
}

export function levelUnlockState(
  scenario: GameScenario,
  progress: PlayerProgressState,
  allScenarios: GameScenario[]
): LevelUnlockState {
  if (progress.completedScenarioIds.includes(scenario.id)) return "completed";
  if (!isScenarioUnlocked(scenario, progress, allScenarios)) return "locked";

  const unlocked = allScenarios
    .filter((s) => s.isActive && isScenarioUnlocked(s, progress, allScenarios))
    .filter((s) => !progress.completedScenarioIds.includes(s.id))
    .sort((a, b) => a.levelNumber - b.levelNumber);
  if (unlocked[0]?.id === scenario.id) return "current";
  return "available";
}

export function chapterUnlockState(
  chapterId: number,
  progress: PlayerProgressState,
  allScenarios: GameScenario[]
): ChapterUnlockState {
  const chapter = getChapter(chapterId);
  if (!chapter) return "locked";

  const chapterScenarios = allScenarios.filter(
    (s) => s.chapter === chapterId && s.isActive
  );
  if (chapterScenarios.length === 0) {
    // Future chapters without content yet stay locked
    return "locked";
  }

  const completed = chapterScenarios.every((s) =>
    progress.completedScenarioIds.includes(s.id)
  );
  if (completed) return "completed";

  const anyUnlocked = chapterScenarios.some((s) =>
    isScenarioUnlocked(s, progress, allScenarios)
  );
  if (!anyUnlocked) return "locked";

  const anyDone = chapterScenarios.some((s) =>
    progress.completedScenarioIds.includes(s.id)
  );
  return anyDone ? "in_progress" : "available";
}

export function getCurrentPlayableScenario(
  progress: PlayerProgressState,
  allScenarios: GameScenario[]
): GameScenario | null {
  const candidates = allScenarios
    .filter((s) => s.isActive)
    .filter((s) => !progress.completedScenarioIds.includes(s.id))
    .filter((s) => isScenarioUnlocked(s, progress, allScenarios))
    .sort((a, b) => a.levelNumber - b.levelNumber);
  return candidates[0] ?? null;
}

export function buildJourneySummary(
  progress: PlayerProgressState,
  allScenarios: GameScenario[]
) {
  const current = getCurrentPlayableScenario(progress, allScenarios);
  const chapters = GAME_CHAPTERS.map((ch) => ({
    ...ch,
    state: chapterUnlockState(ch.id, progress, allScenarios),
    levels: allScenarios
      .filter((s) => s.chapter === ch.id && s.isActive)
      .sort((a, b) => a.levelNumber - b.levelNumber)
      .map((s) => ({
        id: s.id,
        levelNumber: s.levelNumber,
        title: s.title,
        state: levelUnlockState(s, progress, allScenarios),
        npcName: s.npcName,
        scriptureReference: s.scriptureReference,
        theme: s.theme,
      })),
  }));

  return {
    currentScenario: current
      ? { id: current.id, levelNumber: current.levelNumber, title: current.title }
      : null,
    chapters,
  };
}
