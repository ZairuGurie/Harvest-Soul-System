import type { GameScenario } from "../types";

/** Chapter 1 — Standing Firm (Levels 1–5). Preserves original scenario IDs. */
export const CHAPTER_1_SCENARIOS: GameScenario[] = [
  {
    id: "peer-pressure-01",
    levelNumber: 1,
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
    npcId: "jordan",
    mapId: "village_center",
    spawnX: 480,
    spawnZ: 220,
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
        xpReward: 8,
        flagsGranted: ["joined_harmful_joke"],
      },
      {
        id: "peer-pressure-01-b",
        scenarioId: "peer-pressure-01",
        sortOrder: 2,
        choiceText: "Stay silent and go along without speaking up.",
        consequence:
          "Silence can look peaceful, yet it can also allow harm to continue. Avoiding conflict is not the same as standing for what is right.",
        isPreferred: false,
        xpReward: 14,
        flagsGranted: ["silent_compliance"],
      },
      {
        id: "peer-pressure-01-c",
        scenarioId: "peer-pressure-01",
        sortOrder: 3,
        choiceText: "Respectfully refuse and stand by what you know is right.",
        consequence:
          "Some friends pull away, but your conscience is clear. You leave room for better friendship built on respect rather than pressure.",
        isPreferred: true,
        xpReward: 28,
        flagsGranted: ["refused_harmful_joke"],
      },
    ],
  },
  {
    id: "honesty-01",
    levelNumber: 2,
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
    npcId: "mira",
    mapId: "village_center",
    spawnX: 220,
    spawnZ: 400,
    mapSpot: "market",
    isActive: true,
    prerequisiteScenarioId: "peer-pressure-01",
    choices: [
      {
        id: "honesty-01-a",
        scenarioId: "honesty-01",
        sortOrder: 1,
        choiceText: "Keep the extra money. They will never notice.",
        consequence:
          "The coins feel heavier than they should. A private gain can still wound trust and dull your sensitivity to truth.",
        isPreferred: false,
        xpReward: 8,
        flagsGranted: ["kept_extra_change"],
      },
      {
        id: "honesty-01-b",
        scenarioId: "honesty-01",
        sortOrder: 2,
        choiceText: "Walk away quickly so you do not have to decide.",
        consequence:
          "Avoiding the decision leaves the wrong uncorrected. Honesty often requires a small, clear action.",
        isPreferred: false,
        xpReward: 14,
      },
      {
        id: "honesty-01-c",
        scenarioId: "honesty-01",
        sortOrder: 3,
        choiceText: "Return the extra change and explain the mistake.",
        consequence:
          "The seller is grateful. You keep a clean conscience and practice faithfulness in a quiet moment.",
        isPreferred: true,
        xpReward: 28,
        flagsGranted: ["returned_extra_change"],
      },
    ],
  },
  {
    id: "integrity-01",
    levelNumber: 3,
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
    npcId: "eli",
    mapId: "village_center",
    spawnX: 760,
    spawnZ: 380,
    mapSpot: "school",
    isActive: true,
    prerequisiteScenarioId: "honesty-01",
    choices: [
      {
        id: "integrity-01-a",
        scenarioId: "integrity-01",
        sortOrder: 1,
        choiceText: "Take the answers. You need every advantage.",
        consequence:
          "Fear of missing out pushes you toward deceit. The score may rise, but your peace and credibility fall.",
        isPreferred: false,
        xpReward: 8,
        flagsGranted: ["accepted_cheat_sheet"],
      },
      {
        id: "integrity-01-b",
        scenarioId: "integrity-01",
        sortOrder: 2,
        choiceText: "Decline the sheet but stay quiet about the offer.",
        consequence:
          "You avoid cheating yourself, yet the unfair system continues. Sometimes integrity also means protecting others from harm when you can do so wisely.",
        isPreferred: false,
        xpReward: 18,
      },
      {
        id: "integrity-01-c",
        scenarioId: "integrity-01",
        sortOrder: 3,
        choiceText: "Refuse the answers and prepare honestly.",
        consequence:
          "You choose a harder path that keeps your word trustworthy. Real readiness matters more than a stolen score.",
        isPreferred: true,
        xpReward: 30,
        flagsGranted: ["refused_cheat_sheet"],
      },
    ],
  },
  {
    id: "gossip-01",
    levelNumber: 4,
    chapter: 1,
    sortOrder: 4,
    theme: "gossip",
    title: "The Private Message",
    situation:
      "A friend shows you a private message meant to embarrass someone who is not present. They ask you to forward it to the group chat. 'It is only a joke,' they say, 'and everyone will forget tomorrow.'",
    scriptureReference: "Ephesians 4:29",
    explanation:
      "Words can build up or tear down. Sharing a private humiliation may feel like belonging in the moment, but it multiplies harm. Scripture calls believers to speech that gives grace to those who hear — including people who are not in the room.",
    reflectionPrompt:
      "How do you decide whether a 'joke' about someone is actually kindness or harm?",
    npcName: "Sam",
    npcId: "sam",
    mapId: "village_center",
    spawnX: 340,
    spawnZ: 300,
    mapSpot: "square",
    isActive: true,
    prerequisiteScenarioId: "integrity-01",
    choices: [
      {
        id: "gossip-01-a",
        scenarioId: "gossip-01",
        sortOrder: 1,
        choiceText: "Forward it. You do not want to seem boring.",
        consequence:
          "The message spreads quickly. Later you see the person's face and realize laughter can leave a lasting bruise.",
        isPreferred: false,
        xpReward: 10,
        flagsGranted: ["spread_private_message"],
      },
      {
        id: "gossip-01-b",
        scenarioId: "gossip-01",
        sortOrder: 2,
        choiceText: "Laugh quietly but do not forward it.",
        consequence:
          "You avoid spreading it, yet your silence still signals approval. Sometimes faithfulness requires a clear no.",
        isPreferred: false,
        xpReward: 16,
      },
      {
        id: "gossip-01-c",
        scenarioId: "gossip-01",
        sortOrder: 3,
        choiceText: "Refuse to share it and ask them to delete it.",
        consequence:
          "The moment feels awkward, but you protect someone's dignity. Courage often looks like a quiet refusal.",
        isPreferred: true,
        xpReward: 32,
        flagsGranted: ["protected_private_dignity"],
        nextScenarioId: "integrity-test-01",
      },
    ],
  },
  {
    id: "integrity-test-01",
    levelNumber: 5,
    chapter: 1,
    sortOrder: 5,
    theme: "integrity",
    title: "The Difficult Truth",
    situation:
      "A village leader asks whether you know who started a rumor that hurt a younger student. You know the answer involves people you care about. Staying quiet would keep your friendships comfortable. Speaking truthfully may cost you socially.",
    scriptureReference: "Zechariah 8:16",
    scriptureReferences: ["Zechariah 8:16", "Proverbs 12:17"],
    explanation:
      "Chapter 1 ends where integrity becomes costly. Truth-telling is not cruelty; silence that protects harm is not kindness. God calls His people to speak truth to one another — carefully, without revenge, and with a desire to restore rather than destroy.",
    reflectionPrompt:
      "When truth and comfort conflict, which one usually wins in your life — and why?",
    npcName: "Ruth",
    npcId: "ruth",
    mapId: "village_center",
    spawnX: 600,
    spawnZ: 260,
    mapSpot: "square",
    isActive: true,
    prerequisiteScenarioId: "gossip-01",
    choices: [
      {
        id: "integrity-test-01-a",
        scenarioId: "integrity-test-01",
        sortOrder: 1,
        choiceText: "Protect your friends and say you know nothing.",
        consequence:
          "The leader walks away without help. The younger student remains wounded, and your comfort feels thinner than you expected.",
        isPreferred: false,
        xpReward: 12,
        flagsGranted: ["hid_truth_from_leader"],
      },
      {
        id: "integrity-test-01-b",
        scenarioId: "integrity-test-01",
        sortOrder: 2,
        choiceText: "Hint vaguely without naming anyone.",
        consequence:
          "You give partial help while avoiding the hardest part. Half-truths often leave both justice and friendship unfinished.",
        isPreferred: false,
        xpReward: 20,
      },
      {
        id: "integrity-test-01-c",
        scenarioId: "integrity-test-01",
        sortOrder: 3,
        choiceText: "Tell the truth carefully, seeking repair rather than revenge.",
        consequence:
          "Some friendships cool. The leader can protect the student. You practice integrity that seeks healing, not status.",
        isPreferred: true,
        xpReward: 40,
        flagsGranted: ["spoke_costly_truth"],
      },
    ],
  },
];
