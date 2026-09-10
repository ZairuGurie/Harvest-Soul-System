import * as THREE from "three";

export type HairStyle = "short" | "bun" | "side" | "cap";

export type PersonLook = {
  outfit: number;
  pants: number;
  skin: number;
  hair: number;
  hairStyle: HairStyle;
  scale?: number;
};

export type PersonRig = {
  root: THREE.Group;
  body: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  phase: number;
  walkAmount: number;
};

/** Distinct looks for Chapter 1 NPCs — procedural, no external models. */
export const NPC_LOOKS: Record<string, PersonLook> = {
  jordan: {
    outfit: 0x2f6fed,
    pants: 0x1e3a5f,
    skin: 0xc68642,
    hair: 0x2c1810,
    hairStyle: "short",
    scale: 1,
  },
  mira: {
    outfit: 0x1f9d6c,
    pants: 0x145a40,
    skin: 0xe0ac69,
    hair: 0x3d2314,
    hairStyle: "bun",
    scale: 0.96,
  },
  eli: {
    outfit: 0xc9972a,
    pants: 0x5c4a1f,
    skin: 0x8d5524,
    hair: 0x1a1a1a,
    hairStyle: "side",
    scale: 1.04,
  },
};

export const PLAYER_LOOK: PersonLook = {
  outfit: 0x0b3d91,
  pants: 0x0a274f,
  skin: 0xd4a574,
  hair: 0x3b2f2f,
  hairStyle: "cap",
  scale: 1,
};

function mat(color: number, roughness = 0.7) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });
}

function part(geo: THREE.BufferGeometry, color: number, roughness = 0.7) {
  const m = new THREE.Mesh(geo, mat(color, roughness));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/**
 * More readable humanoid: clear limbs, face, hair that does not cover the face.
 */
export function createPersonFigure(look: PersonLook): PersonRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.name = "body";

  const skin = look.skin;
  const scale = look.scale ?? 1;

  // --- Legs (hip pivots) ---
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-4.5, 18, 0);
  const leftLegMesh = part(new THREE.CapsuleGeometry(3.4, 12, 5, 10), look.pants);
  leftLegMesh.position.y = -9;
  leftLeg.add(leftLegMesh);
  const leftShoe = part(new THREE.BoxGeometry(5.8, 2.4, 9), 0x1e293b);
  leftShoe.position.set(0, -17, 1.8);
  leftLeg.add(leftShoe);
  body.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(4.5, 18, 0);
  const rightLegMesh = part(new THREE.CapsuleGeometry(3.4, 12, 5, 10), look.pants);
  rightLegMesh.position.y = -9;
  rightLeg.add(rightLegMesh);
  const rightShoe = part(new THREE.BoxGeometry(5.8, 2.4, 9), 0x1e293b);
  rightShoe.position.set(0, -17, 1.8);
  rightLeg.add(rightShoe);
  body.add(rightLeg);

  // --- Torso with shoulders (box reads clearer than a blob) ---
  const hips = part(new THREE.BoxGeometry(14, 6, 8), look.pants);
  hips.position.y = 20;
  body.add(hips);

  const torso = part(new THREE.BoxGeometry(15, 16, 9), look.outfit);
  torso.position.y = 30;
  body.add(torso);

  const shoulders = part(new THREE.BoxGeometry(20, 5, 8), look.outfit);
  shoulders.position.y = 38;
  body.add(shoulders);

  // Collar
  const collar = part(new THREE.BoxGeometry(10, 2.5, 9.5), 0xf8fafc, 0.55);
  collar.position.y = 39.5;
  body.add(collar);

  // --- Arms (shoulder pivots, offset so they stay visible) ---
  const leftArm = new THREE.Group();
  leftArm.position.set(-11.5, 37, 0);
  leftArm.rotation.z = 0.18;
  const leftArmMesh = part(new THREE.CapsuleGeometry(2.8, 13, 5, 10), look.outfit);
  leftArmMesh.position.y = -9;
  leftArm.add(leftArmMesh);
  const leftHand = part(new THREE.SphereGeometry(3, 10, 10), skin, 0.55);
  leftHand.position.set(0, -17.5, 0);
  leftArm.add(leftHand);
  body.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(11.5, 37, 0);
  rightArm.rotation.z = -0.18;
  const rightArmMesh = part(new THREE.CapsuleGeometry(2.8, 13, 5, 10), look.outfit);
  rightArmMesh.position.y = -9;
  rightArm.add(rightArmMesh);
  const rightHand = part(new THREE.SphereGeometry(3, 10, 10), skin, 0.55);
  rightHand.position.set(0, -17.5, 0);
  rightArm.add(rightHand);
  body.add(rightArm);

  // --- Head group (face always readable) ---
  const head = new THREE.Group();
  head.position.y = 48;

  const neck = part(new THREE.CylinderGeometry(2.6, 3.2, 5, 10), skin, 0.55);
  neck.position.y = -6;
  head.add(neck);

  const skull = part(new THREE.SphereGeometry(7.4, 20, 16), skin, 0.5);
  head.add(skull);

  // Ears
  const leftEar = part(new THREE.SphereGeometry(2.2, 8, 8), skin, 0.55);
  leftEar.position.set(-7.2, 0, 0);
  leftEar.scale.set(0.55, 1, 0.7);
  head.add(leftEar);
  const rightEar = part(new THREE.SphereGeometry(2.2, 8, 8), skin, 0.55);
  rightEar.position.set(7.2, 0, 0);
  rightEar.scale.set(0.55, 1, 0.7);
  head.add(rightEar);

  // Eyes (whites + pupils) on front of face (+Z)
  const eyeWhite = mat(0xf8fafc, 0.35);
  const pupilMat = mat(0x1e293b, 0.3);
  for (const ex of [-2.6, 2.6]) {
    const white = new THREE.Mesh(new THREE.SphereGeometry(1.55, 10, 10), eyeWhite);
    white.position.set(ex, 1.1, 6.3);
    white.scale.set(1, 1.15, 0.55);
    head.add(white);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), pupilMat);
    pupil.position.set(ex, 1.1, 7.05);
    head.add(pupil);
  }

  // Brows
  const browMat = mat(look.hair, 0.8);
  for (const ex of [-2.6, 2.6]) {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.55, 0.6), browMat);
    brow.position.set(ex, 2.8, 6.5);
    head.add(brow);
  }

  // Nose
  const nose = part(new THREE.SphereGeometry(1.35, 8, 8), skin, 0.55);
  nose.position.set(0, 0.1, 7.3);
  nose.scale.set(0.75, 1, 0.9);
  head.add(nose);

  // Mouth
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.28, 6, 14, Math.PI),
    mat(0x9f1239, 0.55)
  );
  mouth.position.set(0, -2.4, 6.5);
  mouth.rotation.set(Math.PI, 0, Math.PI);
  head.add(mouth);

  // Hair — sits on top/back only (never covers face)
  const hairMat = mat(look.hair, 0.85);
  if (look.hairStyle === "short") {
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(7.7, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.42),
      hairMat
    );
    hair.position.set(0, 2.2, -0.6);
    hair.castShadow = true;
    head.add(hair);
  } else if (look.hairStyle === "bun") {
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(7.8, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45),
      hairMat
    );
    hair.position.set(0, 2.0, -0.8);
    hair.castShadow = true;
    head.add(hair);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 10), hairMat);
    bun.position.set(0, 7.5, -4);
    bun.castShadow = true;
    head.add(bun);
  } else if (look.hairStyle === "side") {
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(7.7, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.4),
      hairMat
    );
    hair.position.set(0, 2.2, -0.7);
    hair.castShadow = true;
    head.add(hair);
    const side = new THREE.Mesh(new THREE.BoxGeometry(3.5, 7, 2.5), hairMat);
    side.position.set(-6.8, -1, 1);
    head.add(side);
  } else {
    // Cap sits above the face
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(8.8, 8.8, 1.1, 20), hairMat);
    brim.position.set(0, 3.2, 0.5);
    head.add(brim);
    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(6.4, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat
    );
    crown.position.set(0, 4.2, 0);
    head.add(crown);
  }

  body.add(head);
  body.scale.setScalar(scale);
  root.add(body);

  return {
    root,
    body,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    phase: Math.random() * Math.PI * 2,
    walkAmount: 0,
  };
}

const WALK_FREQ = 9;
const LEG_SWING = 0.7;
const ARM_SWING = 0.6;
const IDLE_SWAY = 0.05;

export function updatePersonMotion(rig: PersonRig, dt: number, moving: number) {
  const target = THREE.MathUtils.clamp(moving, 0, 1);
  rig.walkAmount = THREE.MathUtils.damp(rig.walkAmount, target, 10, dt);

  if (rig.walkAmount > 0.05) {
    rig.phase += dt * WALK_FREQ * (0.65 + rig.walkAmount * 0.55);
  } else {
    rig.phase += dt * 1.2;
  }

  const a = Math.sin(rig.phase);
  const walk = rig.walkAmount;
  const leg = a * LEG_SWING * walk;
  const arm = a * ARM_SWING * walk;
  const idle = Math.sin(rig.phase * 0.35) * IDLE_SWAY * (1 - walk);

  rig.leftLeg.rotation.x = leg;
  rig.rightLeg.rotation.x = -leg;
  rig.leftArm.rotation.x = -arm + idle;
  rig.rightArm.rotation.x = arm - idle;
  rig.leftArm.rotation.z = 0.18;
  rig.rightArm.rotation.z = -0.18;

  rig.body.position.y = Math.abs(Math.sin(rig.phase)) * 1.6 * walk;
  rig.body.rotation.z = a * 0.035 * walk;
  rig.body.rotation.x = -0.04 * walk;
}
