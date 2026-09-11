import type { GameAchievement } from "../types";

/** Game achievements only — not spiritual rankings. */
export const SEED_ACHIEVEMENTS: GameAchievement[] = [
  {
    id: "first_stand",
    name: "First Stand",
    description: "Completed your first STAND FIRM scenario.",
  },
  {
    id: "peer_pressure",
    name: "Unmoved",
    description: "Completed a peer-pressure scenario.",
  },
  {
    id: "honest_heart",
    name: "Honest Heart",
    description: "Completed an honesty scenario.",
  },
  {
    id: "chapter_one",
    name: "Village Path",
    description: "Completed every Chapter 1 scenario.",
    chapterId: 1,
  },
  {
    id: "chapter_1",
    name: "Standing Firm",
    description: "Finished Chapter 1 — Standing Firm.",
    chapterId: 1,
  },
  {
    id: "chapter_2",
    name: "Truth Walker",
    description: "Finished Chapter 2 — Truth & Integrity.",
    chapterId: 2,
  },
  {
    id: "chapter_3",
    name: "Courage Under Pressure",
    description: "Finished Chapter 3 — Peer Pressure.",
    chapterId: 3,
  },
  {
    id: "truth_teller",
    name: "Truth Teller",
    description: "Completed truth and integrity scenarios.",
  },
  {
    id: "courage_under_pressure",
    name: "Courage Under Pressure",
    description: "Stood firm through peer-pressure challenges.",
  },
  {
    id: "humble_heart",
    name: "Humble Heart",
    description: "Completed humility-related scenarios.",
  },
  {
    id: "faithful_steward",
    name: "Faithful Steward",
    description: "Completed stewardship scenarios.",
  },
  {
    id: "forgiving_heart",
    name: "Forgiving Heart",
    description: "Completed forgiveness scenarios.",
  },
  {
    id: "stand_firm",
    name: "STAND FIRM",
    description: "Completed the STAND FIRM journey content available in this release.",
  },
];
