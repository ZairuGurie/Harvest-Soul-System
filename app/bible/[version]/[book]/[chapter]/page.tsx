import Button from "@/components/ui/Button";
import ChapterNavigator from "@/components/bible/ChapterNavigator";
import { fetchChapter } from "@/lib/bible";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ version: string; book: string; chapter: string }>;
}) {
  const { version, book, chapter } = await params;
  let chapterData: Awaited<ReturnType<typeof fetchChapter>> | null = null;

  try {
    chapterData = await fetchChapter(version, book, chapter);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-amber-500/30 bg-white/95 p-8 shadow-lg dark:bg-[#0b1220]/95">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chapter unavailable</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>
          <div className="mt-6">
            <Button variant="outline" href={`/bible/${version}`}>
              Back to books
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { verses, translation, book: bookInfo, previous, next } = chapterData;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <article className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/94 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#0b1220]/94">
        <header className="border-b border-slate-200/70 px-6 py-6 sm:px-9 dark:border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-harvest-blue dark:text-emerald-300">
                {translation.abbreviation}
              </p>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                {bookInfo.name} {chapterData.chapter}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{translation.name}</p>
            </div>
            <Button variant="ghost" href={`/bible/${version}`} className="shrink-0">
              All books
            </Button>
          </div>
        </header>

        <div className="border-b border-slate-200/70 px-6 py-4 sm:px-9 dark:border-white/10">
          <ChapterNavigator
            version={version}
            book={bookInfo.slug}
            chapter={chapterData.chapter}
            maxChapter={bookInfo.chapters_count}
            previous={previous}
            next={next}
          />
        </div>

        <div className="px-6 py-8 sm:px-9 sm:py-10">
          {verses.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">No verses found for this chapter.</p>
          ) : (
            <div className="space-y-1 text-[1.05rem] leading-[1.85] text-slate-800 dark:text-slate-100">
              {verses.map((verse) => (
                <p key={verse.id} className="group">
                  <sup className="mr-1.5 select-none text-[0.7rem] font-bold text-harvest-blue/80 dark:text-emerald-400/90">
                    {verse.verse}
                  </sup>
                  <span>{verse.text}</span>
                </p>
              ))}
            </div>
          )}

          {chapterData.copyright ? (
            <p className="mt-10 border-t border-slate-200/70 pt-5 text-xs leading-relaxed text-slate-500 dark:border-white/10 dark:text-slate-400">
              {chapterData.copyright}
            </p>
          ) : null}
        </div>

        <footer className="border-t border-slate-200/70 px-6 py-4 sm:px-9 dark:border-white/10">
          <ChapterNavigator
            version={version}
            book={bookInfo.slug}
            chapter={chapterData.chapter}
            maxChapter={bookInfo.chapters_count}
            previous={previous}
            next={next}
          />
        </footer>
      </article>
    </div>
  );
}
