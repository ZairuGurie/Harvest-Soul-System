import Link from "next/link";
import Button from "@/components/ui/Button";
import { fetchBooks, getTranslation } from "@/lib/bible";

export default async function BibleVersion({ params }: { params: Promise<{ version: string }> }) {
  const { version } = await params;
  let books: Awaited<ReturnType<typeof fetchBooks>> = [];
  let translationName = version.toUpperCase();
  let abbreviation = version.toUpperCase();

  try {
    const [bookList, translation] = await Promise.all([fetchBooks(version), getTranslation(version)]);
    books = bookList;
    if (translation) {
      translationName = translation.name;
      abbreviation = translation.abbreviation;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return (
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-amber-500/30 bg-white/95 p-8 shadow-lg dark:bg-[#0b1220]/95">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Books unavailable</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>
          <div className="mt-6">
            <Button variant="outline" href="/bible">
              Back to versions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const oldTestament = books.filter((book) => book.testament === "OT");
  const newTestament = books.filter((book) => book.testament === "NT");

  const renderBookGrid = (section: typeof books) => (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {section.map((book) => (
        <li key={book.slug}>
          <Link
            href={`/bible/${version}/${book.slug}/1`}
            className="group flex h-full flex-col rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-harvest-blue/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-harvest-blue/40 dark:border-white/10 dark:bg-slate-950/70 dark:hover:border-emerald-400/30"
          >
            <span className="text-sm font-semibold leading-snug text-slate-900 group-hover:text-harvest-blue-dark dark:text-white dark:group-hover:text-emerald-300">
              {book.name}
            </span>
            <span className="mt-1.5 text-[11px] font-medium text-slate-400">
              {book.chapters_count} {book.chapters_count === 1 ? "chapter" : "chapters"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/92 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#0b1220]/92">
        <header className="relative border-b border-slate-200/70 px-6 py-7 sm:px-10 dark:border-white/10">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 80% at 0% 0%, rgba(27,109,181,0.12), transparent 55%)",
            }}
            aria-hidden
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-lg bg-harvest-gradient px-2.5 py-1 text-xs font-bold tracking-wide text-white">
                  {abbreviation}
                </span>
                <Button variant="ghost" href="/bible" className="px-2! py-1! text-xs">
                  All versions
                </Button>
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                {translationName}
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                Select a book to begin reading
              </p>
            </div>
            <div className="flex gap-4 text-center">
              <div className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 dark:border-white/10 dark:bg-white/5">
                <p className="text-lg font-bold text-slate-900 dark:text-white">{oldTestament.length}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">OT books</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 dark:border-white/10 dark:bg-white/5">
                <p className="text-lg font-bold text-slate-900 dark:text-white">{newTestament.length}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">NT books</p>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-10 px-6 py-8 sm:px-10 sm:py-10">
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-harvest-blue dark:text-emerald-300">
              Old Testament
            </h2>
            {renderBookGrid(oldTestament)}
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-harvest-green dark:text-emerald-300">
              New Testament
            </h2>
            {renderBookGrid(newTestament)}
          </section>
        </div>
      </section>
    </div>
  );
}
