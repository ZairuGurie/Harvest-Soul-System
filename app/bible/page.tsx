import Button from "@/components/ui/Button";
import BibleVersionsExplorer from "@/components/bible/BibleVersionsExplorer";
import { fetchBibles } from "@/lib/bible";

export default async function BibleIndex() {
  let bibles: Awaited<ReturnType<typeof fetchBibles>> = [];

  try {
    bibles = await fetchBibles();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return (
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-amber-500/30 bg-white/95 p-8 shadow-lg dark:bg-[#0b1220]/95">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-harvest-blue dark:text-emerald-300">
            Holy Bible
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bible unavailable
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Unable to load translations: {message}
          </p>
          <p className="mt-4 text-xs text-slate-500">
            Run <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-white/10">npm run bible:setup</code>{" "}
            then{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-white/10">npm run bible:import</code>{" "}
            to load KJV, NIV, and NLT.
          </p>
          <div className="mt-6">
            <Button variant="outline" href="/">
              Back home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/92 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#0b1220]/92">
        <div className="relative border-b border-slate-200/70 px-6 py-8 sm:px-10 sm:py-10 dark:border-white/10">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(ellipse 70% 80% at 0% 0%, rgba(27,109,181,0.14), transparent 55%), radial-gradient(ellipse 60% 70% at 100% 20%, rgba(43,138,62,0.12), transparent 50%)",
            }}
            aria-hidden
          />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-harvest-blue dark:text-emerald-300">
                  Holy Bible
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                  Choose a translation
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
                  Read Scripture in KJV, NIV, or NLT. Select a version to browse books and chapters.
                </p>
              </div>
              <Button variant="ghost" href="/" className="shrink-0">
                Home
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {["KJV", "NIV", "NLT"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200/90 bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-300"
                >
                  {tag}
                </span>
              ))}
              <span className="rounded-full border border-slate-200/90 bg-white/80 px-3 py-1 text-xs font-medium text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-400">
                English · Offline in Supabase
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-10 sm:py-10">
          <BibleVersionsExplorer versions={bibles} />
        </div>
      </section>
    </div>
  );
}
