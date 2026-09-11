import Link from "next/link";
import { getAuthUser } from "@/lib/auth/session";
import {
  listAllScenarios,
  loadPlayerProgress,
  listAchievements,
  buildJourneySummary,
  GAME_CHAPTERS,
  TARGET_LEVEL_COUNT,
  TARGET_CHAPTER_COUNT,
  xpIntoLevel,
  EMPTY_PROGRESS,
} from "@/lib/game";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "STAND FIRM | Harvest Souls",
  description:
    "STAND FIRM — a Christian choice and adventure game about avoiding compromise. 10 chapters, 50 levels.",
};

function stateLabel(state: string) {
  if (state === "completed") return "Complete";
  if (state === "in_progress") return "In progress";
  if (state === "available" || state === "current") return "Available";
  return "Locked";
}

function stateClass(state: string) {
  if (state === "completed") {
    return "border-emerald-300/60 bg-emerald-50/80 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
  }
  if (state === "available" || state === "current" || state === "in_progress") {
    return "border-harvest-gold/50 bg-harvest-gold/10 text-slate-900 dark:text-white";
  }
  return "border-slate-200/80 bg-slate-50/50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400";
}

export default async function GameCenterPage() {
  const user = await getAuthUser();
  const scenarios = await listAllScenarios();
  const progress = user ? await loadPlayerProgress(user.id) : null;
  const displayProgress = progress ?? EMPTY_PROGRESS;
  const achievements = listAchievements();
  const journey = buildJourneySummary(displayProgress, scenarios);
  const xpBar = xpIntoLevel(displayProgress.xp);
  const playable = scenarios.filter((s) => s.isActive).length;

  return (
    <div className="container mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-10">
      <section className="hs-motion relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/94 shadow-xl backdrop-blur-md sm:rounded-3xl dark:border-white/10 dark:bg-[#0b1220]/94">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-harvest-blue via-harvest-gold to-harvest-green"
        />

        <header className="border-b border-slate-200/70 px-5 py-6 sm:px-8 dark:border-white/10">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-harvest-blue uppercase dark:text-emerald-300">
            Game Center
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            STAND FIRM
          </h1>
          <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
            A Christian Choice & Adventure · {TARGET_CHAPTER_COUNT} Chapters ·{" "}
            {TARGET_LEVEL_COUNT} Levels
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            Explore chapter maps, meet people facing hard decisions, and practice standing
            firm without compromise. Each choice leads to a consequence, Scripture from the
            Harvest Souls Bible library, and a short reflection.
          </p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            XP and journey levels are game progression only. They are not spiritual worth,
            holiness, or salvation — and this game is not a substitute for Scripture,
            pastoral care, or church leadership.
          </p>
        </header>

        <div className="space-y-6 px-5 py-6 sm:px-8">
          <div className="flex flex-wrap gap-3">
            <Button href="/game/play" variant="primary" className="px-5">
              {journey.currentScenario ? "Continue Journey" : "Enter World"}
            </Button>
            <Button href="/bible" variant="ghost" className="px-5">
              Open Bible
            </Button>
            {!user ? (
              <Button href="/login?next=/game/play" variant="outline" className="px-5">
                Sign in to save progress
              </Button>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5">
            <p className="font-medium text-slate-900 dark:text-white">Your Journey</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Journey Level {displayProgress.level} · XP {xpBar.into} / {xpBar.need} ·{" "}
              {displayProgress.completedScenarioIds.length} / {playable} scenarios · Chapter{" "}
              {displayProgress.currentChapter}
            </p>
            {journey.currentScenario ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Next: Level {journey.currentScenario.levelNumber} —{" "}
                {journey.currentScenario.title}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {playable > 0 &&
                displayProgress.completedScenarioIds.length >= playable
                  ? "You completed the currently available STAND FIRM journey."
                  : "Guests can play available chapters. Progress stays on this device until you sign in."}
              </p>
            )}
            {!user ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Showing guest defaults on this page. Enter the world to use on-device progress.
              </p>
            ) : null}
          </div>

          <section>
            <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
              Chapters
            </h2>
            <ul className="mt-3 space-y-3">
              {GAME_CHAPTERS.map((ch) => {
                const entry = journey.chapters.find((c) => c.id === ch.id);
                const state = entry?.state ?? "locked";
                const levels = entry?.levels ?? [];
                return (
                  <li
                    key={ch.id}
                    className={`rounded-xl border px-3 py-3 ${stateClass(state)}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          Chapter {ch.id} — {ch.title}
                        </p>
                        <p className="mt-0.5 text-xs opacity-80">
                          {ch.subtitle} · Levels {ch.levelStart}–{ch.levelEnd}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-white/50 px-2 py-1 text-[10px] font-semibold tracking-wide uppercase dark:bg-black/20">
                        {stateLabel(state)}
                      </span>
                    </div>
                    {levels.length > 0 ? (
                      <ul className="mt-3 grid gap-1.5 sm:grid-cols-5">
                        {levels.map((lv) => (
                          <li
                            key={lv.id}
                            className="rounded-lg border border-black/5 bg-white/40 px-2 py-1.5 text-[11px] dark:border-white/10 dark:bg-black/20"
                          >
                            <span className="font-semibold">
                              {String(lv.levelNumber).padStart(2, "0")}
                            </span>{" "}
                            <span className="opacity-80">
                              {lv.state === "completed"
                                ? "Done"
                                : lv.state === "current"
                                  ? "Next"
                                  : lv.state === "available"
                                    ? "Open"
                                    : "Locked"}
                            </span>
                            <p className="mt-0.5 truncate opacity-70">{lv.title}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs opacity-70">
                        Coming in a future content update.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
              Achievements
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {achievements.map((a) => {
                const earned = progress?.achievementIds.includes(a.id);
                return (
                  <li
                    key={a.id}
                    className={`rounded-xl border px-3 py-3 text-sm ${
                      earned
                        ? "border-harvest-gold/50 bg-harvest-gold/10"
                        : "border-slate-200/80 dark:border-white/10"
                    }`}
                  >
                    <p className="font-medium text-slate-900 dark:text-white">{a.name}</p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      {a.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Prefer study over play?{" "}
            <Link href="/guidance" className="text-harvest-blue hover:underline dark:text-emerald-300">
              Ask Scripture-grounded AI Guidance
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
