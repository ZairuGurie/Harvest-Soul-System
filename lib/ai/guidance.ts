import { searchRelevantScripture, type ScripturePassage } from "@/lib/bible";
import { completeChat } from "./client";
import { getAiConfig } from "./config";
import { buildScriptureFallbackAnswer } from "./fallback";
import type { AiChatMessage, AiMode } from "./types";
import { stripMarkdownMarkers } from "./formatAnswer";
import { buildSystemPrompt, buildUserPrompt, formatScriptureContext } from "./prompt";
import {
  crisisResponse,
  detectCrisis,
  validateScriptureReferences,
} from "./validate";

const MAX_HISTORY = 8;
const MAX_MESSAGE_CHARS = 4000;

export type AiGuidanceRequest = {
  message: string;
  mode?: AiMode;
  history?: AiChatMessage[];
  translation?: string;
};

export type AiGuidanceResponse = {
  answer: string;
  scriptures: ScripturePassage[];
  mode: AiMode;
  metadata: {
    model: string;
    translation: string;
    matchedTopics: string[];
    durationMs: number;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
    crisis?: boolean;
    fallback?: boolean;
  };
};

function normalizeMode(mode?: string): AiMode {
  if (mode === "study" || mode === "devotional") return mode;
  return "ask";
}

function sanitizeHistory(history: AiChatMessage[] | undefined): AiChatMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_MESSAGE_CHARS),
    }));
}

function fallbackResponse(params: {
  message: string;
  mode: AiMode;
  translation: string;
  retrieval: Awaited<ReturnType<typeof searchRelevantScripture>>;
  started: number;
  reason?: string;
}): AiGuidanceResponse {
  const answer = stripMarkdownMarkers(
    buildScriptureFallbackAnswer({
      message: params.message,
      mode: params.mode,
      passages: params.retrieval.passages,
    })
  );

  const note =
    params.reason === "quota"
      ? "\n\n(OpenAI credits were exhausted, so this answer used the free Scripture fallback.)"
      : params.reason === "provider"
        ? "\n\n(The AI provider was unavailable, so this answer used the free Scripture fallback.)"
        : "";

  return {
    answer: `${answer}${note}`,
    scriptures: params.retrieval.passages,
    mode: params.mode,
    metadata: {
      model: "scripture-fallback",
      translation: params.translation,
      matchedTopics: params.retrieval.matchedTopics,
      durationMs: Date.now() - params.started,
      fallback: true,
    },
  };
}

export async function runAiGuidance(
  input: AiGuidanceRequest
): Promise<AiGuidanceResponse> {
  const started = Date.now();
  const config = getAiConfig();
  const mode = normalizeMode(input.mode);
  const message = String(input.message || "").trim().slice(0, MAX_MESSAGE_CHARS);
  const translation =
    String(input.translation || config.defaultTranslation).trim().toLowerCase() ||
    config.defaultTranslation;
  const history = sanitizeHistory(input.history);

  if (!message) {
    throw new Error("MESSAGE_REQUIRED");
  }

  if (!config.enabled) {
    throw new Error("AI_UNAVAILABLE");
  }

  if (detectCrisis(message)) {
    const retrieval = await searchRelevantScripture(message, translation, {
      limit: 2,
      extraReferences: ["Psalm 34:18"],
    });
    return {
      answer: crisisResponse(),
      scriptures: retrieval.passages,
      mode,
      metadata: {
        model: "safety",
        translation,
        matchedTopics: retrieval.matchedTopics,
        durationMs: Date.now() - started,
        crisis: true,
      },
    };
  }

  const retrieval = await searchRelevantScripture(message, translation, {
    limit: mode === "study" ? 3 : 5,
  });

  // No LLM key → Scripture-only answers
  if (!config.apiKey) {
    if (!config.scriptureFallback) throw new Error("AI_UNAVAILABLE");
    return fallbackResponse({
      message,
      mode,
      translation,
      retrieval,
      started,
    });
  }

  const system = buildSystemPrompt(mode);
  const scriptureContext = formatScriptureContext(retrieval.passages);
  const userPrompt = buildUserPrompt({
    message,
    mode,
    scriptureContext,
  });

  try {
    const completion = await completeChat({
      config,
      system,
      history,
      user: userPrompt,
    });

    const validated = await validateScriptureReferences({
      answer: completion.content,
      verified: retrieval.passages,
      translationKey: translation,
    });

    return {
      answer: stripMarkdownMarkers(validated.answer),
      scriptures: validated.scriptures,
      mode,
      metadata: {
        model: completion.model,
        translation,
        matchedTopics: retrieval.matchedTopics,
        durationMs: Date.now() - started,
        usage: completion.usage,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI_PROVIDER_ERROR";
    if (config.scriptureFallback) {
      const reason =
        msg === "AI_QUOTA_EXCEEDED"
          ? "quota"
          : msg === "AI_NOT_CONFIGURED"
            ? "provider"
            : "provider";
      return fallbackResponse({
        message,
        mode,
        translation,
        retrieval,
        started,
        reason,
      });
    }
    if (msg === "AI_NOT_CONFIGURED") throw new Error("AI_UNAVAILABLE");
    if (msg === "AI_QUOTA_EXCEEDED") throw new Error("AI_QUOTA_EXCEEDED");
    if (msg === "AI_AUTH_FAILED") throw new Error("AI_AUTH_FAILED");
    throw new Error("AI_PROVIDER_ERROR");
  }
}
