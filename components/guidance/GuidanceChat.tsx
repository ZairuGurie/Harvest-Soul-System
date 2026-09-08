"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { parseAnswerBlocks } from "@/lib/ai/formatAnswer";
import type { AiMode } from "@/lib/ai/types";

type ScriptureItem = {
  reference: string;
  text: string;
  href: string;
  translation: { abbreviation: string; name: string; slug: string };
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  scriptures?: ScriptureItem[];
  loading?: boolean;
  error?: boolean;
};

const SUGGESTIONS_ASK = [
  "How can I strengthen my faith?",
  "How do I forgive someone?",
  "What does the Bible say about fear?",
  "How should I pray?",
  "How can I resist temptation?",
  "How can I grow spiritually?",
];

const SUGGESTIONS_DEVOTIONAL = [
  "Help me start a devotional.",
  "Create a devotional about faith.",
  "Help me reflect on Psalm 23.",
  "Guide me through a morning devotion on peace.",
];

const SUGGESTIONS_STUDY = [
  "What does Philippians 4:6-7 mean?",
  "Explain John 3:16 in context.",
  "Help me study Romans 8:28.",
  "What is the main message of Psalm 23?",
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ModeTab({
  active,
  label,
  description,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
        active
          ? "border-harvest-gold/50 bg-harvest-gold/15 text-slate-900 dark:text-white"
          : "border-slate-200/70 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
      }`}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="mt-0.5 block text-xs opacity-80">{description}</span>
    </button>
  );
}

function ScriptureCards({ items }: { items: ScriptureItem[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {items.map((s) => (
        <details
          key={`${s.reference}-${s.href}`}
          className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 open:bg-emerald-500/10"
        >
          <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
            <span className="inline-flex items-center gap-2">
              <Link
                href={s.href}
                className="underline decoration-emerald-500/40 underline-offset-2 hover:decoration-emerald-400"
                onClick={(e) => e.stopPropagation()}
              >
                {s.reference}
              </Link>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                {s.translation.abbreviation}
              </span>
            </span>
          </summary>
          <p className="border-t border-emerald-500/10 px-3 py-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {s.text}
          </p>
        </details>
      ))}
    </div>
  );
}

function AssistantAnswer({ content }: { content: string }) {
  const blocks = useMemo(() => parseAnswerBlocks(content), [content]);

  if (!blocks.length) {
    return <p className="text-slate-700 dark:text-slate-200">{content}</p>;
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <h3
              key={`h-${i}`}
              className="pt-1 text-[13px] font-semibold tracking-wide text-harvest-gold uppercase"
            >
              {block.text}
            </h3>
          );
        }
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={`l-${i}`}
              className={`${block.ordered ? "list-decimal" : "list-disc"} space-y-1.5 pl-5 text-slate-700 dark:text-slate-200`}
            >
              {block.items.map((item, j) => (
                <li key={`li-${i}-${j}`} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ListTag>
          );
        }
        return (
          <p
            key={`p-${i}`}
            className="leading-relaxed text-slate-700 dark:text-slate-200"
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[85%] ${
          isUser
            ? "bg-harvest-blue text-white"
            : message.error
              ? "border border-amber-500/40 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
              : "border border-slate-200/80 bg-white text-slate-800 dark:border-white/10 dark:bg-[#0f1a2a] dark:text-slate-100"
        }`}
      >
        {message.loading ? (
          <p className="animate-pulse text-slate-500 dark:text-slate-300">
            Finding relevant Scripture and preparing a response…
          </p>
        ) : isUser || message.error ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <AssistantAnswer content={message.content} />
        )}
        {!isUser && message.scriptures ? (
          <ScriptureCards items={message.scriptures} />
        ) : null}
      </div>
    </div>
  );
}

export default function GuidanceChat({
  configured,
  defaultTranslation,
  hasLlm = false,
}: {
  configured: boolean;
  defaultTranslation: string;
  hasLlm?: boolean;
}) {
  const [mode, setMode] = useState<AiMode>("ask");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [translation, setTranslation] = useState(defaultTranslation || "kjv");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const suggestions = useMemo(() => {
    if (mode === "devotional") return SUGGESTIONS_DEVOTIONAL;
    if (mode === "study") return SUGGESTIONS_STUDY;
    return SUGGESTIONS_ASK;
  }, [mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    if (!configured) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", content: text };
    const loadingId = uid();
    const history = messages
      .filter((m) => !m.loading && !m.error)
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    setInput("");
    setBusy(true);
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: loadingId, role: "assistant", content: "", loading: true },
    ]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mode,
          translation,
          history,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                id: loadingId,
                role: "assistant",
                content: String(data.answer || ""),
                scriptures: Array.isArray(data.scriptures) ? data.scriptures : [],
              }
            : m
        )
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "The AI service is temporarily unavailable.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                id: loadingId,
                role: "assistant",
                content: msg,
                error: true,
              }
            : m
        )
      );
    } finally {
      setBusy(false);
    }
  }

  function clearChat() {
    if (busy) return;
    setMessages([]);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-3">
        <ModeTab
          active={mode === "ask"}
          label="Ask"
          description="Bible & life questions"
          onClick={() => setMode("ask")}
        />
        <ModeTab
          active={mode === "study"}
          label="Study"
          description="Understand a passage"
          onClick={() => setMode("study")}
        />
        <ModeTab
          active={mode === "devotional"}
          label="Devotional"
          description="Guided reflection & prayer"
          onClick={() => setMode("devotional")}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          Bible version
          <select
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-white/10 dark:bg-slate-900"
          >
            <option value="kjv">KJV</option>
            <option value="niv">NIV</option>
            <option value="nlt">NLT</option>
          </select>
        </label>
        <button
          type="button"
          onClick={clearChat}
          className="text-sm text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
          disabled={busy || messages.length === 0}
        >
          Clear conversation
        </button>
      </div>

      {!configured ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          Guidance is not available. Enable <code className="rounded bg-black/5 px-1">AI_SCRIPTURE_FALLBACK=true</code>{" "}
          or set an AI provider key.
        </div>
      ) : !hasLlm ? (
        <div className="rounded-xl border border-sky-500/30 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:bg-sky-950/30 dark:text-sky-100">
          Free mode: answers come from verified Bible passages (no OpenAI credits needed).
          For richer explanations later, you can add a free{" "}
          <a
            className="underline"
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
          >
            Groq API key
          </a>
          .
        </div>
      ) : null}

      <div className="min-h-80 space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-[#071018]/60">
        {messages.length === 0 ? (
          <div className="space-y-4 py-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Ask a question. Answers are grounded in Scripture from the Harvest Souls
              Bible library — the AI is a tool, not a replacement for God, pastors, or
              counselors.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={!configured || busy}
                  onClick={() => sendMessage(s)}
                  className="rounded-full border border-harvest-gold/30 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-harvest-gold/10 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(input);
        }}
      >
        <label className="block flex-1">
          <span className="sr-only">Ask a question</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            placeholder={
              mode === "devotional"
                ? "Help me make a devotion about…"
                : mode === "study"
                  ? "Enter a passage or ask what a verse means…"
                  : "Ask a Bible or life question…"
            }
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-harvest-blue/30 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
            disabled={!configured || busy}
            maxLength={4000}
          />
        </label>
        <Button type="submit" disabled={!configured || busy || !input.trim()} className="sm:mb-1">
          {busy ? "Thinking…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
