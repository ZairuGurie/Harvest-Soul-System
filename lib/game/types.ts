export type GameTheme =
  | "peer_pressure"
  | "honesty"
  | "academic_integrity"
  | "gossip"
  | "forgiveness"
  | "pride"
  | "money"
  | "relationships"
  | "faith_under_pressure";

export type GameChoice = {
  id: string;
  scenarioId: string;
  sortOrder: number;
  choiceText: string;
  consequence: string;
  isPreferred: boolean;
  xpReward: number;
};

export type GameScenario = {
  id: string;
  chapter: number;
  sortOrder: number;
  theme: GameTheme | string;
  title: string;
  situation: string;
  scriptureReference: string;
  explanation: string;
  reflectionPrompt: string;
  npcName: string;
  mapSpot: "square" | "market" | "school" | string;
  isActive: boolean;
  choices: GameChoice[];
};

export type GameAchievement = {
  id: string;
  name: string;
  description: string;
};

export type PlayerProgressState = {
  xp: number;
  level: number;
  currentChapter: number;
  completedScenarioIds: string[];
  achievementIds: string[];
  /** scenarioId -> choiceId */
  choicesByScenario: Record<string, string>;
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
};

export const EMPTY_PROGRESS: PlayerProgressState = {
  xp: 0,
  level: 1,
  currentChapter: 1,
  completedScenarioIds: [],
  achievementIds: [],
  choicesByScenario: {},
};
