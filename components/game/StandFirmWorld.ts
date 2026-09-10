import * as THREE from "three";
import { NPCS, WORLD, type StandFirmBootData } from "./standFirmConfig";
import { clearStandFirmInput, GAME_CONTROL_CODES, standFirmInput } from "./standFirmInput";
import {
  NPC_LOOKS,
  PLAYER_LOOK,
  createPersonFigure,
  updatePersonMotion,
  type PersonRig,
} from "./standFirmCharacters";
import { buildVillage } from "./standFirmVillage";

export { standFirmInput } from "./standFirmInput";

type NpcVisual = {
  scenarioId: string;
  root: THREE.Group;
  rig: PersonRig;
  ring: THREE.Mesh;
  labelSprite: THREE.Sprite;
  name: string;
  idlePhase: number;
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
};

export function createStandFirmGame(
  parent: HTMLElement,
  boot: StandFirmBootData
): StandFirmGameHandle {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(48, 1, 1, 2800);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
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
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -560;
  sun.shadow.camera.right = 560;
  sun.shadow.camera.top = 560;
  sun.shadow.camera.bottom = -560;
  sun.shadow.bias = -0.0002;
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));

  const blockers = buildVillage(scene);

  const title = makeLabelSprite("STAND FIRM VILLAGE", "rgba(248,250,252,0.92)", "#0b1220");
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
  player.position.set(480, 0, 500);
  scene.add(player);

  const completed = new Set(boot.completedScenarioIds);
  const npcVisuals: NpcVisual[] = [];
  for (const npc of NPCS) {
    const look = NPC_LOOKS[npc.id] ?? {
      outfit: npc.color,
      pants: 0x334155,
      skin: 0xd4a574,
      hair: 0x2c1810,
      hairStyle: "short" as const,
    };
    const rig = createPersonFigure(look);
    const root = rig.root;
    const done = completed.has(npc.scenarioId);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(18, 1.6, 8, 24),
      new THREE.MeshStandardMaterial({
        color: done ? 0xf0c14a : 0xffffff,
        emissive: done ? 0xf0c14a : 0xffffff,
        emissiveIntensity: 0.25,
      })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 1.5;
    root.add(halo);

    const labelSprite = makeLabelSprite(done ? `${npc.name} ✓` : npc.name);
    labelSprite.position.set(0, 58, 0);
    root.add(labelSprite);

    // Face toward village center roughly
    root.rotation.y = Math.atan2(480 - npc.x, 340 - npc.y);
    root.position.set(npc.x, 0, npc.y);
    scene.add(root);
    npcVisuals.push({
      scenarioId: npc.scenarioId,
      root,
      rig,
      ring: halo,
      labelSprite,
      name: npc.name,
      idlePhase: Math.random() * Math.PI * 2,
    });
  }

  let locked = false;
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
    // Keep arrows / WASD / Space inside the game — do not scroll the page or hit site nav.
    e.preventDefault();
    e.stopPropagation();
    keys.add(e.code);
    if ((e.code === "KeyE" || e.code === "Space") && nearby) {
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
  // Capture phase so game keys win over page/nav listeners while the panel is active.
  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp, true);

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
      // On-screen pad always drives movement inside the game (never site nav).
      if (standFirmInput.left) vx -= 1;
      if (standFirmInput.right) vx += 1;
      if (standFirmInput.up) vz -= 1;
      if (standFirmInput.down) vz += 1;
      // Keyboard only while the game panel owns focus.
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
        // If blocked completely, don't keep full walk intensity
        const moved = Math.hypot(player.position.x - beforeX, player.position.z - beforeZ);
        moving = moved > 0.2 ? 1 : 0.15;
        if (moved > 0.2) {
          player.rotation.y = Math.atan2(vx, vz);
        }
      }

      let nearest: { scenarioId: string; name: string; dist: number } | null = null;
      for (const npc of NPCS) {
        const dist = Math.hypot(player.position.x - npc.x, player.position.z - npc.y);
        if (dist < INTERACT_RADIUS && (!nearest || dist < nearest.dist)) {
          nearest = { scenarioId: npc.scenarioId, name: npc.name, dist };
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
        // NPCs stay in place with idle motion (subtle arm sway)
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
    }

    updatePersonMotion(playerRig, dt, locked ? 0 : moving);

    camDesired.set(player.position.x, player.position.y + 210, player.position.z + 250);
    camera.position.lerp(camDesired, 1 - Math.pow(0.001, dt));
    lookTarget.set(player.position.x, 38, player.position.z - 40);
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
    },
    markCompleted(scenarioId: string) {
      const visual = npcVisuals.find((n) => n.scenarioId === scenarioId);
      const npc = NPCS.find((n) => n.scenarioId === scenarioId);
      if (!visual || !npc) return;
      updateLabelSprite(visual.labelSprite, `${npc.name} ✓`);
      const mat = visual.ring.material as THREE.MeshStandardMaterial;
      mat.color.setHex(0xf0c14a);
      mat.emissive.setHex(0xf0c14a);
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
