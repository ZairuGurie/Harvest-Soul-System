import type { AiConfig } from "./config";
import type { AiChatMessage } from "./types";

export type AiCompletionResult = {
  content: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

type ChatPayloadMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function completeChat(params: {
  config: AiConfig;
  system: string;
  history: AiChatMessage[];
  user: string;
}): Promise<AiCompletionResult> {
  const { config } = params;
  if (!config.apiKey) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const messages: ChatPayloadMessage[] = [
    { role: "system", content: params.system },
    ...params.history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: params.user },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        messages,
      }),
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => null)) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    } | null;

    if (!res.ok) {
      const msg = (data?.error?.message || `AI provider error (${res.status})`).replace(
        /(?:sk|gsk)-[a-zA-Z0-9_-]+/g,
        "[redacted]"
      );
      const lower = msg.toLowerCase();
      if (
        res.status === 429 ||
        lower.includes("insufficient_quota") ||
        lower.includes("credit") ||
        lower.includes("quota") ||
        lower.includes("billing")
      ) {
        throw new Error("AI_QUOTA_EXCEEDED");
      }
      if (res.status === 401 || res.status === 403 || lower.includes("invalid api key")) {
        throw new Error("AI_AUTH_FAILED");
      }
      throw new Error("AI_PROVIDER_ERROR");
    }

    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("AI_EMPTY_RESPONSE");
    }

    return {
      content,
      model: data?.model || config.model,
      usage: {
        promptTokens: data?.usage?.prompt_tokens,
        completionTokens: data?.usage?.completion_tokens,
        totalTokens: data?.usage?.total_tokens,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}
