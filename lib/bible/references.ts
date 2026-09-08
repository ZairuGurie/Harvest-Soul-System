import { BIBLE_BOOKS, getBookBySlug, resolveBookKey } from "./canon";
import type { BibleBook } from "./types";

export type ParsedBibleReference = {
  book: BibleBook;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  raw: string;
};

/** Common display names and abbreviations → book slug */
const BOOK_ALIASES: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const book of BIBLE_BOOKS) {
    map[book.slug] = book.slug;
    map[book.apiId.toLowerCase()] = book.slug;
    map[book.name.toLowerCase()] = book.slug;
  }

  const extras: Record<string, string> = {
    genesis: "gen",
    exodus: "exo",
    leviticus: "lev",
    numbers: "num",
    deuteronomy: "deu",
    joshua: "jos",
    judges: "jdg",
    ruth: "rut",
    "1 samuel": "1sa",
    "2 samuel": "2sa",
    "1 kings": "1ki",
    "2 kings": "2ki",
    "1 chronicles": "1ch",
    "2 chronicles": "2ch",
    ezra: "ezr",
    nehemiah: "neh",
    esther: "est",
    job: "job",
    psalm: "psa",
    psalms: "psa",
    ps: "psa",
    proverb: "pro",
    proverbs: "pro",
    prov: "pro",
    ecclesiastes: "ecc",
    "song of solomon": "sng",
    "song of songs": "sng",
    songs: "sng",
    isaiah: "isa",
    jeremiah: "jer",
    lamentations: "lam",
    ezekiel: "ezk",
    daniel: "dan",
    hosea: "hos",
    joel: "jol",
    amos: "amo",
    obadiah: "oba",
    jonah: "jon",
    micah: "mic",
    nahum: "nam",
    habakkuk: "hab",
    zephaniah: "zep",
    haggai: "hag",
    zechariah: "zec",
    malachi: "mal",
    matthew: "mat",
    matt: "mat",
    mt: "mat",
    mark: "mrk",
    mk: "mrk",
    luke: "luk",
    lk: "luk",
    john: "jhn",
    jn: "jhn",
    acts: "act",
    romans: "rom",
    rom: "rom",
    "1 corinthians": "1co",
    "2 corinthians": "2co",
    "i corinthians": "1co",
    "ii corinthians": "2co",
    galatians: "gal",
    gal: "gal",
    ephesians: "eph",
    eph: "eph",
    philippians: "php",
    phil: "php",
    colossians: "col",
    col: "col",
    "1 thessalonians": "1th",
    "2 thessalonians": "2th",
    "1 timothy": "1ti",
    "2 timothy": "2ti",
    titus: "tit",
    philemon: "phm",
    hebrews: "heb",
    heb: "heb",
    james: "jas",
    jas: "jas",
    "1 peter": "1pe",
    "2 peter": "2pe",
    "1 john": "1jn",
    "2 john": "2jn",
    "3 john": "3jn",
    jude: "jud",
    revelation: "rev",
    rev: "rev",
    apocalypse: "rev",
  };

  for (const [alias, slug] of Object.entries(extras)) {
    map[alias] = slug;
  }
  return map;
})();

export function resolveBookName(name: string): BibleBook | undefined {
  const key = name.trim().toLowerCase().replace(/\s+/g, " ");
  const byKey = resolveBookKey(key);
  if (byKey) return byKey;

  const slug = BOOK_ALIASES[key];
  if (slug) return getBookBySlug(slug);

  // Strip trailing punctuation
  const cleaned = key.replace(/[.,;:!?]+$/g, "");
  const slug2 = BOOK_ALIASES[cleaned];
  if (slug2) return getBookBySlug(slug2);

  return undefined;
}

/**
 * Parse a single reference like "Philippians 4:6-7", "John 3:16", "Psalm 23".
 */
export function parseBibleReference(raw: string): ParsedBibleReference | null {
  const input = raw.trim();
  if (!input) return null;

  // Book name (possibly numbered) + chapter [:verse[-verse]]
  const match = input.match(
    /^((?:1|2|3|I{1,3}|i{1,3})\s+)?([A-Za-z][A-Za-z.\s]*?)\s+(\d+)(?::(\d+)(?:\s*[-–—]\s*(\d+))?)?$/
  );
  if (!match) return null;

  const bookName = `${match[1] ?? ""}${match[2]}`.trim();
  const book = resolveBookName(bookName);
  if (!book) return null;

  const chapter = Number(match[3]);
  if (!Number.isFinite(chapter) || chapter < 1 || chapter > book.chapters) return null;

  const verseStart = match[4] ? Number(match[4]) : undefined;
  const verseEnd = match[5] ? Number(match[5]) : verseStart;

  if (verseStart !== undefined) {
    if (!Number.isFinite(verseStart) || verseStart < 1) return null;
    if (verseEnd !== undefined && (verseEnd < verseStart || !Number.isFinite(verseEnd))) return null;
  }

  return {
    book,
    chapter,
    verseStart,
    verseEnd: verseEnd ?? verseStart,
    raw: input,
  };
}

/** Extract candidate references from free text. */
export function extractBibleReferences(text: string): ParsedBibleReference[] {
  const pattern =
    /\b((?:1|2|3|I{1,3})\s+)?([A-Za-z][A-Za-z.]*(?:\s+[A-Za-z][A-Za-z.]*){0,3})\s+(\d+)(?::(\d+)(?:\s*[-–—]\s*(\d+))?)?\b/g;

  const found: ParsedBibleReference[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    const candidate = m[0];
    const parsed = parseBibleReference(candidate);
    if (!parsed) continue;
    const key = `${parsed.book.slug}:${parsed.chapter}:${parsed.verseStart ?? ""}-${parsed.verseEnd ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push(parsed);
  }
  return found;
}

export function formatReference(ref: ParsedBibleReference): string {
  const base = `${ref.book.name} ${ref.chapter}`;
  if (ref.verseStart == null) return base;
  if (ref.verseEnd != null && ref.verseEnd !== ref.verseStart) {
    return `${base}:${ref.verseStart}-${ref.verseEnd}`;
  }
  return `${base}:${ref.verseStart}`;
}
