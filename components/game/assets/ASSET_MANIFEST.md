# STAND FIRM Asset Manifest

Procedural characters and environments are the current runtime default.
This manifest documents the replacement pipeline for optional GLB/GLTF assets.

## Policy

- Do not hot-link random internet models.
- Only use license-cleared assets committed under `public/game/assets/`.
- Keep polygon counts web-friendly (target under ~15k triangles per character).
- Prefer Draco or Meshopt compression only after measuring load impact with the current Three.js version.

## Expected paths (future)

```text
public/game/assets/
  characters/
    player.glb
    npc_*.glb
  environments/
    village_center.glb   (optional; code-built maps remain valid)
  textures/
    *.ktx2 or *.webp
```

## Runtime contract

Characters should expose:

- idle
- walk
- talk (optional)

Until GLB assets are present, `standFirmCharacters.ts` procedural figures are used.

## Status

| Asset | Status |
| --- | --- |
| Procedural humanoids | Active |
| Chapter maps (code) | Active — village_center, market_district, school_yard |
| External GLB characters | Placeholder / not bundled |
| KTX2 pipeline | Not enabled |
