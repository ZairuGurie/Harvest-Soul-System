import type { GameScenario } from "../types";

/** Chapter 3 — Peer Pressure (Levels 11–15). Map: school_yard */
export const CHAPTER_3_SCENARIOS: GameScenario[] = [
  {
    id: "pressure-01",
    levelNumber: 11,
    chapter: 3,
    sortOrder: 1,
    theme: "peer_pressure",
    title: "The After-Class Dare",
    situation:
      "After lessons, classmates dare you to mock a quiet student's project in front of everyone. They say it is tradition and that refusing means you think you are better than the group.",
    scriptureReference: "Romans 12:2",
    explanation:
      "Fitting in is not the same as being transformed. Groups can normalize cruelty by calling it tradition. Faithfulness may look like stepping out of a pattern others refuse to question.",
    reflectionPrompt:
      "Which 'traditions' in your circles might actually be pressure to harm?",
    npcName: "Talia",
    npcId: "talia",
    mapId: "school_yard",
    spawnX: 300,
    spawnZ: 260,
    mapSpot: "school",
    isActive: true,
    prerequisiteScenarioId: "truth-test-01",
    choices: [
      {
        id: "pressure-01-a",
        scenarioId: "pressure-01",
        sortOrder: 1,
        choiceText: "Join the dare so you are not excluded.",
        consequence:
          "You gain acceptance from the group. The quiet student withdraws. Later, a different opportunity for trust becomes harder to earn.",
        isPreferred: false,
        xpReward: 12,
        flagsGranted: ["joined_mocking_dare"],
        nextScenarioId: "pressure-02",
      },
      {
        id: "pressure-01-b",
        scenarioId: "pressure-01",
        sortOrder: 2,
        choiceText: "Laugh along but do not speak the mockery yourself.",
        consequence:
          "You feel safer than joining fully, yet your laughter still adds weight to the harm.",
        isPreferred: false,
        xpReward: 18,
        flagsGranted: ["laughed_at_dare"],
      },
      {
        id: "pressure-01-c",
        scenarioId: "pressure-01",
        sortOrder: 3,
        choiceText: "Respectfully refuse and stand with the student.",
        consequence:
          "You may feel isolated at first. Your refusal opens a quieter friendship and a different path through later pressure.",
        isPreferred: true,
        xpReward: 36,
        flagsGranted: ["refused_mocking_dare"],
      },
    ],
  },
  {
    id: "pressure-02",
    levelNumber: 12,
    chapter: 3,
    sortOrder: 2,
    theme: "peer_pressure",
    title: "The Exclusive Invite",
    situation:
      "A popular circle invites you to an evening gathering — if you stop spending time with a friend they call 'awkward.' They frame it as 'just being selective.'",
    scriptureReference: "James 2:1",
    explanation:
      "Favoritism dressed as social strategy still wounds image-bearers of God. Belonging that requires discarding a friend is a costly ticket. Scripture warns against judging people by status and popularity.",
    reflectionPrompt:
      "Have you ever been asked to drop someone to keep a social place? What did you do?",
    npcName: "Marcus",
    npcId: "marcus",
    mapId: "school_yard",
    spawnX: 680,
    spawnZ: 300,
    mapSpot: "school",
    isActive: true,
    prerequisiteScenarioId: "pressure-01",
    choices: [
      {
        id: "pressure-02-a",
        scenarioId: "pressure-02",
        sortOrder: 1,
        choiceText: "Accept and distance yourself from your friend.",
        consequence:
          "The new circle feels exciting. Your friend notices. Later you realize acceptance bought with betrayal is unstable.",
        isPreferred: false,
        xpReward: 12,
        flagsGranted: ["dropped_friend_for_status"],
      },
      {
        id: "pressure-02-b",
        scenarioId: "pressure-02",
        sortOrder: 2,
        choiceText: "Try to keep both groups without telling anyone.",
        consequence:
          "You stretch yourself thin and become less honest with everyone. Dual loyalty without integrity eventually snaps.",
        isPreferred: false,
        xpReward: 18,
      },
      {
        id: "pressure-02-c",
        scenarioId: "pressure-02",
        sortOrder: 3,
        choiceText: "Decline the condition and keep the friendship.",
        consequence:
          "You lose a status invite. You keep a real friend. Integrity sometimes chooses the quieter table.",
        isPreferred: true,
        xpReward: 36,
        flagsGranted: ["kept_loyal_friendship"],
      },
    ],
  },
  {
    id: "pressure-03",
    levelNumber: 13,
    chapter: 3,
    sortOrder: 3,
    theme: "temptation",
    title: "The Shared Shortcut",
    situation:
      "Before a timed challenge, several classmates share a prohibited device that gives answers. They say, 'Everyone who matters is using it. Teachers never check this corner.'",
    scriptureReference: "1 Corinthians 10:13",
    explanation:
      "Common practice does not make a practice righteous. Temptation often argues from majority and secrecy. God provides ways to endure — including the courage to lose an unfair advantage.",
    reflectionPrompt:
      "When 'everyone is doing it,' what helps you remember that majority is not morality?",
    npcName: "Priya",
    npcId: "priya",
    mapId: "school_yard",
    spawnX: 420,
    spawnZ: 420,
    mapSpot: "school",
    isActive: true,
    prerequisiteScenarioId: "pressure-02",
    choices: [
      {
        id: "pressure-03-a",
        scenarioId: "pressure-03",
        sortOrder: 1,
        choiceText: "Use the device so you are not left behind.",
        consequence:
          "Your score rises. Your confidence in your own preparation falls. The shortcut trains dependence, not skill.",
        isPreferred: false,
        xpReward: 12,
        flagsGranted: ["used_prohibited_device"],
      },
      {
        id: "pressure-03-b",
        scenarioId: "pressure-03",
        sortOrder: 2,
        choiceText: "Refuse for yourself but stay near the group using it.",
        consequence:
          "You avoid direct cheating, yet remaining close can still look like endorsement and keep pressure alive.",
        isPreferred: false,
        xpReward: 20,
      },
      {
        id: "pressure-03-c",
        scenarioId: "pressure-03",
        sortOrder: 3,
        choiceText: "Refuse, move away, and prepare without the device.",
        consequence:
          "You may finish lower on the board. You keep a clear conscience and practice resisting majority temptation.",
        isPreferred: true,
        xpReward: 38,
        flagsGranted: ["refused_prohibited_device"],
      },
    ],
  },
  {
    id: "pressure-04",
    levelNumber: 14,
    chapter: 3,
    sortOrder: 4,
    theme: "peer_pressure",
    title: "The Silent Majority",
    situation:
      "In a group discussion, a false rumor about a teacher spreads. Most students nod along. One student looks uneasy but says nothing. The leader asks, 'We all agree, right?' Eyes turn toward you.",
    scriptureReference: "Proverbs 18:17",
    explanation:
      "The first story sounds convincing until another is heard. A silent majority can still be wrong. Standing firm may mean asking for fairness when agreement is being assumed, not proven.",
    reflectionPrompt:
      "What stops you from speaking when a group treats an unverified story as fact?",
    npcName: "Daniel",
    npcId: "daniel",
    mapId: "school_yard",
    spawnX: 560,
    spawnZ: 220,
    mapSpot: "school",
    isActive: true,
    prerequisiteScenarioId: "pressure-03",
    choices: [
      {
        id: "pressure-04-a",
        scenarioId: "pressure-04",
        sortOrder: 1,
        choiceText: "Agree with the group to keep the peace.",
        consequence:
          "The rumor hardens. Peace bought by false agreement often costs someone's reputation.",
        isPreferred: false,
        xpReward: 12,
        flagsGranted: ["agreed_with_false_rumor"],
      },
      {
        id: "pressure-04-b",
        scenarioId: "pressure-04",
        sortOrder: 2,
        choiceText: "Stay silent and hope it passes.",
        consequence:
          "You avoid conflict and also avoid courage. Silence can function as consent.",
        isPreferred: false,
        xpReward: 18,
      },
      {
        id: "pressure-04-c",
        scenarioId: "pressure-04",
        sortOrder: 3,
        choiceText: "Ask for evidence and refuse to treat rumor as fact.",
        consequence:
          "The mood cools. A few students look relieved. Truth-seeking can interrupt a crowd's momentum.",
        isPreferred: true,
        xpReward: 40,
        flagsGranted: ["challenged_false_rumor"],
      },
    ],
  },
  {
    id: "pressure-test-01",
    levelNumber: 15,
    chapter: 3,
    sortOrder: 5,
    theme: "peer_pressure",
    title: "Standing Alone",
    situation:
      "The popular group plans a public prank that will humiliate a staff member who once corrected them. They say anyone who reports it is a traitor. You know when and where it will happen. Staying silent keeps your place. Warning someone may leave you standing alone.",
    scriptureReference: "Joshua 1:9",
    scriptureReferences: ["Joshua 1:9", "Galatians 1:10"],
    explanation:
      "Chapter 3 culminates in lonely courage. Seeking approval from people can become a master. Faithfulness is not reckless confrontation; it is refusing to partner with planned humiliation — even when courage feels isolating. God does not measure your worth by your social rank in a crowd.",
    reflectionPrompt:
      "If standing firm meant losing a social place for a week, would you still do it? Why or why not?",
    npcName: "Grace",
    npcId: "grace",
    mapId: "school_yard",
    spawnX: 480,
    spawnZ: 360,
    mapSpot: "school",
    isActive: true,
    prerequisiteScenarioId: "pressure-04",
    choices: [
      {
        id: "pressure-test-01-a",
        scenarioId: "pressure-test-01",
        sortOrder: 1,
        choiceText: "Stay silent to keep your place in the group.",
        consequence:
          "The prank proceeds. You keep short-term acceptance. A staff member is shamed, and your silence becomes part of the story.",
        isPreferred: false,
        xpReward: 14,
        flagsGranted: ["silent_during_prank"],
      },
      {
        id: "pressure-test-01-b",
        scenarioId: "pressure-test-01",
        sortOrder: 2,
        choiceText: "Hint that they should be careful without clearly warning anyone.",
        consequence:
          "You try to reduce harm without risking yourself fully. Ambiguous warnings often arrive too late.",
        isPreferred: false,
        xpReward: 24,
      },
      {
        id: "pressure-test-01-c",
        scenarioId: "pressure-test-01",
        sortOrder: 3,
        choiceText: "Warn a trusted adult in time and accept the social cost.",
        consequence:
          "You may stand alone for a season. Harm is prevented. Standing firm is not spiritual superiority — it is choosing faithfulness when approval is expensive.",
        isPreferred: true,
        xpReward: 45,
        flagsGranted: ["warned_to_prevent_harm"],
      },
    ],
  },
];
