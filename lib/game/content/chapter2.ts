import type { GameScenario } from "../types";

/** Chapter 2 — Truth & Integrity (Levels 6–10). Map: market_district */
export const CHAPTER_2_SCENARIOS: GameScenario[] = [
  {
    id: "truth-01",
    levelNumber: 6,
    chapter: 2,
    sortOrder: 1,
    theme: "truth",
    title: "The Missing Credit",
    situation:
      "A project you helped finish is praised in the market square. The leader names only your teammate. Your teammate stays silent. Correcting them would feel awkward; staying silent would leave the record incomplete.",
    scriptureReference: "Proverbs 27:2",
    explanation:
      "Seeking praise can become pride, yet hiding the truth can become false humility that lets another carry a false story. Wisdom asks for honest credit without self-exaltation — and for teammates who will not steal what they did not earn.",
    reflectionPrompt:
      "How can you seek truth about credit without making the moment about your ego?",
    npcName: "Noah",
    npcId: "noah",
    mapId: "market_district",
    spawnX: 260,
    spawnZ: 280,
    mapSpot: "market",
    isActive: true,
    prerequisiteScenarioId: "integrity-test-01",
    choices: [
      {
        id: "truth-01-a",
        scenarioId: "truth-01",
        sortOrder: 1,
        choiceText: "Publicly demand recognition right away.",
        consequence:
          "You may get credit, but the confrontation damages trust. Truth spoken only to win applause can still wound.",
        isPreferred: false,
        xpReward: 12,
      },
      {
        id: "truth-01-b",
        scenarioId: "truth-01",
        sortOrder: 2,
        choiceText: "Say nothing and resent them privately.",
        consequence:
          "Silence grows into bitterness. Unspoken truth often becomes a heavier burden than a careful conversation.",
        isPreferred: false,
        xpReward: 16,
        flagsGranted: ["swallowed_credit_resentment"],
      },
      {
        id: "truth-01-c",
        scenarioId: "truth-01",
        sortOrder: 3,
        choiceText: "Speak privately with your teammate and seek an honest correction.",
        consequence:
          "The conversation is tense, but honesty has a chance to repair the record without a public spectacle.",
        isPreferred: true,
        xpReward: 34,
        flagsGranted: ["sought_honest_credit"],
      },
    ],
  },
  {
    id: "truth-02",
    levelNumber: 7,
    chapter: 2,
    sortOrder: 2,
    theme: "honesty",
    title: "The Hidden Mistake",
    situation:
      "While helping at a stall, you accidentally damage a display item. No one saw it. Reporting it means paying from your own money. Hiding it means someone else may be blamed later.",
    scriptureReference: "Psalm 15:2",
    explanation:
      "Walking blamelessly includes owning what we break. Confession can be costly in the short term, but hidden faults often expand into larger injustices when blame falls on the wrong person.",
    reflectionPrompt: "What makes admitting a quiet mistake feel so hard?",
    npcName: "Leah",
    npcId: "leah",
    mapId: "market_district",
    spawnX: 700,
    spawnZ: 320,
    mapSpot: "market",
    isActive: true,
    prerequisiteScenarioId: "truth-01",
    choices: [
      {
        id: "truth-02-a",
        scenarioId: "truth-02",
        sortOrder: 1,
        choiceText: "Hide the damage and leave quickly.",
        consequence:
          "You escape the cost for now. Later, another worker is questioned. Your relief turns into guilt.",
        isPreferred: false,
        xpReward: 10,
        flagsGranted: ["hid_market_damage"],
      },
      {
        id: "truth-02-b",
        scenarioId: "truth-02",
        sortOrder: 2,
        choiceText: "Leave anonymous coins without explaining.",
        consequence:
          "You try to fix the money problem without facing the relationship. Partial repair is better than none, but truth still matters.",
        isPreferred: false,
        xpReward: 20,
      },
      {
        id: "truth-02-c",
        scenarioId: "truth-02",
        sortOrder: 3,
        choiceText: "Admit the mistake and offer to make it right.",
        consequence:
          "The owner is surprised, then grateful. Honesty costs coins and earns trust that secrecy cannot buy.",
        isPreferred: true,
        xpReward: 36,
        flagsGranted: ["admitted_market_mistake"],
      },
    ],
  },
  {
    id: "truth-03",
    levelNumber: 8,
    chapter: 2,
    sortOrder: 3,
    theme: "academic_integrity",
    title: "Borrowed Words",
    situation:
      "You are asked to present a short speech. A friend offers a polished script that won praise last year and says, 'Just change a few lines. No one will remember.' Using it would save hours.",
    scriptureReference: "Colossians 3:9",
    explanation:
      "Presenting another person's work as your own is a form of falsehood. Diligence and honesty honor God more than impressive words that are not yours.",
    reflectionPrompt:
      "Where is the line between learning from others and claiming their work as yours?",
    npcName: "Caleb",
    npcId: "caleb",
    mapId: "market_district",
    spawnX: 480,
    spawnZ: 200,
    mapSpot: "square",
    isActive: true,
    prerequisiteScenarioId: "truth-02",
    choices: [
      {
        id: "truth-03-a",
        scenarioId: "truth-03",
        sortOrder: 1,
        choiceText: "Use the script and hope no one notices.",
        consequence:
          "Applause feels hollow. You know the praise belongs to someone else's labor.",
        isPreferred: false,
        xpReward: 10,
        flagsGranted: ["used_borrowed_speech"],
      },
      {
        id: "truth-03-b",
        scenarioId: "truth-03",
        sortOrder: 2,
        choiceText: "Use parts of it without saying where it came from.",
        consequence:
          "Partial honesty still misleads listeners about what you created. Integrity asks for clearer credit.",
        isPreferred: false,
        xpReward: 18,
      },
      {
        id: "truth-03-c",
        scenarioId: "truth-03",
        sortOrder: 3,
        choiceText: "Thank them, then write your own words honestly.",
        consequence:
          "Your speech is simpler, but it is yours. Truthfulness leaves you freer than borrowed brilliance.",
        isPreferred: true,
        xpReward: 36,
        flagsGranted: ["wrote_own_words"],
      },
    ],
  },
  {
    id: "truth-04",
    levelNumber: 9,
    chapter: 2,
    sortOrder: 4,
    theme: "honesty",
    title: "The Softened Report",
    situation:
      "A supervisor asks you to report how many supplies remain. The real number is low. A higher number would keep everyone calm for one more week. Your supervisor suggests, 'Round it up. We will fix it later.'",
    scriptureReference: "Proverbs 12:19",
    explanation:
      "False numbers create false security. Temporary comfort built on inaccurate reports often delays needed help and shifts pain onto others. Truthful lips endure; lying reports eventually collapse.",
    reflectionPrompt:
      "Have you ever softened a report to avoid short-term conflict? What happened later?",
    npcName: "Hannah",
    npcId: "hannah",
    mapId: "market_district",
    spawnX: 180,
    spawnZ: 420,
    mapSpot: "market",
    isActive: true,
    prerequisiteScenarioId: "truth-03",
    choices: [
      {
        id: "truth-04-a",
        scenarioId: "truth-04",
        sortOrder: 1,
        choiceText: "Inflate the number as suggested.",
        consequence:
          "Calm lasts a few days. When supplies run out, trust in the report system breaks harder.",
        isPreferred: false,
        xpReward: 12,
        flagsGranted: ["inflated_supply_report"],
      },
      {
        id: "truth-04-b",
        scenarioId: "truth-04",
        sortOrder: 2,
        choiceText: "Give a vague answer that avoids the real count.",
        consequence:
          "You avoid a direct lie and avoid a direct truth. Ambiguity still leaves leaders unprepared.",
        isPreferred: false,
        xpReward: 18,
      },
      {
        id: "truth-04-c",
        scenarioId: "truth-04",
        sortOrder: 3,
        choiceText: "Report the accurate count and explain the urgency.",
        consequence:
          "The conversation is uncomfortable. Planning can begin. Honesty serves the community better than soothing fiction.",
        isPreferred: true,
        xpReward: 38,
        flagsGranted: ["accurate_supply_report"],
      },
    ],
  },
  {
    id: "truth-test-01",
    levelNumber: 10,
    chapter: 2,
    sortOrder: 5,
    theme: "truth",
    title: "Truth Under Pressure",
    situation:
      "A visiting inspector asks who authorized an unsafe shortcut in the market storeroom. The person responsible is a mentor who helped you. They quietly ask you to keep their name out of it 'just this once,' promising it will never happen again.",
    scriptureReference: "Proverbs 28:13",
    scriptureReferences: ["Proverbs 28:13", "Ephesians 4:25"],
    explanation:
      "Loyalty becomes corrupted when it asks you to hide harm. Covering sin protects comfort, not people. Chapter 2's final challenge asks whether truth still matters when the person you respect wants silence.",
    reflectionPrompt:
      "How do you show loyalty to a mentor without joining them in covering wrong?",
    npcName: "Isaiah",
    npcId: "isaiah",
    mapId: "market_district",
    spawnX: 620,
    spawnZ: 450,
    mapSpot: "market",
    isActive: true,
    prerequisiteScenarioId: "truth-04",
    choices: [
      {
        id: "truth-test-01-a",
        scenarioId: "truth-test-01",
        sortOrder: 1,
        choiceText: "Protect your mentor and deny knowing anything.",
        consequence:
          "The unsafe practice continues. Your mentor's relief feels like a debt you now share.",
        isPreferred: false,
        xpReward: 14,
        flagsGranted: ["covered_mentor"],
      },
      {
        id: "truth-test-01-b",
        scenarioId: "truth-test-01",
        sortOrder: 2,
        choiceText: "Redirect the inspector without answering clearly.",
        consequence:
          "You delay accountability. Partial evasion still leaves the storeroom dangerous.",
        isPreferred: false,
        xpReward: 22,
      },
      {
        id: "truth-test-01-c",
        scenarioId: "truth-test-01",
        sortOrder: 3,
        choiceText: "Tell the truth and urge your mentor to take responsibility with you.",
        consequence:
          "The relationship strains. Safety improves. Truthful loyalty seeks restoration, not cover-ups.",
        isPreferred: true,
        xpReward: 42,
        flagsGranted: ["truth_under_pressure"],
      },
    ],
  },
];
