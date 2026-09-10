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
    <div className="container mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-10 lg:py-12">
      <section className="guidance-motion group/panel relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/94 shadow-xl backdrop-blur-md transition-shadow duration-300 hover:shadow-2xl sm:rounded-3xl dark:border-white/10 dark:bg-[#0b1220]/94">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-harvest-blue via-harvest-gold to-harvest-green opacity-80 transition-opacity duration-300 group-hover/panel:opacity-100"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-harvest-gold/10 blur-3xl transition-transform duration-500 group-hover/panel:scale-110"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-harvest-blue/10 blur-3xl transition-transform duration-500 group-hover/panel:scale-110"
        />

        <header className="relative border-b border-slate-200/70 px-4 py-5 sm:px-8 sm:py-6 dark:border-white/10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-harvest-blue sm:text-xs dark:text-emerald-300">
            Harvest Souls AI
          </p>
          <h1 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-3xl dark:text-white">
            Scripture-Grounded Guidance
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-[15px] dark:text-slate-300">
            Ask questions, study a passage, or walk through a guided devotion. Responses
            draw from the Harvest Souls Bible library and are not divine revelation.
          </p>
          {usingFallbackOnly ? (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2 text-xs text-amber-950 transition-colors duration-200 dark:bg-amber-950/40 dark:text-amber-100">
              Running in free <strong>Scripture fallback</strong> mode (no paid AI). Answers
              use verified Bible passages from the database.
            </p>
          ) : null}
        </header>

        <div className="relative px-4 py-5 sm:px-8 sm:py-6">
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
