export type Testament = 'OT' | 'NT'

export type BibleBook = {
  slug: string
  apiId: string
  name: string
  chapters: number
  testament: Testament
  order: number
}

export type BibleTranslation = {
  slug: string
  name: string
  abbreviation: string
  apiAbbreviations: string[]
  apiId?: string
}

export type BibleVersion = {
  id: string
  slug: string
  name: string
  abbreviation: string
  language?: string
  copyright?: string
}

export type BibleBookSummary = {
  id: string
  slug: string
  name: string
  abbreviation: string
  chapters_count: number
  testament: Testament
}

export type BibleVerse = {
  id: string
  verse: string
  text: string
}

export type ChapterNavigation = {
  book: string
  chapter: number
} | null

export type BibleChapter = {
  translation: BibleVersion
  book: BibleBookSummary
  chapter: number
  verses: BibleVerse[]
  copyright?: string
  previous: ChapterNavigation
  next: ChapterNavigation
}
