import type { AiChatMessage, AiMode } from "./types";

export type { AiChatMessage, AiMode } from "./types";

export type AiConfig = {
  enabled: boolean;
  apiKey: string | null;
  model: string;
  baseUrl: string;
  maxTokens: number;
  temperature: number;
  defaultTranslation: string;
  dailyLimitAuthenticated: number;
  dailyLimitAnonymous: number;
  /** When true, answer from verified Scripture if LLM is missing or fails. */
  scriptureFallback: boolean;
  provider: "openai" | "groq" | "custom" | "none";
};

function detectProvider(baseUrl: string, hasKey: boolean): AiConfig["provider"] {
  if (!hasKey) return "none";
  const u = baseUrl.toLowerCase();
  if (u.includes("groq.com")) return "groq";
  if (u.includes("openai.com")) return "openai";
  return "custom";
}

export function getAiConfig(): AiConfig {
  const apiKey = String(process.env.AI_API_KEY || "").trim() || null;
  const fallbackEnv = String(process.env.AI_SCRIPTURE_FALLBACK || "true")
    .trim()
    .toLowerCase();
  const scriptureFallback = fallbackEnv !== "false" && fallbackEnv !== "0";

  const enabledEnv = String(process.env.AI_ENABLED || "true").trim().toLowerCase();
  const flagOn = enabledEnv !== "false" && enabledEnv !== "0";
  // Available if LLM key exists OR scripture fallback is allowed
  const enabled = flagOn && (!!apiKey || scriptureFallback);

  const maxTokensRaw = Number(process.env.AI_MAX_TOKENS || 1800);
  const maxTokens = Number.isFinite(maxTokensRaw)
    ? Math.min(4000, Math.max(256, Math.floor(maxTokensRaw)))
    : 1800;

  const tempRaw = Number(process.env.AI_TEMPERATURE || 0.4);
  const temperature = Number.isFinite(tempRaw) ? Math.min(1, Math.max(0, tempRaw)) : 0.4;

  const authLimit = Number(process.env.AI_DAILY_LIMIT_AUTH || 200);
  const anonLimit = Number(process.env.AI_DAILY_LIMIT_ANON || 100);

  const baseUrl =
    String(process.env.AI_BASE_URL || "https://api.openai.com/v1")
      .trim()
      .replace(/\/$/, "") || "https://api.openai.com/v1";

  return {
    enabled,
    apiKey,
    model: String(process.env.AI_MODEL || "gpt-4o-mini").trim() || "gpt-4o-mini",
    baseUrl,
    maxTokens,
    temperature,
    defaultTranslation:
      String(process.env.AI_BIBLE_VERSION || "kjv").trim().toLowerCase() || "kjv",
    dailyLimitAuthenticated: Number.isFinite(authLimit)
      ? Math.min(2000, Math.max(1, Math.floor(authLimit)))
      : 200,
    dailyLimitAnonymous: Number.isFinite(anonLimit)
      ? Math.min(500, Math.max(0, Math.floor(anonLimit)))
      : 100,
    scriptureFallback,
    provider: detectProvider(baseUrl, !!apiKey),
  };
}

export function aiPublicStatus() {
  const cfg = getAiConfig();
  return {
    enabled: cfg.enabled,
    configured: cfg.enabled,
    hasLlm: !!cfg.apiKey,
    scriptureFallback: cfg.scriptureFallback,
    provider: cfg.provider,
    model: cfg.apiKey ? cfg.model : "scripture-fallback",
    defaultTranslation: cfg.defaultTranslation,
    dailyLimitAuthenticated: cfg.dailyLimitAuthenticated,
    dailyLimitAnonymous: cfg.dailyLimitAnonymous,
  };
}
