import type { GraphicsQuality } from "@/lib/game/quality";
import type { WorldNpcBinding } from "@/lib/game/worldBinding";

export type NpcSpot = {
  id: string;
  scenarioId: string;
  name: string;
  x: number;
  y: number;
  color: number;
  status?: "available" | "completed" | "locked";
};

export type StandFirmBootData = {
  mapId: string;
  npcs: NpcSpot[];
  playerSpawn?: { x: number; z: number };
  completedScenarioIds: string[];
  graphicsQuality?: GraphicsQuality;
  onInteract: (scenarioId: string, npcName: string) => void;
  onNearbyChange?: (nearby: { scenarioId: string; name: string } | null) => void;
  /** When false, keyboard movement is ignored so keys can serve site/browser UI. */
  isInputActive?: () => boolean;
  onReady?: () => void;
  onError?: (message: string) => void;
};

export const WORLD = {
  width: 960,
  height: 640,
  tile: 32,
};

/** @deprecated Use scenario-driven bindings from lib/game/worldBinding. Kept for legacy imports. */
export const NPCS: NpcSpot[] = [
  {
    id: "jordan",
    scenarioId: "peer-pressure-01",
    name: "Jordan",
    x: 480,
    y: 220,
    color: 0x2f6fed,
  },
  {
    id: "mira",
    scenarioId: "honesty-01",
    name: "Mira",
    x: 220,
    y: 400,
    color: 0x1f9d6c,
  },
  {
    id: "eli",
    scenarioId: "integrity-01",
    name: "Eli",
    x: 760,
    y: 380,
    color: 0xc9972a,
  },
];

export function npcSpotsFromBindings(bindings: WorldNpcBinding[]): NpcSpot[] {
  return bindings.map((b) => ({
    id: b.id,
    scenarioId: b.scenarioId,
    name: b.name,
    x: b.x,
    y: b.y,
    color: b.color,
    status: b.status,
  }));
}
