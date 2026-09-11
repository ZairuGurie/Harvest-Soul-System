import * as THREE from "three";
import { WORLD, type StandFirmBootData, type NpcSpot } from "./standFirmConfig";
import { clearStandFirmInput, GAME_CONTROL_CODES, standFirmInput } from "./standFirmInput";
import {
  NPC_LOOKS,
  PLAYER_LOOK,
  createPersonFigure,
  updatePersonMotion,
  setPersonTalking,
  type PersonRig,
} from "./standFirmCharacters";
import { buildVillage, mapDisplayName } from "./standFirmVillage";
import { getGraphicsPreset } from "@/lib/game/quality";

export { standFirmInput } from "./standFirmInput";

type NpcVisual = {
  scenarioId: string;
  root: THREE.Group;
  rig: PersonRig;
  ring: THREE.Mesh;
  labelSprite: THREE.Sprite;
  name: string;
  status: "available" | "completed" | "locked";
  idlePhase: number;
  x: number;
  z: number;
};

const PLAYER_SPEED = 160;
const INTERACT_RADIUS = 56;
const PLAYER_RADIUS = 14;

function makeLabelSprite(text: string, bg = "rgba(255,255,255,0.88)", color = "#0b1220") {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = bg;
  const radius = 10;
  const x = 8;
  const y = 10;
  const w = canvas.width - 16;
  const h = canvas.height - 20;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - 28);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(70, 18, 1);
  sprite.center.set(0.5, 0);
  return sprite;
}

function updateLabelSprite(sprite: THREE.Sprite, text: string, bg?: string, color?: string) {
  const map = sprite.material.map as THREE.CanvasTexture;
  const canvas = map.image as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = bg ?? "rgba(255,255,255,0.88)";
  const radius = 10;
  const x = 8;
  const y = 10;
  const w = canvas.width - 16;
  const h = canvas.height - 20;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color ?? "#0b1220";
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - 28);
  map.needsUpdate = true;
}

function statusStyle(status: NpcVisual["status"]): { bg: string; color: string; ring: number } {
  if (status === "completed") {
    return { bg: "rgba(16,185,129,0.92)", color: "#ecfdf5", ring: 0xf0c14a };
  }
  if (status === "locked") {
    return { bg: "rgba(71,85,105,0.88)", color: "#e2e8f0", ring: 0x64748b };
  }
  return { bg: "rgba(255,255,255,0.88)", color: "#0b1220", ring: 0xffffff };
}

function collides(
  x: number,
  z: number,
  blockers: { minX: number; maxX: number; minZ: number; maxZ: number }[]
) {
  for (const b of blockers) {
    if (x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ) return true;
  }
  return false;
}

export type StandFirmGameHandle = {
  destroy: (removeCanvas?: boolean) => void;
  setLocked: (locked: boolean) => void;
  markCompleted: (scenarioId: string) => void;
  /** Refresh all NPC locked/available/completed visuals from current progress. */
  syncNpcStatuses: (
    statuses: Record<string, "available" | "completed" | "locked">
  ) => void;
  focusNpc: (scenarioId: string | null) => void;
  setGraphicsQuality: (quality: "low" | "medium" | "high") => void;
};

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

export function createStandFirmGame(
  parent: HTMLElement,
  boot: StandFirmBootData
): StandFirmGameHandle {
  if (!webglAvailable()) {
    boot.onError?.(
      "STAND FIRM requires WebGL-enabled browser graphics. Please use a modern browser or device."
    );
    return {
      destroy() {},
      setLocked() {},
      markCompleted() {},
      syncNpcStatuses() {},
      focusNpc() {},
      setGraphicsQuality() {},
    };
  }

  const preset = getGraphicsPreset(boot.graphicsQuality);
  const mapId = boot.mapId || "village_center";
  const npcList: NpcSpot[] = boot.npcs?.length ? boot.npcs : [];

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 1, 2800);
  const renderer = new THREE.WebGLRenderer({
    antialias: preset.antialias,
    alpha: false,
    powerPreference: preset.quality === "low" ? "low-power" : "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, preset.pixelRatioCap));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = preset.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  parent.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xdcecff, 0x5c7a45, 0.75);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.35);
  sun.position.set(320, 480, 180);
  sun.castShadow = preset.shadows;
  if (preset.shadows) {
    sun.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize);
    sun.shadow.camera.left = -560;
    sun.shadow.camera.right = 560;
    sun.shadow.camera.top = 560;
    sun.shadow.camera.bottom = -560;
    sun.shadow.bias = -0.0002;
  }
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));

  const blockers = buildVillage(scene, mapId);

  const title = makeLabelSprite(
    mapDisplayName(mapId).toUpperCase(),
    "rgba(248,250,252,0.92)",
    "#0b1220"
  );
  title.scale.set(220, 36, 1);
  title.position.set(WORLD.width / 2, 78, 40);
  scene.add(title);
  const tip = makeLabelSprite("Walk to a person · E / Talk", "rgba(15,23,42,0.82)", "#f8fafc");
  tip.scale.set(200, 28, 1);
  tip.position.set(WORLD.width / 2, 52, 48);
  scene.add(tip);

  const playerRig = createPersonFigure(PLAYER_LOOK);
  const player = playerRig.root;
  const playerLabel = makeLabelSprite("You", "#0b3d91", "#ffffff");
  playerLabel.position.set(0, 58, 0);
  player.add(playerLabel);
  const spawn = boot.playerSpawn ?? { x: 480, z: 500 };
  player.position.set(spawn.x, 0, spawn.z);
  scene.add(player);

  const completed = new Set(boot.completedScenarioIds);
  const npcVisuals: NpcVisual[] = [];
  for (const npc of npcList) {
    const look = NPC_LOOKS[npc.id] ?? {
      outfit: npc.color,
      pants: 0x334155,
      skin: 0xd4a574,
      hair: 0x2c1810,
      hairStyle: "short" as const,
    };
    const rig = createPersonFigure(look);
    const root = rig.root;
    const status: NpcVisual["status"] =
      npc.status ?? (completed.has(npc.scenarioId) ? "completed" : "available");
    const style = statusStyle(status);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(18, 1.6, 8, 24),
      new THREE.MeshStandardMaterial({
        color: style.ring,
        emissive: style.ring,
        emissiveIntensity: status === "locked" ? 0.08 : 0.25,
      })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 1.5;
    root.add(halo);

    const labelText =
      status === "completed"
        ? `${npc.name} · Done`
        : status === "locked"
          ? `${npc.name} · Locked`
          : npc.name;
    const labelSprite = makeLabelSprite(labelText, style.bg, style.color);
    labelSprite.position.set(0, 58, 0);
    root.add(labelSprite);

    root.rotation.y = Math.atan2(480 - npc.x, 340 - npc.y);
    root.position.set(npc.x, 0, npc.y);
    if (status === "locked") {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) {
            if ("opacity" in m) {
              (m as THREE.Material).transparent = true;
              (m as THREE.Material).opacity = 0.55;
            }
          }
        }
      });
    }
    scene.add(root);
    npcVisuals.push({
      scenarioId: npc.scenarioId,
      root,
      rig,
      ring: halo,
      labelSprite,
      name: npc.name,
      status,
      idlePhase: Math.random() * Math.PI * 2,
      x: npc.x,
      z: npc.y,
    });
  }

  let locked = false;
  let focusScenarioId: string | null = null;
  let nearby: { scenarioId: string; name: string } | null = null;
  let disposed = false;
  let raf = 0;
  const keys = new Set<string>();
  const clock = new THREE.Clock();
  const camDesired = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();

  function resize() {
    const w = parent.clientWidth || WORLD.width;
    const h = parent.clientHeight || WORLD.height;
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  ro?.observe(parent);
  resize();

  function inputActive() {
    return boot.isInputActive?.() ?? true;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!inputActive() || locked) return;
    if (!GAME_CONTROL_CODES.has(e.code)) return;
    e.preventDefault();
    e.stopPropagation();
    keys.add(e.code);
    if ((e.code === "KeyE" || e.code === "Space") && nearby) {
      const visual = npcVisuals.find((n) => n.scenarioId === nearby?.scenarioId);
      if (visual?.status === "locked") return;
      boot.onInteract(nearby.scenarioId, nearby.name);
    }
  }
  function onKeyUp(e: KeyboardEvent) {
    if (!GAME_CONTROL_CODES.has(e.code)) return;
    if (inputActive()) {
      e.preventDefault();
      e.stopPropagation();
    }
    keys.delete(e.code);
  }
  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp, true);

  function applyNpcStatus(
    visual: NpcVisual,
    status: NpcVisual["status"]
  ) {
    if (visual.status === status) return;
    const prev = visual.status;
    visual.status = status;
    const style = statusStyle(status);
    const labelText =
      status === "completed"
        ? `${visual.name} · Done`
        : status === "locked"
          ? `${visual.name} · Locked`
          : visual.name;
    updateLabelSprite(visual.labelSprite, labelText, style.bg, style.color);
    const mat = visual.ring.material as THREE.MeshStandardMaterial;
    mat.color.setHex(style.ring);
    mat.emissive.setHex(style.ring);
    mat.emissiveIntensity = status === "locked" ? 0.08 : 0.25;

    // Restore full opacity when unlocking; dim when locking.
    if (prev === "locked" || status === "locked") {
      const opacity = status === "locked" ? 0.55 : 1;
      visual.root.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) {
            if ("opacity" in m) {
              (m as THREE.Material).transparent = opacity < 1;
              (m as THREE.Material).opacity = opacity;
            }
          }
        }
      });
    }
  }

  function tryMove(nx: number, nz: number) {
    const clampedX = Math.min(WORLD.width - PLAYER_RADIUS, Math.max(PLAYER_RADIUS, nx));
    const clampedZ = Math.min(WORLD.height - PLAYER_RADIUS, Math.max(PLAYER_RADIUS, nz));
    if (!collides(clampedX, clampedZ, blockers)) {
      player.position.x = clampedX;
      player.position.z = clampedZ;
      return;
    }
    if (!collides(clampedX, player.position.z, blockers)) player.position.x = clampedX;
    if (!collides(player.position.x, clampedZ, blockers)) player.position.z = clampedZ;
  }

  function tick() {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);

    let moving = 0;
    if (!locked) {
      let vx = 0;
      let vz = 0;
      if (standFirmInput.left) vx -= 1;
      if (standFirmInput.right) vx += 1;
      if (standFirmInput.up) vz -= 1;
      if (standFirmInput.down) vz += 1;
      if (inputActive()) {
        if (keys.has("ArrowLeft") || keys.has("KeyA")) vx -= 1;
        if (keys.has("ArrowRight") || keys.has("KeyD")) vx += 1;
        if (keys.has("ArrowUp") || keys.has("KeyW")) vz -= 1;
        if (keys.has("ArrowDown") || keys.has("KeyS")) vz += 1;
      } else if (keys.size) {
        keys.clear();
      }

      if (vx !== 0 || vz !== 0) {
        const len = Math.hypot(vx, vz) || 1;
        moving = 1;
        vx = (vx / len) * PLAYER_SPEED * dt;
        vz = (vz / len) * PLAYER_SPEED * dt;
        const beforeX = player.position.x;
        const beforeZ = player.position.z;
        tryMove(player.position.x + vx, player.position.z + vz);
        const moved = Math.hypot(player.position.x - beforeX, player.position.z - beforeZ);
        moving = moved > 0.2 ? 1 : 0.15;
        if (moved > 0.2) {
          player.rotation.y = Math.atan2(vx, vz);
        }
      }

      let nearest: { scenarioId: string; name: string; dist: number } | null = null;
      for (const v of npcVisuals) {
        if (v.status === "locked") continue;
        const dist = Math.hypot(player.position.x - v.x, player.position.z - v.z);
        if (dist < INTERACT_RADIUS && (!nearest || dist < nearest.dist)) {
          nearest = { scenarioId: v.scenarioId, name: v.name, dist };
        }
      }
      const nextNearby = nearest
        ? { scenarioId: nearest.scenarioId, name: nearest.name }
        : null;
      if ((nearby?.scenarioId ?? null) !== (nextNearby?.scenarioId ?? null)) {
        nearby = nextNearby;
        boot.onNearbyChange?.(nearby);
      } else {
        nearby = nextNearby;
      }

      for (const v of npcVisuals) {
        const isNear = nearby?.scenarioId === v.scenarioId;
        const s = isNear ? 1 + Math.sin(performance.now() * 0.008) * 0.08 : 1;
        v.ring.scale.set(s, s, s);
        updatePersonMotion(v.rig, dt, 0);
        if (isNear) {
          const dx = player.position.x - v.root.position.x;
          const dz = player.position.z - v.root.position.z;
          const targetYaw = Math.atan2(dx, dz);
          let delta = targetYaw - v.root.rotation.y;
          while (delta > Math.PI) delta -= Math.PI * 2;
          while (delta < -Math.PI) delta += Math.PI * 2;
          v.root.rotation.y += delta * Math.min(1, dt * 4);
        }
      }
    } else {
      for (const v of npcVisuals) {
        const talking = focusScenarioId === v.scenarioId;
        setPersonTalking(v.rig, talking);
        updatePersonMotion(v.rig, dt, 0);
      }
    }

    updatePersonMotion(playerRig, dt, locked ? 0 : moving);

    const focus = focusScenarioId
      ? npcVisuals.find((n) => n.scenarioId === focusScenarioId)
      : null;
    if (focus) {
      const midX = (player.position.x + focus.root.position.x) * 0.5;
      const midZ = (player.position.z + focus.root.position.z) * 0.5;
      camDesired.set(midX, 160, midZ + 160);
      lookTarget.set(midX, 42, midZ);
    } else {
      camDesired.set(player.position.x, player.position.y + 210, player.position.z + 250);
      lookTarget.set(player.position.x, 38, player.position.z - 40);
    }
    camera.position.lerp(camDesired, 1 - Math.pow(0.001, dt));
    camera.lookAt(lookTarget);

    renderer.render(scene, camera);
  }

  try {
    tick();
    boot.onReady?.();
  } catch {
    boot.onError?.("Unable to start the game world.");
  }

  return {
    setLocked(v: boolean) {
      locked = v;
      if (!v) {
        focusScenarioId = null;
        for (const n of npcVisuals) setPersonTalking(n.rig, false);
      }
    },
    focusNpc(scenarioId: string | null) {
      focusScenarioId = scenarioId;
    },
    markCompleted(scenarioId: string) {
      const visual = npcVisuals.find((n) => n.scenarioId === scenarioId);
      if (!visual) return;
      applyNpcStatus(visual, "completed");
    },
    syncNpcStatuses(statuses) {
      for (const visual of npcVisuals) {
        const next = statuses[visual.scenarioId];
        if (!next) continue;
        applyNpcStatus(visual, next);
      }
    },
    setGraphicsQuality(quality) {
      const next = getGraphicsPreset(quality);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, next.pixelRatioCap));
      renderer.shadowMap.enabled = next.shadows;
      sun.castShadow = next.shadows;
      if (next.shadows) {
        sun.shadow.mapSize.set(next.shadowMapSize, next.shadowMapSize);
      }
    },
    destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      keys.clear();
      clearStandFirmInput();
      ro?.disconnect();
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
        if (obj instanceof THREE.Sprite) {
          obj.material.map?.dispose();
          obj.material.dispose();
        }
      });
      if (renderer.domElement.parentElement === parent) {
        parent.removeChild(renderer.domElement);
      }
    },
  };
}
