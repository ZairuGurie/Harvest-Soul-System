import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { aiPublicStatus, checkRateLimit, runAiGuidance, type AiMode } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

function clientKey(req: Request, userId?: string | null) {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
  return `ip:${ip}`;
}

export async function GET() {
  return NextResponse.json(aiPublicStatus());
}

export async function POST(req: Request) {
  const started = Date.now();
  let body: {
    message?: string;
    mode?: AiMode;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    translation?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const status = aiPublicStatus();
  if (!status.enabled) {
    return NextResponse.json(
      {
        error:
          "The AI guidance service is not configured yet. Ask a Super Admin to set AI_API_KEY.",
      },
      { status: 503 }
    );
  }

  const user = await getAuthUser();
  const limit = user ? status.dailyLimitAuthenticated : status.dailyLimitAnonymous;
  const rl = checkRateLimit(clientKey(req, user?.id), limit);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: "Daily AI guidance limit reached. Please try again tomorrow.",
        resetAt: rl.resetAt,
      },
      { status: 429 }
    );
  }

  try {
    const result = await runAiGuidance({
      message: body.message || "",
      mode: body.mode,
      history: body.history,
      translation: body.translation,
    });

    // Minimal operational log — no full conversation content
    console.info("[ai/chat]", {
      userId: user?.id ?? null,
      mode: result.mode,
      durationMs: result.metadata.durationMs,
      model: result.metadata.model,
      tokens: result.metadata.usage?.totalTokens ?? null,
      crisis: !!result.metadata.crisis,
      remaining: rl.remaining,
      elapsed: Date.now() - started,
    });

    return NextResponse.json({
      answer: result.answer,
      scriptures: result.scriptures,
      mode: result.mode,
      metadata: {
        ...result.metadata,
        remaining: rl.remaining,
      },
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN";
    if (code === "MESSAGE_REQUIRED") {
      return NextResponse.json({ error: "Please enter a question." }, { status: 400 });
    }
    if (code === "AI_UNAVAILABLE") {
      return NextResponse.json(
        { error: "The AI service is temporarily unavailable." },
        { status: 503 }
      );
    }
    if (code === "AI_QUOTA_EXCEEDED") {
      return NextResponse.json(
        {
          error:
            "OpenAI has no credits left on this account. Add billing credits at platform.openai.com/settings/organization/billing, then try again.",
        },
        { status: 503 }
      );
    }
    if (code === "AI_AUTH_FAILED") {
      return NextResponse.json(
        {
          error:
            "The AI API key was rejected. Check AI_API_KEY in .env.local (or create a new key).",
        },
        { status: 503 }
      );
    }
    console.error("[ai/chat] failure", { code, userId: user?.id ?? null });
    return NextResponse.json(
      { error: "The AI service is temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }
}
