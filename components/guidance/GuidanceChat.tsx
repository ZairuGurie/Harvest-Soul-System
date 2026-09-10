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
      className={`guidance-motion group relative overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-harvest-gold/50 ${
        active
          ? "border-harvest-gold/55 bg-harvest-gold/15 text-slate-900 shadow-sm shadow-harvest-gold/10 dark:text-white"
          : "border-slate-200/70 bg-white/70 text-slate-600 hover:-translate-y-0.5 hover:border-harvest-blue/30 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-harvest-gold/30 dark:hover:bg-white/10"
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-x-0 bottom-0 h-0.5 origin-left bg-linear-to-r from-harvest-blue to-harvest-gold transition-transform duration-300 ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
      <span className="block text-sm font-semibold transition-colors duration-200 group-hover:text-harvest-blue-dark dark:group-hover:text-harvest-wheat">
        {label}
      </span>
      <span className="mt-0.5 block text-xs opacity-80 transition-opacity duration-200 group-hover:opacity-100">
        {description}
      </span>
    </button>
  );
}

function ScriptureCards({ items }: { items: ScriptureItem[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {items.map((s, index) => (
        <details
          key={`${s.reference}-${s.href}`}
          className="guidance-motion group/verse animate-guidance-fade-up rounded-lg border border-emerald-500/20 bg-emerald-500/5 transition-all duration-300 open:bg-emerald-500/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:shadow-sm"
          style={{ animationDelay: `${Math.min(index, 5) * 40}ms` }}
        >
          <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-emerald-800 transition-colors duration-200 marker:content-none dark:text-emerald-200 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex w-full items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-2">
                <Link
                  href={s.href}
                  className="truncate underline decoration-emerald-500/40 underline-offset-2 transition-colors duration-200 hover:text-harvest-green hover:decoration-emerald-400"
                  onClick={(e) => e.stopPropagation()}
                >
                  {s.reference}
                </Link>
                <span className="shrink-0 text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  {s.translation.abbreviation}
                </span>
              </span>
              <span
                aria-hidden
                className="text-emerald-600/70 transition-transform duration-300 group-open/verse:rotate-180 dark:text-emerald-300/70"
              >
                ▾
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
    <div
      className={`guidance-motion animate-guidance-fade-up flex ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[95%] rounded-2xl px-3.5 py-3 text-sm leading-relaxed transition-shadow duration-300 sm:max-w-[85%] sm:px-4 ${
          isUser
            ? "bg-harvest-blue text-white shadow-sm shadow-harvest-blue/20 hover:shadow-md hover:shadow-harvest-blue/25"
            : message.error
              ? "border border-amber-500/40 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
              : "border border-slate-200/80 bg-white text-slate-800 hover:border-harvest-gold/25 hover:shadow-md dark:border-white/10 dark:bg-[#0f1a2a] dark:text-slate-100 dark:hover:border-harvest-gold/30"
        }`}
      >
        {message.loading ? (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
            <span className="inline-flex gap-1" aria-hidden>
              <span className="guidance-loading-dot h-1.5 w-1.5 rounded-full bg-harvest-gold" />
              <span
                className="guidance-loading-dot h-1.5 w-1.5 rounded-full bg-harvest-gold"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="guidance-loading-dot h-1.5 w-1.5 rounded-full bg-harvest-gold"
                style={{ animationDelay: "0.4s" }}
              />
            </span>
            <p className="animate-pulse">
              Finding relevant Scripture and preparing a response…
            </p>
          </div>
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
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
            className="guidance-motion rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm transition-all duration-200 hover:border-harvest-blue/40 focus:border-harvest-blue focus:outline-none focus:ring-2 focus:ring-harvest-blue/25 dark:border-white/10 dark:bg-slate-900 dark:hover:border-harvest-gold/40"
          >
            <option value="kjv">KJV</option>
            <option value="niv">NIV</option>
            <option value="nlt">NLT</option>
          </select>
        </label>
        <button
          type="button"
          onClick={clearChat}
          className="guidance-motion text-sm text-slate-500 underline-offset-2 transition-colors duration-200 hover:text-harvest-blue hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:no-underline dark:text-slate-400 dark:hover:text-harvest-wheat"
          disabled={busy || messages.length === 0}
        >
          Clear conversation
        </button>
      </div>

      {!configured ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          Guidance is not available. Enable{" "}
          <code className="rounded bg-black/5 px-1">AI_SCRIPTURE_FALLBACK=true</code> or
          set an AI provider key.
        </div>
      ) : !hasLlm ? (
        <div className="rounded-xl border border-sky-500/30 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:bg-sky-950/30 dark:text-sky-100">
          Free mode: answers come from verified Bible passages (no OpenAI credits needed).
          For richer explanations later, you can add a free{" "}
          <a
            className="underline decoration-sky-400/50 underline-offset-2 transition-colors duration-200 hover:text-harvest-blue hover:decoration-harvest-blue"
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
          >
            Groq API key
          </a>
          .
        </div>
      ) : null}

      <div className="min-h-72 space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 transition-colors duration-300 sm:min-h-80 sm:p-4 dark:border-white/10 dark:bg-[#071018]/60">
        {messages.length === 0 ? (
          <div className="space-y-4 py-5 text-center sm:py-6">
            <p className="mx-auto max-w-md text-sm text-slate-600 dark:text-slate-300">
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
                  className="guidance-motion rounded-full border border-harvest-gold/30 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-harvest-gold/60 hover:bg-harvest-gold/15 hover:shadow-md active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-harvest-gold/40 dark:hover:bg-harvest-gold/10"
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
            className="guidance-motion w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 hover:border-harvest-blue/35 focus:border-harvest-blue focus:ring-2 focus:ring-harvest-blue/25 dark:border-white/10 dark:bg-slate-900 dark:hover:border-harvest-gold/35 dark:focus:border-harvest-gold"
            disabled={!configured || busy}
            maxLength={4000}
          />
        </label>
        <Button
          type="submit"
          disabled={!configured || busy || !input.trim()}
          className="guidance-motion w-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 sm:mb-1 sm:w-auto"
        >
          {busy ? "Thinking…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
