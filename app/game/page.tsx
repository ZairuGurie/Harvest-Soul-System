import Link from "next/link";
import { getAuthUser } from "@/lib/auth/session";
import { listScenarios, loadPlayerProgress, listAchievements } from "@/lib/game";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "STAND FIRM | Harvest Souls",
  description:
    "STAND FIRM — a Christian choice and adventure game about avoiding compromise.",
};

export default async function GameCenterPage() {
  const user = await getAuthUser();
  const scenarios = await listScenarios(1);
  const progress = user ? await loadPlayerProgress(user.id) : null;
  const achievements = listAchievements();

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
            A Christian Choice & Adventure
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            Walk a small 3D village, meet people facing hard decisions, and practice standing
            firm without compromise. Each choice leads to a consequence, Scripture from the
            Harvest Souls Bible library, and a short reflection.
          </p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            XP and achievements are game progression only. They are not spiritual worth, and
            this game is not a substitute for Scripture, pastoral care, or church leadership.
          </p>
        </header>

        <div className="space-y-6 px-5 py-6 sm:px-8">
          <div className="flex flex-wrap gap-3">
            <Button href="/game/play" variant="primary" className="px-5">
              Enter Village
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

          {progress ? (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5">
              <p className="font-medium text-slate-900 dark:text-white">Your cloud progress</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                Level {progress.level} · {progress.xp} XP · {progress.completedScenarioIds.length}{" "}
                scenarios completed
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 dark:border-white/15 dark:text-slate-300">
              Guests can play Chapter 1. Progress stays on this device until you sign in.
            </div>
          )}

          <section>
            <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
              Chapter 1 — Village Path
            </h2>
            <ul className="mt-3 space-y-2">
              {scenarios.map((s) => {
                const done = progress?.completedScenarioIds.includes(s.id);
                return (
                  <li
                    key={s.id}
                    className="hs-motion flex items-start justify-between gap-3 rounded-xl border border-slate-200/80 px-3 py-3 dark:border-white/10"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {s.title}
                        {done ? (
                          <span className="ml-2 text-xs font-normal text-emerald-600 dark:text-emerald-300">
                            Completed
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Meet {s.npcName} · Scripture: {s.scriptureReference}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-600 uppercase dark:bg-white/10 dark:text-slate-300">
                      {s.theme.replaceAll("_", " ")}
                    </span>
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
