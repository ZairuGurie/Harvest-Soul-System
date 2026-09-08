import GuidanceChat from "@/components/guidance/GuidanceChat";
import { aiPublicStatus } from "@/lib/ai";

export const metadata = {
  title: "AI Guidance | Harvest Souls",
  description:
    "Scripture-grounded AI guidance for Bible study, Christian living, and devotionals.",
};

export default function GuidancePage() {
  const status = aiPublicStatus();
  const configured = status.enabled;
  const usingFallbackOnly = status.enabled && !status.hasLlm;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/94 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#0b1220]/94">
        <header className="border-b border-slate-200/70 px-6 py-6 sm:px-8 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-harvest-blue dark:text-emerald-300">
            Harvest Souls AI
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Scripture-Grounded Guidance
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Ask questions, study a passage, or walk through a guided devotion. Responses
            draw from the Harvest Souls Bible library and are not divine revelation.
          </p>
          {usingFallbackOnly ? (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
              Running in free <strong>Scripture fallback</strong> mode (no paid AI). Answers
              use verified Bible passages from the database.
            </p>
          ) : null}
        </header>

        <div className="px-6 py-6 sm:px-8">
          <GuidanceChat
            configured={configured}
            defaultTranslation={status.defaultTranslation}
            hasLlm={status.hasLlm}
          />
        </div>
      </section>
    </div>
  );
}
