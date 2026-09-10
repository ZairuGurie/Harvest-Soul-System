import * as THREE from "three";
import { WORLD } from "./standFirmConfig";

export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };

function canvasTex(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = 256,
  repeat = 8
) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  return tex;
}

function grassTexture() {
  return canvasTex((ctx, size) => {
    ctx.fillStyle = "#6f9e62";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1800; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const shade = 90 + Math.floor(Math.random() * 70);
      ctx.fillStyle = `rgb(${shade * 0.45},${shade},${shade * 0.35})`;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 2 + Math.random() * 3);
    }
    // Soft patches
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(120, 160, 70, ${0.08 + Math.random() * 0.12})`;
      ctx.beginPath();
      ctx.ellipse(
        Math.random() * size,
        Math.random() * size,
        8 + Math.random() * 18,
        6 + Math.random() * 12,
        Math.random(),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }, 256, 10);
}

function dirtTexture() {
  return canvasTex((ctx, size) => {
    ctx.fillStyle = "#c2a06a";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1200; i++) {
      const g = 140 + Math.floor(Math.random() * 50);
      ctx.fillStyle = `rgb(${g},${g - 30},${g - 70})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
    }
    for (let i = 0; i < 80; i++) {
      ctx.strokeStyle = `rgba(90, 60, 30, ${0.08 + Math.random() * 0.12})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * size, Math.random() * size);
      ctx.lineTo(Math.random() * size, Math.random() * size);
      ctx.stroke();
    }
  }, 256, 4);
}

function stoneTexture() {
  return canvasTex((ctx, size) => {
    ctx.fillStyle = "#9aa3ad";
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 16) {
      for (let x = 0; x < size; x += 24) {
        const ox = (Math.floor(y / 16) % 2) * 12;
        ctx.fillStyle = `rgb(${140 + ((x * y) % 40)},${145 + ((x + y) % 30)},${150})`;
        ctx.fillRect(x + ox + 1, y + 1, 22, 14);
        ctx.strokeStyle = "rgba(60,70,80,0.35)";
        ctx.strokeRect(x + ox + 1, y + 1, 22, 14);
      }
    }
  }, 256, 3);
}

function woodTexture(base = "#8b5a2b") {
  return canvasTex((ctx, size) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 28; i++) {
      ctx.strokeStyle = `rgba(40, 20, 8, ${0.08 + Math.random() * 0.12})`;
      ctx.beginPath();
      ctx.moveTo(0, (i / 28) * size);
      ctx.bezierCurveTo(size * 0.3, i * 9, size * 0.7, i * 9 + 8, size, i * 9);
      ctx.stroke();
    }
  }, 128, 2);
}

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });
}

function addBlocker(
  blockers: Rect[],
  x: number,
  z: number,
  w: number,
  d: number,
  pad = 4
) {
  blockers.push({
    minX: x - w / 2 - pad,
    maxX: x + w / 2 + pad,
    minZ: z - d / 2 - pad,
    maxZ: z + d / 2 + pad,
  });
}

function makeHouse(
  x: number,
  z: number,
  wallColor: number,
  opts: { w?: number; d?: number; h?: number; roof?: number; yaw?: number } = {}
) {
  const w = opts.w ?? 110;
  const d = opts.d ?? 86;
  const h = opts.h ?? 56;
  const group = new THREE.Group();

  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(wallColor, { roughness: 0.9 }));
  walls.position.y = h / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  // Gable end triangles (fill the peak so the roof reads as attached)
  const gableMat = mat(wallColor, { roughness: 0.9 });
  const peak = 28;
  for (const side of [-1, 1] as const) {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(0, peak);
    shape.lineTo(w / 2, 0);
    shape.closePath();
    const gable = new THREE.Mesh(new THREE.ShapeGeometry(shape), gableMat);
    gable.position.set(0, h, (d / 2) * side);
    if (side < 0) gable.rotation.y = Math.PI;
    group.add(gable);
  }

  // Solid extruded gable roof (sits flush on wall tops)
  const roofMat = mat(opts.roof ?? 0x3f2a1d, { roughness: 0.78 });
  const eaves = 8;
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-w / 2 - eaves, 0);
  roofShape.lineTo(0, peak + 2);
  roofShape.lineTo(w / 2 + eaves, 0);
  roofShape.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
    depth: d + eaves * 2,
    bevelEnabled: false,
  });
  roofGeo.translate(0, 0, -(d + eaves * 2) / 2);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = h;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  // Chimney through the roof
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(10, 26, 10), mat(0x5b6570));
  chimney.position.set(w * 0.22, h + peak * 0.55, -d * 0.12);
  chimney.castShadow = true;
  group.add(chimney);
  const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(14, 3, 14), mat(0x4b5563));
  chimneyCap.position.copy(chimney.position);
  chimneyCap.position.y += 14;
  group.add(chimneyCap);

  // Plinth
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(w + 8, 4, d + 8),
    mat(0x6b7280, { map: stoneTexture(), roughness: 0.95 })
  );
  plinth.position.y = 2;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Door
  const door = new THREE.Mesh(new THREE.BoxGeometry(16, 30, 2), mat(0x4a2f1a, { map: woodTexture() }));
  door.position.set(0, 17, d / 2 + 1.2);
  group.add(door);
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 8, 8),
    mat(0xd4af37, { metalness: 0.7, roughness: 0.35 })
  );
  knob.position.set(5, 17, d / 2 + 2.4);
  group.add(knob);

  // Windows
  const glass = mat(0x9fd3ff, {
    roughness: 0.25,
    metalness: 0.2,
    emissive: 0x234,
    emissiveIntensity: 0.08,
  });
  const frame = mat(0xf8fafc);
  for (const wx of [-w * 0.28, w * 0.28]) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(20, 18, 1.2), frame);
    trim.position.set(wx, h * 0.55, d / 2 + 0.4);
    group.add(trim);
    const win = new THREE.Mesh(new THREE.BoxGeometry(16, 14, 1.5), glass);
    win.position.set(wx, h * 0.55, d / 2 + 1.1);
    group.add(win);
  }
  for (const side of [-1, 1]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.5, 14, 14), glass);
    win.position.set((w / 2 + 0.8) * side, h * 0.52, 0);
    group.add(win);
  }

  // Front steps
  const step = new THREE.Mesh(new THREE.BoxGeometry(28, 4, 12), mat(0x8b9098));
  step.position.set(0, 2, d / 2 + 10);
  step.castShadow = true;
  group.add(step);

  group.position.set(x, 0, z);
  if (opts.yaw) group.rotation.y = opts.yaw;
  return { group, w, d };
}

function makeTree(x: number, z: number, scale = 1) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(4 * scale, 6 * scale, 34 * scale, 8),
    mat(0x6b4226, { map: woodTexture("#5c3a1e") })
  );
  trunk.position.y = 17 * scale;
  trunk.castShadow = true;
  group.add(trunk);

  const greens = [0x2f7d32, 0x3a9a3d, 0x256628];
  for (let i = 0; i < 3; i++) {
    const canopy = new THREE.Mesh(
      new THREE.IcosahedronGeometry((18 - i * 2) * scale, 1),
      mat(greens[i], { roughness: 0.95 })
    );
    canopy.position.set((i - 1) * 4 * scale, (40 + i * 8) * scale, (i % 2 === 0 ? 2 : -2) * scale);
    canopy.castShadow = true;
    group.add(canopy);
  }
  group.position.set(x, 0, z);
  group.scale.setScalar(0.85 + Math.random() * 0.3);
  return group;
}

function makeBush(x: number, z: number) {
  const group = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(
      new THREE.SphereGeometry(7 + Math.random() * 3, 10, 8),
      mat(0x3d8b40 + Math.floor(Math.random() * 0x1010), { roughness: 1 })
    );
    b.position.set((i - 1) * 5, 6, (i % 2) * 3);
    b.castShadow = true;
    group.add(b);
  }
  group.position.set(x, 0, z);
  return group;
}

function makeFence(x1: number, z1: number, x2: number, z2: number) {
  const group = new THREE.Group();
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const posts = Math.max(2, Math.floor(len / 28));
  const wood = mat(0x8b6914, { map: woodTexture("#7a5a20") });
  for (let i = 0; i <= posts; i++) {
    const t = i / posts;
    const post = new THREE.Mesh(new THREE.BoxGeometry(3, 18, 3), wood);
    post.position.set(x1 + dx * t, 9, z1 + dz * t);
    post.castShadow = true;
    group.add(post);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 2, 2), wood);
  rail.position.set((x1 + x2) / 2, 12, (z1 + z2) / 2);
  rail.rotation.y = -Math.atan2(dz, dx);
  rail.castShadow = true;
  group.add(rail);
  const rail2 = rail.clone();
  rail2.position.y = 6;
  group.add(rail2);
  return group;
}

function makeLamp(x: number, z: number) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 48, 8), mat(0x374151));
  pole.position.y = 24;
  pole.castShadow = true;
  group.add(pole);
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(5, 12, 10),
    new THREE.MeshStandardMaterial({
      color: 0xffe7a8,
      emissive: 0xffc14a,
      emissiveIntensity: 0.55,
      roughness: 0.4,
    })
  );
  lamp.position.y = 50;
  group.add(lamp);
  const light = new THREE.PointLight(0xffd699, 0.55, 160, 2);
  light.position.y = 48;
  group.add(light);
  group.position.set(x, 0, z);
  return group;
}

function makeBench(x: number, z: number, yaw = 0) {
  const group = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(28, 3, 10), mat(0x8b5a2b, { map: woodTexture() }));
  seat.position.y = 10;
  seat.castShadow = true;
  group.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(28, 10, 2), mat(0x8b5a2b, { map: woodTexture() }));
  back.position.set(0, 16, -4);
  group.add(back);
  for (const sx of [-11, 11]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(2.5, 10, 8), mat(0x4b5563));
    leg.position.set(sx, 5, 0);
    group.add(leg);
  }
  group.position.set(x, 0, z);
  group.rotation.y = yaw;
  return group;
}

function makeFlowerBed(x: number, z: number) {
  const group = new THREE.Group();
  const bed = new THREE.Mesh(new THREE.CylinderGeometry(14, 16, 4, 12), mat(0x6b4226));
  bed.position.y = 2;
  bed.receiveShadow = true;
  group.add(bed);
  const colors = [0xe11d48, 0xf59e0b, 0xffffff, 0xa855f7, 0xef4444];
  for (let i = 0; i < 10; i++) {
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 8, 8),
      mat(colors[i % colors.length], { roughness: 0.6 })
    );
    const a = (i / 10) * Math.PI * 2;
    flower.position.set(Math.cos(a) * 7, 6, Math.sin(a) * 7);
    group.add(flower);
  }
  group.position.set(x, 0, z);
  return group;
}

function makeSky() {
  const group = new THREE.Group();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1400, 32, 16),
    new THREE.MeshBasicMaterial({
      color: 0x87b8e8,
      side: THREE.BackSide,
      fog: false,
    })
  );
  group.add(sky);

  // Soft cloud blobs
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    transparent: true,
    opacity: 0.85,
    roughness: 1,
    depthWrite: false,
  });
  for (let i = 0; i < 10; i++) {
    const cloud = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(40 + Math.random() * 30, 10, 8), cloudMat);
      puff.position.set(j * 35, Math.random() * 12, (j % 2) * 20);
      cloud.add(puff);
    }
    const ang = (i / 10) * Math.PI * 2;
    cloud.position.set(Math.cos(ang) * 700, 220 + (i % 3) * 40, Math.sin(ang) * 700 - 200);
    group.add(cloud);
  }
  return group;
}

function makeHills() {
  const group = new THREE.Group();
  const hillMat = mat(0x5f8f58, { roughness: 1 });
  const spots = [
    [-120, 200, 180],
    [1080, 160, 220],
    [200, -80, 200],
    [780, 720, 240],
    [480, -100, 260],
  ];
  for (const [x, z, r] of spots) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), hillMat);
    hill.position.set(x, -8, z);
    hill.receiveShadow = true;
    group.add(hill);
  }
  return group;
}

/**
 * Builds a more lived-in village set around the same playable footprint.
 * Returns collision blockers for houses/trees/props.
 */
export function buildVillage(scene: THREE.Scene): Rect[] {
  const blockers: Rect[] = [
    { minX: 0, maxX: WORLD.width, minZ: -16, maxZ: 16 },
    { minX: 0, maxX: WORLD.width, minZ: WORLD.height - 16, maxZ: WORLD.height + 16 },
    { minX: -16, maxX: 16, minZ: 0, maxZ: WORLD.height },
    { minX: WORLD.width - 16, maxX: WORLD.width + 16, minZ: 0, maxZ: WORLD.height },
  ];

  scene.background = new THREE.Color(0x9ec9ef);
  scene.fog = new THREE.Fog(0xb7d4ef, 420, 1150);
  scene.add(makeSky());
  scene.add(makeHills());

  // Outer meadow (extends past playable area)
  const meadow = new THREE.Mesh(
    new THREE.CircleGeometry(900, 48),
    new THREE.MeshStandardMaterial({
      map: grassTexture(),
      color: 0xffffff,
      roughness: 0.98,
    })
  );
  meadow.rotation.x = -Math.PI / 2;
  meadow.position.set(WORLD.width / 2, -0.5, WORLD.height / 2);
  meadow.receiveShadow = true;
  scene.add(meadow);

  // Playable ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.width, WORLD.height),
    new THREE.MeshStandardMaterial({
      map: grassTexture(),
      color: 0xffffff,
      roughness: 0.98,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(WORLD.width / 2, 0, WORLD.height / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  // Paths
  const pathMat = new THREE.MeshStandardMaterial({
    map: dirtTexture(),
    color: 0xffffff,
    roughness: 0.95,
  });
  const pathV = new THREE.Mesh(new THREE.BoxGeometry(92, 1.2, 500), pathMat);
  pathV.position.set(480, 0.6, 330);
  pathV.receiveShadow = true;
  scene.add(pathV);
  const pathH = new THREE.Mesh(new THREE.BoxGeometry(740, 1.2, 72), pathMat);
  pathH.position.set(480, 0.6, 340);
  pathH.receiveShadow = true;
  scene.add(pathH);

  // Stone plaza / meeting circle
  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(78, 78, 2, 40),
    new THREE.MeshStandardMaterial({ map: stoneTexture(), roughness: 0.9 })
  );
  plaza.position.set(480, 1, 220);
  plaza.receiveShadow = true;
  scene.add(plaza);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(70, 2.2, 8, 48),
    mat(0xd4a017, { metalness: 0.25, roughness: 0.45 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(480, 2.2, 220);
  scene.add(ring);

  // Houses
  const houses: Array<{ x: number; z: number; color: number; yaw?: number }> = [
    { x: 175, z: 140, color: 0xc45c26 },
    { x: 775, z: 130, color: 0x3b6ea5 },
    { x: 755, z: 500, color: 0x6b4f3a },
    { x: 155, z: 500, color: 0x4a7c59 },
  ];
  for (const h of houses) {
    const built = makeHouse(h.x, h.z, h.color, { yaw: h.yaw });
    scene.add(built.group);
    addBlocker(blockers, h.x, h.z, built.w, built.d, 6);
  }

  // Trees
  const trees = [
    [80, 250],
    [880, 260],
    [300, 120],
    [620, 540],
    [420, 80],
    [560, 560],
    [100, 420],
    [860, 420],
    [50, 100],
    [900, 100],
  ] as const;
  for (const [tx, tz] of trees) {
    scene.add(makeTree(tx, tz));
    addBlocker(blockers, tx, tz, 28, 28, 2);
  }

  // Bushes / flowers / benches / lamps / fences
  for (const [bx, bz] of [
    [250, 280],
    [700, 280],
    [360, 480],
    [600, 180],
  ] as const) {
    scene.add(makeBush(bx, bz));
  }
  scene.add(makeFlowerBed(400, 260));
  scene.add(makeFlowerBed(560, 260));
  scene.add(makeBench(430, 280, 0.4));
  scene.add(makeBench(530, 280, -0.4));
  scene.add(makeLamp(420, 180));
  scene.add(makeLamp(540, 180));
  scene.add(makeLamp(200, 340));
  scene.add(makeLamp(760, 340));

  scene.add(makeFence(40, 40, 300, 40));
  scene.add(makeFence(660, 40, 920, 40));
  scene.add(makeFence(40, 600, 280, 600));
  scene.add(makeFence(680, 600, 920, 600));

  // Low border hedge along playable edge (visual, light collision already from world bounds)
  const hedgeMat = mat(0x2f6b32, { roughness: 1 });
  for (let i = 0; i < 24; i++) {
    const t = i / 23;
    for (const [x, z] of [
      [40 + t * 880, 30],
      [40 + t * 880, 610],
      [30, 40 + t * 560],
      [930, 40 + t * 560],
    ] as const) {
      if (Math.random() > 0.35) {
        const hedge = new THREE.Mesh(new THREE.SphereGeometry(8 + Math.random() * 4, 8, 6), hedgeMat);
        hedge.position.set(x, 6, z);
        hedge.castShadow = true;
        scene.add(hedge);
      }
    }
  }

  return blockers;
}
