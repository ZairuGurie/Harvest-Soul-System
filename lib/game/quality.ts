export type GraphicsQuality = "low" | "medium" | "high";

const STORAGE_KEY = "harvest-souls-stand-firm-gfx";

export type GraphicsPreset = {
  quality: GraphicsQuality;
  pixelRatioCap: number;
  shadowMapSize: number;
  shadows: boolean;
  antialias: boolean;
  fogDensity: number;
};

const PRESETS: Record<GraphicsQuality, GraphicsPreset> = {
  low: {
    quality: "low",
    pixelRatioCap: 1,
    shadowMapSize: 512,
    shadows: false,
    antialias: false,
    fogDensity: 0.0014,
  },
  medium: {
    quality: "medium",
    pixelRatioCap: 1.5,
    shadowMapSize: 1024,
    shadows: true,
    antialias: true,
    fogDensity: 0.0012,
  },
  high: {
    quality: "high",
    pixelRatioCap: 2,
    shadowMapSize: 2048,
    shadows: true,
    antialias: true,
    fogDensity: 0.001,
  },
};

export function detectDefaultQuality(): GraphicsQuality {
  if (typeof window === "undefined") return "medium";
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile || cores <= 4 || (mem != null && mem <= 4)) return "low";
  if (cores >= 8 && (mem == null || mem >= 8)) return "high";
  return "medium";
}

export function loadGraphicsQuality(): GraphicsQuality {
  if (typeof window === "undefined") return "medium";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "low" || raw === "medium" || raw === "high") return raw;
  } catch {
    // ignore
  }
  return detectDefaultQuality();
}

export function saveGraphicsQuality(quality: GraphicsQuality) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, quality);
  } catch {
    // ignore
  }
}

export function getGraphicsPreset(quality?: GraphicsQuality): GraphicsPreset {
  const q = quality ?? loadGraphicsQuality();
  return PRESETS[q];
}
