import { createServerSupabase } from '@/lib/supabaseClient'

import {

  getBookBySlug,

  getNextChapter,

  getPreviousChapter,

  resolveBookKey,

  toBookSummary,

} from './canon'

import { getTranslationBySlug, resolveTranslationKey, SUPPORTED_TRANSLATIONS } from './translations'

import type { BibleBookSummary, BibleChapter, BibleVersion, BibleVerse } from './types'



type TranslationRow = {

  id: string

  slug: string

  name: string

  abbreviation: string

  language: string | null

  copyright: string | null

}



type BookRow = {

  id: string

  slug: string

  name: string

  abbreviation: string

  testament: 'OT' | 'NT'

  chapters_count: number

}



type VerseRow = {

  id: string

  verse_number: number

  text: string

}



function getClient() {

  return createServerSupabase()

}



function toVersion(row: TranslationRow): BibleVersion {

  return {

    id: row.id,

    slug: row.slug,

    name: row.name,

    abbreviation: row.abbreviation,

    language: row.language ?? 'English',

    copyright: row.copyright ?? undefined,

  }

}



function toBookSummaryFromRow(row: BookRow): BibleBookSummary {

  return {

    id: row.slug,

    slug: row.slug,

    name: row.name,

    abbreviation: row.abbreviation,

    chapters_count: row.chapters_count,

    testament: row.testament,

  }

}



async function findTranslation(key: string): Promise<TranslationRow | null> {

  const translation = resolveTranslationKey(key)

  if (!translation) return null



  const supabase = getClient()

  const { data, error } = await supabase

    .from('bible_translations')

    .select('id, slug, name, abbreviation, language, copyright')

    .eq('slug', translation.slug)

    .maybeSingle()



  if (error) throw error

  return data

}



async function findBook(translationId: string, bookKey: string): Promise<BookRow | null> {

  const book = resolveBookKey(bookKey)

  if (!book) return null



  const supabase = getClient()

  const { data, error } = await supabase

    .from('bible_books')

    .select('id, slug, name, abbreviation, testament, chapters_count')

    .eq('translation_id', translationId)

    .eq('slug', book.slug)

    .maybeSingle()



  if (error) throw error

  return data

}



function normalizeChapterNumber(chapterNum: string | number): number {

  const chapter = Number(chapterNum)

  if (!Number.isFinite(chapter) || chapter <= 0) {

    throw new Error('Invalid chapter number')

  }

  return chapter

}



export async function fetchBibles(): Promise<BibleVersion[]> {

  const supabase = getClient()

  const slugs = SUPPORTED_TRANSLATIONS.map((translation) => translation.slug)



  const { data, error } = await supabase

    .from('bible_translations')

    .select('id, slug, name, abbreviation, language, copyright')

    .in('slug', slugs)

    .order('slug', { ascending: true })



  if (error) {

    throw new Error(`Unable to load Bible translations: ${error.message}`)

  }



  const rows = data ?? []

  if (rows.length === 0) {

    throw new Error('No Bible translations found. Run `npm run bible:setup` then `npm run bible:import`.')

  }



  return rows.map(toVersion)

}



export async function fetchBooks(translationKey: string): Promise<BibleBookSummary[]> {

  const translation = await findTranslation(translationKey)

  if (!translation) {

    throw new Error(`Translation not supported: ${translationKey}`)

  }



  const supabase = getClient()

  const { data, error } = await supabase

    .from('bible_books')

    .select('id, slug, name, abbreviation, testament, chapters_count')

    .eq('translation_id', translation.id)

    .order('book_order', { ascending: true })



  if (error) {

    throw new Error(`Unable to load books: ${error.message}`)

  }



  return (data ?? []).map(toBookSummaryFromRow)

}



export async function fetchChapter(

  translationKey: string,

  bookKey: string,

  chapterNum: string | number,

): Promise<BibleChapter> {

  const translation = await findTranslation(translationKey)

  if (!translation) {

    throw new Error(`Translation not supported: ${translationKey}`)

  }



  const book = await findBook(translation.id, bookKey)

  if (!book) {

    throw new Error(`Book not found: ${bookKey}`)

  }



  const chapter = normalizeChapterNumber(chapterNum)

  if (chapter > book.chapters_count) {

    throw new Error(`Chapter ${chapter} does not exist in ${book.name}`)

  }



  const supabase = getClient()

  const { data: chapterRow, error: chapterError } = await supabase

    .from('bible_chapters')

    .select('id')

    .eq('book_id', book.id)

    .eq('chapter_number', chapter)

    .maybeSingle()



  if (chapterError) {

    throw new Error(`Unable to load chapter: ${chapterError.message}`)

  }

  if (!chapterRow) {

    throw new Error(`Chapter ${chapter} not found in ${book.name}`)

  }



  const { data: verseRows, error: verseError } = await supabase

    .from('bible_verses')

    .select('id, verse_number, text')

    .eq('chapter_id', chapterRow.id)

    .order('verse_number', { ascending: true })



  if (verseError) {

    throw new Error(`Unable to load verses: ${verseError.message}`)

  }



  const verses: BibleVerse[] = (verseRows as VerseRow[] | null)?.map((row) => ({

    id: row.id,

    verse: String(row.verse_number),

    text: row.text,

  })) ?? []



  const bookSummary = toBookSummaryFromRow(book)



  return {

    translation: toVersion(translation),

    book: bookSummary,

    chapter,

    verses,

    copyright: translation.copyright ?? undefined,

    previous: getPreviousChapter(book.slug, chapter),

    next: getNextChapter(book.slug, chapter),

  }

}



export async function getTranslation(slug: string): Promise<BibleVersion | null> {

  const translation = getTranslationBySlug(slug)

  if (!translation) return null



  const row = await findTranslation(translation.slug)

  return row ? toVersion(row) : null

}



export async function getBook(slug: string): Promise<BibleBookSummary | null> {

  const book = getBookBySlug(slug)

  return book ? toBookSummary(book) : null

}

