import { fetchChapter } from "./bibleService";
import {
  formatReference,
  parseBibleReference,
  type ParsedBibleReference,
} from "./references";
import type { BibleVerse, BibleVersion } from "./types";

export type ScripturePassage = {
  reference: string;
  bookSlug: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  translation: Pick<BibleVersion, "slug" | "name" | "abbreviation">;
  text: string;
  verses: Array<{ verse: number; text: string }>;
  href: string;
};

function filterVerses(
  verses: BibleVerse[],
  verseStart?: number,
  verseEnd?: number
): Array<{ verse: number; text: string }> {
  const mapped = verses.map((v) => ({
    verse: Number(v.verse),
    text: v.text,
  }));
  if (verseStart == null) return mapped;
  const end = verseEnd ?? verseStart;
  return mapped.filter((v) => v.verse >= verseStart && v.verse <= end);
}

export async function fetchPassage(
  translationKey: string,
  ref: ParsedBibleReference | string
): Promise<ScripturePassage | null> {
  const parsed = typeof ref === "string" ? parseBibleReference(ref) : ref;
  if (!parsed) return null;

  try {
    const chapter = await fetchChapter(
      translationKey,
      parsed.book.slug,
      parsed.chapter
    );
    const verses = filterVerses(chapter.verses, parsed.verseStart, parsed.verseEnd);
    if (verses.length === 0) return null;

    // If a specific verse was requested but missing, treat as invalid.
    if (parsed.verseStart != null) {
      const hasStart = verses.some((v) => v.verse === parsed.verseStart);
      if (!hasStart) return null;
    }

    const reference =
      parsed.verseStart != null
        ? formatReference(parsed)
        : `${parsed.book.name} ${parsed.chapter}`;

    const text = verses.map((v) => `${v.verse} ${v.text}`).join(" ");

    return {
      reference,
      bookSlug: parsed.book.slug,
      chapter: parsed.chapter,
      verseStart: parsed.verseStart,
      verseEnd: parsed.verseEnd,
      translation: {
        slug: chapter.translation.slug,
        name: chapter.translation.name,
        abbreviation: chapter.translation.abbreviation,
      },
      text,
      verses,
      href: `/bible/${chapter.translation.slug}/${parsed.book.slug}/${parsed.chapter}`,
    };
  } catch {
    return null;
  }
}

export async function fetchPassages(
  translationKey: string,
  refs: Array<ParsedBibleReference | string>,
  limit = 6
): Promise<ScripturePassage[]> {
  const out: ScripturePassage[] = [];
  const seen = new Set<string>();

  for (const ref of refs) {
    if (out.length >= limit) break;
    const passage = await fetchPassage(translationKey, ref);
    if (!passage) continue;
    const key = `${passage.bookSlug}:${passage.chapter}:${passage.verseStart ?? ""}-${passage.verseEnd ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(passage);
  }

  return out;
}
