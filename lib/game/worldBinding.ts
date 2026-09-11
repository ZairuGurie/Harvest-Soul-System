import type { GameScenario } from "./types";

export type WorldNpcBinding = {
  id: string;
  scenarioId: string;
  name: string;
  x: number;
  y: number;
  color: number;
  mapId: string;
  levelNumber: number;
  status: "available" | "completed" | "locked";
};

const NPC_PALETTE = [
  0x2f6fed, 0x1f9d6c, 0xc9972a, 0xb45309, 0x7c3aed, 0x0f766e, 0xbe185d, 0x334155,
  0x0369a1, 0x4d7c0f, 0xa16207, 0x9f1239, 0x1d4ed8, 0x047857, 0x9333ea,
];

function colorForNpc(npcId: string, index: number): number {
  let hash = 0;
  for (let i = 0; i < npcId.length; i++) hash = (hash * 31 + npcId.charCodeAt(i)) | 0;
  return NPC_PALETTE[Math.abs(hash + index) % NPC_PALETTE.length]!;
}

/**
 * Build NPC world placements from scenario content for a given map.
 * Replaces hard-coded NPCS arrays as the source of truth.
 */
export function buildNpcBindingsForMap(
  mapId: string,
  scenarios: GameScenario[],
  opts: {
    completedScenarioIds: string[];
    isUnlocked: (scenario: GameScenario) => boolean;
  }
): WorldNpcBinding[] {
  const list = scenarios
    .filter((s) => s.isActive && s.mapId === mapId)
    .sort((a, b) => a.levelNumber - b.levelNumber);

  return list.map((s, index) => {
    const completed = opts.completedScenarioIds.includes(s.id);
    const unlocked = opts.isUnlocked(s);
    return {
      id: s.npcId || s.id,
      scenarioId: s.id,
      name: s.npcName,
      x: s.spawnX,
      y: s.spawnZ,
      color: colorForNpc(s.npcId || s.id, index),
      mapId: s.mapId,
      levelNumber: s.levelNumber,
      status: completed ? "completed" : unlocked ? "available" : "locked",
    };
  });
}

export function defaultPlayerSpawn(mapId: string): { x: number; z: number } {
  switch (mapId) {
    case "market_district":
      return { x: 480, z: 520 };
    case "school_yard":
      return { x: 480, z: 500 };
    case "residential":
      return { x: 460, z: 510 };
    case "countryside":
      return { x: 480, z: 540 };
    case "forest":
      return { x: 500, z: 520 };
    case "river_bridge":
      return { x: 480, z: 500 };
    case "town_district":
      return { x: 480, z: 520 };
    case "high_ground":
      return { x: 480, z: 540 };
    case "final_grove":
      return { x: 480, z: 520 };
    case "village_center":
    default:
      return { x: 480, z: 500 };
  }
}
