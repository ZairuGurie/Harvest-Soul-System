export type GameTheme =
  | "peer_pressure"
  | "honesty"
  | "academic_integrity"
  | "gossip"
  | "forgiveness"
  | "pride"
  | "money"
  | "relationships"
  | "faith_under_pressure"
  | "temptation"
  | "stewardship"
  | "humility"
  | "integrity"
  | "truth";

/** Chapter-scoped map ids — static environment geometry stays code-defined. */
export type GameMapId =
  | "village_center"
  | "market_district"
  | "school_yard"
  | "residential"
  | "countryside"
  | "forest"
  | "river_bridge"
  | "town_district"
  | "high_ground"
  | "final_grove";

export type GameChoice = {
  id: string;
  scenarioId: string;
  sortOrder: number;
  choiceText: string;
  consequence: string;
  isPreferred: boolean;
  xpReward: number;
  /** Optional branch: unlock / suggest this scenario next. */
  nextScenarioId?: string | null;
  /** Lightweight decision tags for later narrative gates (gameplay only). */
  flagsGranted?: string[];
};

export type GameScenario = {
  id: string;
  /** Global playable level number (1…N). Not spiritual rank. */
  levelNumber: number;
  chapter: number;
  sortOrder: number;
  theme: GameTheme | string;
  title: string;
  situation: string;
  scriptureReference: string;
  /** Optional additional verified references (comma-separated or array). */
  scriptureReferences?: string[];
  explanation: string;
  reflectionPrompt: string;
  npcName: string;
  npcId: string;
  mapId: GameMapId | string;
  /** World X spawn (map-local). */
  spawnX: number;
  /** World Z spawn (map-local). */
  spawnZ: number;
  /** Legacy / display alias for map region labels. */
  mapSpot: "square" | "market" | "school" | string;
  isActive: boolean;
  /** Must complete this scenario first (default: previous level). */
  prerequisiteScenarioId?: string | null;
  /** Must have made this choice previously to unlock. */
  requiredChoiceId?: string | null;
  /** Must hold these decision flags to unlock. */
  requiredFlags?: string[];
  choices: GameChoice[];
};

export type GameChapterDef = {
  id: number;
  title: string;
  subtitle: string;
  theme: string;
  mapId: GameMapId;
  /** Inclusive level range for this chapter. */
  levelStart: number;
  levelEnd: number;
};

export type GameAchievement = {
  id: string;
  name: string;
  description: string;
  /** Optional chapter gate for chapter-complete achievements. */
  chapterId?: number;
};

export type PlayerProgressState = {
  xp: number;
  /** Derived from XP curve — game progression only, not spiritual worth. */
  level: number;
  currentChapter: number;
  completedScenarioIds: string[];
  achievementIds: string[];
  /** scenarioId -> choiceId */
  choicesByScenario: Record<string, string>;
  /** Decision tags granted by choices (gameplay narrative gates). */
  decisionFlags: string[];
};

export type ScenarioResolveResult = {
  scenario: GameScenario;
  choice: GameChoice;
  xpEarned: number;
  xpTotal: number;
  level: number;
  leveledUp: boolean;
  newlyEarnedAchievements: GameAchievement[];
  alreadyCompleted: boolean;
  nextScenarioId: string | null;
  progress: PlayerProgressState;
};

export type LevelUnlockState = "locked" | "available" | "completed" | "current";

export type ChapterUnlockState = "locked" | "available" | "in_progress" | "completed";

export const EMPTY_PROGRESS: PlayerProgressState = {
  xp: 0,
  level: 1,
  currentChapter: 1,
  completedScenarioIds: [],
  achievementIds: [],
  choicesByScenario: {},
  decisionFlags: [],
};

/** Soft cap used for UI / future expansion — not a hard-coded end of content. */
export const TARGET_LEVEL_COUNT = 50;
export const LEVELS_PER_CHAPTER = 5;
export const TARGET_CHAPTER_COUNT = 10;
