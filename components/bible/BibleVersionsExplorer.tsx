"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BibleVersion } from "@/lib/bible/types";

const BLURBS: Record<string, string> = {
  kjv: "The classic English Bible of 1611 — poetic language for worship and study.",
  niv: "Clear, accurate modern English trusted in churches worldwide.",
  nlt: "Easy-to-read thought-for-thought translation for daily devotion.",
};

const ACCENTS: Record<string, string> = {
  kjv: "from-[#1b6db5] to-[#155a94]",
  niv: "from-[#2b8a3e] to-[#1f6b30]",
  nlt: "from-[#c9a227] to-[#a6851f]",
};

type Props = {
  versions: BibleVersion[];
};

export default function BibleVersionsExplorer({ versions }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return versions;
    return versions.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.abbreviation.toLowerCase().includes(q) ||
        v.slug.toLowerCase().includes(q)
    );
  }, [query, versions]);

  return (
    <div className="space-y-8">
      <div className="relative">
        <label htmlFor="bible-version-search" className="sr-only">
          Search Bible versions
        </label>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </div>
        <input
          id="bible-version-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search versions — KJV, NIV, NLT"
          className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-3.5 pl-11 pr-24 text-sm text-slate-900 shadow-sm outline-none ring-harvest-blue/30 placeholder:text-slate-400 focus:ring-2 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-0 my-1.5 mr-1.5 rounded-lg px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Clear
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300/80 bg-white/70 px-5 py-10 text-center text-sm text-slate-600 dark:border-white/15 dark:bg-slate-950/60 dark:text-slate-300">
          No versions match “{query}”.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((version, index) => {
            const accent = ACCENTS[version.slug] ?? "from-[#1b6db5] to-[#2b8a3e]";
            const blurb =
              BLURBS[version.slug] ??
              `${version.language || "English"} translation of the Holy Bible.`;

            return (
              <li
                key={version.slug}
                className="group animate-bible-rise"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <Link
                  href={`/bible/${version.slug}`}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-md outline-none transition duration-300 hover:-translate-y-1 hover:border-harvest-blue/35 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-harvest-blue/50 dark:border-white/10 dark:bg-[#0b1220]/95 dark:hover:border-emerald-400/30"
                >
                  <div className={`h-1.5 bg-linear-to-r ${accent}`} />
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`inline-flex h-12 min-w-12 items-center justify-center rounded-xl bg-linear-to-br ${accent} px-2.5 text-sm font-bold tracking-wide text-white shadow-sm`}
                      >
                        {version.abbreviation}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:bg-white/10 dark:text-slate-300">
                        {version.language || "English"}
                      </span>
                    </div>

                    <h2 className="mt-4 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                      {version.name}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {blurb}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/10">
                      <span className="text-xs font-medium text-slate-400">66 books</span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-harvest-blue-dark transition group-hover:gap-2.5 dark:text-emerald-300">
                        Open
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

    </div>
  );
}
