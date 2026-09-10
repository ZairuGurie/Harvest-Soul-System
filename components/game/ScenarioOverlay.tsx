"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PlayerProgressState } from "@/lib/game/types";

type ChoiceOption = {
  id: string;
  sortOrder: number;
  choiceText: string;
};

type ScenarioPayload = {
  id: string;
  title: string;
  situation: string;
  scriptureReference: string;
  explanation: string;
  reflectionPrompt: string;
  npcName: string;
  choices: ChoiceOption[];
};

type ScripturePayload = {
  reference: string;
  text: string;
  translation: string;
  href: string;
} | null;

export type ScenarioResolvePayload = {
  error?: string;
  alreadyCompleted?: boolean;
  choice?: { id: string; choiceText: string; consequence: string };
  scenario?: {
    id: string;
    title: string;
    explanation: string;
    reflectionPrompt: string;
    scriptureReference: string;
  };
  scripture?: ScripturePayload;
  progress?: {
    xpEarned: number;
    xp: number;
    level: number;
    leveledUp: boolean;
    newlyEarnedAchievements: Array<{ id: string; name: string; description: string }>;
  };
  saved?: boolean;
};

export default function ScenarioOverlay({
  scenarioId,
  npcName,
  localProgress,
  onClose,
  onResolved,
}: {
  scenarioId: string;
  npcName: string;
  localProgress: PlayerProgressState;
  onClose: () => void;
  onResolved: (data: ScenarioResolvePayload) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<ScenarioPayload | null>(null);
  const [step, setStep] = useState<"situation" | "result">("situation");
  const [result, setResult] = useState<ScenarioResolvePayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/game/scenario?id=${encodeURIComponent(scenarioId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load this scenario.");
        if (cancelled) return;
        setScenario(data.scenario as ScenarioPayload);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unable to load this game content.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scenarioId]);

  async function choose(choiceId: string) {
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch("/api/game/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, choiceId, localProgress }),
      });
      const data = (await res.json()) as ScenarioResolvePayload;
      if (!res.ok) throw new Error(data.error || "Unable to resolve this choice.");
      setResult(data);
      setStep("result");
      onResolved(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="absolute inset-0 z-30 flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scenario-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b1220]">
        <div className="border-b border-slate-200/80 px-4 py-3 sm:px-5 dark:border-white/10">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-harvest-blue uppercase dark:text-emerald-300">
            Conversation with {npcName}
          </p>
          <h2 id="scenario-title" className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {scenario?.title || "Loading scenario…"}
          </h2>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5">
          {loading ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">Loading scenario…</p>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-50 px-3 py-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
              <p>{error}</p>
              <p className="mt-2 text-xs opacity-80">
                Unable to load this game content. Please return to Game Center and try again.
              </p>
            </div>
          ) : null}

          {!loading && scenario && step === "situation" ? (
            <>
              <section>
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Situation
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                  {scenario.situation}
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Your Decision
                </h3>
                {scenario.choices
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((choice, index) => (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={submitting}
                      onClick={() => choose(choice.id)}
                      className="hs-motion w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-800 hover:border-harvest-blue/40 hover:bg-white hover:shadow-sm disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-harvest-gold/40"
                    >
                      <span className="mr-2 font-semibold text-harvest-blue dark:text-emerald-300">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {choice.choiceText}
                    </button>
                  ))}
              </section>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scripture related to this moment will appear after you choose. XP is game progress
                only — not a measure of faith.
              </p>
            </>
          ) : null}

          {!loading && result && step === "result" ? (
            <>
              <section>
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Your Decision
                </h3>
                <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-white">
                  {result.choice?.choiceText}
                </p>
              </section>
              <section>
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Consequence
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                  {result.choice?.consequence}
                </p>
              </section>
              <section className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-3">
                <h3 className="text-xs font-semibold tracking-wide text-emerald-800 uppercase dark:text-emerald-300">
                  Scripture
                </h3>
                {result.scripture ? (
                  <>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {result.scripture.reference}{" "}
                      <span className="font-normal text-slate-500">
                        ({result.scripture.translation})
                      </span>
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                      {result.scripture.text}
                    </p>
                    <Link
                      href={result.scripture.href}
                      className="mt-2 inline-block text-xs font-medium text-harvest-blue hover:underline dark:text-emerald-300"
                    >
                      Open in Bible reader
                    </Link>
                  </>
                ) : (
                  <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-200">
                    Reference: {result.scenario?.scriptureReference}. Scripture text could not be
                    loaded from the Bible library right now.
                  </p>
                )}
              </section>
              <section>
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Explanation
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                  {result.scenario?.explanation}
                </p>
              </section>
              <section>
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Reflection
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                  {result.scenario?.reflectionPrompt}
                </p>
              </section>
              {result.progress ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {result.alreadyCompleted
                    ? "You already completed this scenario earlier."
                    : `+${result.progress.xpEarned} XP · Level ${result.progress.level}`}
                  {result.progress.leveledUp ? " · Level up!" : ""}
                  {result.saved === false
                    ? " · Progress kept on this device until you sign in."
                    : result.saved
                      ? " · Progress saved."
                      : ""}
                </p>
              ) : null}
              {result.progress?.newlyEarnedAchievements?.length ? (
                <ul className="space-y-1 text-xs text-harvest-blue-dark dark:text-emerald-200">
                  {result.progress.newlyEarnedAchievements.map((a) => (
                    <li key={a.id}>
                      Achievement unlocked: {a.name} — {a.description}
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200/80 px-4 py-3 sm:px-5 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="hs-motion rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
          >
            {step === "result" ? "Continue" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
