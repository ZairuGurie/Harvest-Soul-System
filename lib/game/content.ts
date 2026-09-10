import type { GameAchievement, GameScenario } from "./types";

/** Authoritative seed used when DB is unavailable; mirrors migration seed. */
export const SEED_ACHIEVEMENTS: GameAchievement[] = [
  {
    id: "first_stand",
    name: "First Stand",
    description: "Completed your first STAND FIRM scenario.",
  },
  {
    id: "peer_pressure",
    name: "Unmoved",
    description: "Stood firm under peer pressure.",
  },
  {
    id: "honest_heart",
    name: "Honest Heart",
    description: "Chose honesty when it cost something.",
  },
  {
    id: "chapter_one",
    name: "Village Path",
    description: "Completed every Chapter 1 scenario.",
  },
];

export const SEED_SCENARIOS: GameScenario[] = [
  {
    id: "peer-pressure-01",
    chapter: 1,
    sortOrder: 1,
    theme: "peer_pressure",
    title: "The Shortcut",
    situation:
      "Your friends gather near the village square and urge you to join a plan that would hurt another person's reputation for a laugh. They say everyone is doing it and you will look weak if you refuse.",
    scriptureReference: "Proverbs 1:10",
    explanation:
      "Friendship is a gift, but true friends do not require you to abandon what is right. Standing firm may feel lonely for a moment, yet integrity builds trust that shortcuts cannot give. God invites us to refuse invitations to harm others, even when the crowd insists.",
    reflectionPrompt:
      "Where in your life do you feel pressure to go along with something you know is wrong?",
    npcName: "Jordan",
    mapSpot: "square",
    isActive: true,
    choices: [
      {
        id: "peer-pressure-01-a",
        scenarioId: "peer-pressure-01",
        sortOrder: 1,
        choiceText: "Join them so you will not be rejected.",
        consequence:
          "You feel included for a moment, but unease follows. Participating in harm distances you from the kind of friendship God values.",
        isPreferred: false,
        xpReward: 5,
      },
      {
        id: "peer-pressure-01-b",
        scenarioId: "peer-pressure-01",
        sortOrder: 2,
        choiceText: "Stay silent and go along without speaking up.",
        consequence:
          "Silence can look peaceful, yet it can also allow harm to continue. Avoiding conflict is not the same as standing for what is right.",
        isPreferred: false,
        xpReward: 10,
      },
      {
        id: "peer-pressure-01-c",
        scenarioId: "peer-pressure-01",
        sortOrder: 3,
        choiceText: "Respectfully refuse and stand by what you know is right.",
        consequence:
          "Some friends pull away, but your conscience is clear. You leave room for better friendship built on respect rather than pressure.",
        isPreferred: true,
        xpReward: 25,
      },
    ],
  },
  {
    id: "honesty-01",
    chapter: 1,
    sortOrder: 2,
    theme: "honesty",
    title: "Extra Change",
    situation:
      "At the market stall you are handed more money back than you should receive. No one else notices. Keeping it would be easy, and you could use the extra coins.",
    scriptureReference: "Proverbs 11:1",
    explanation:
      "Honesty is not only about big decisions. Small private moments reveal the direction of the heart. Returning what is not yours honors God and protects both your conscience and the other person's livelihood.",
    reflectionPrompt: "What would help you choose honesty when no one is watching?",
    npcName: "Mira",
    mapSpot: "market",
    isActive: true,
    choices: [
      {
        id: "honesty-01-a",
        scenarioId: "honesty-01",
        sortOrder: 1,
        choiceText: "Keep the extra money. They will never notice.",
        consequence:
          "The coins feel heavier than they should. A private gain can still wound trust and dull your sensitivity to truth.",
        isPreferred: false,
        xpReward: 5,
      },
      {
        id: "honesty-01-b",
        scenarioId: "honesty-01",
        sortOrder: 2,
        choiceText: "Walk away quickly so you do not have to decide.",
        consequence:
          "Avoiding the decision leaves the wrong uncorrected. Honesty often requires a small, clear action.",
        isPreferred: false,
        xpReward: 10,
      },
      {
        id: "honesty-01-c",
        scenarioId: "honesty-01",
        sortOrder: 3,
        choiceText: "Return the extra change and explain the mistake.",
        consequence:
          "The seller is grateful. You keep a clean conscience and practice faithfulness in a quiet moment.",
        isPreferred: true,
        xpReward: 25,
      },
    ],
  },
  {
    id: "integrity-01",
    chapter: 1,
    sortOrder: 3,
    theme: "academic_integrity",
    title: "The Easy Answer",
    situation:
      "Before a community quiz that matters for a scholarship recommendation, a classmate offers you the answer sheet. They say the leaders will never know and that you deserve the help.",
    scriptureReference: "Proverbs 12:22",
    explanation:
      "Integrity means telling the truth with your actions as well as your words. A reward gained by deceit is fragile. Choosing fairness may cost short-term advantage, but it keeps your character whole before God and others.",
    reflectionPrompt: "Why might a quick dishonest win become a heavier burden later?",
    npcName: "Eli",
    mapSpot: "school",
    isActive: true,
    choices: [
      {
        id: "integrity-01-a",
        scenarioId: "integrity-01",
        sortOrder: 1,
        choiceText: "Take the answers. You need every advantage.",
        consequence:
          "Fear of missing out pushes you toward deceit. The score may rise, but your peace and credibility fall.",
        isPreferred: false,
        xpReward: 5,
      },
      {
        id: "integrity-01-b",
        scenarioId: "integrity-01",
        sortOrder: 2,
        choiceText: "Decline the sheet but stay quiet about the offer.",
        consequence:
          "You avoid cheating yourself, yet the unfair system continues. Sometimes integrity also means protecting others from harm when you can do so wisely.",
        isPreferred: false,
        xpReward: 15,
      },
      {
        id: "integrity-01-c",
        scenarioId: "integrity-01",
        sortOrder: 3,
        choiceText: "Refuse the answers and prepare honestly.",
        consequence:
          "You choose a harder path that keeps your word trustworthy. Real readiness matters more than a stolen score.",
        isPreferred: true,
        xpReward: 25,
      },
    ],
  },
];

export function getSeedScenario(id: string): GameScenario | null {
  return SEED_SCENARIOS.find((s) => s.id === id) ?? null;
}

export function listSeedScenarios(chapter?: number): GameScenario[] {
  return SEED_SCENARIOS.filter(
    (s) => s.isActive && (chapter == null || s.chapter === chapter)
  ).sort((a, b) => a.sortOrder - b.sortOrder);
}
