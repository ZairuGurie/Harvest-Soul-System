import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal, requireEnv } from './lib/env.mjs'
import { BIBLE_BOOKS } from './lib/canon.mjs'
import { ensureBibleSchema } from './setup-bible-db.mjs'

loadEnvLocal()

const TRANSLATIONS = [
  {
    slug: 'kjv',
    name: 'King James Version',
    abbreviation: 'KJV',
    copyright: 'Public Domain',
    sourceUrl:
      'https://raw.githubusercontent.com/Amosamevor/Bible-json/main/versions/en/KING%20JAMES%20BIBLE.json',
  },
  {
    slug: 'niv',
    name: 'New International Version',
    abbreviation: 'NIV',
    copyright: 'Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.',
    sourceUrl:
      'https://raw.githubusercontent.com/Amosamevor/Bible-json/main/versions/en/NEW%20INTERNATIONAL%20VERSION.json',
  },
  {
    slug: 'nlt',
    name: 'New Living Translation',
    abbreviation: 'NLT',
    copyright: 'Copyright © 1996, 2004, 2015 by Tyndale House Foundation.',
    sourceUrl:
      'https://raw.githubusercontent.com/Amosamevor/Bible-json/main/versions/en/NEW%20LIVING%20TRANSLATION.json',
  },
]

const VERSE_BATCH_SIZE = 500

function createSupabaseAdmin() {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function downloadTranslationJson(url) {
  console.log(`  Downloading ${url}`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

async function clearBibleData(supabase) {
  console.log('Clearing existing Bible data...')
  const tables = ['bible_verses', 'bible_chapters', 'bible_books', 'bible_translations']
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error && !error.message.includes('Could not find the table')) {
      throw error
    }
  }
}

async function upsertTranslation(supabase, translation) {
  const { data, error } = await supabase
    .from('bible_translations')
    .upsert(
      {
        slug: translation.slug,
        name: translation.name,
        abbreviation: translation.abbreviation,
        language: 'English',
        copyright: translation.copyright,
      },
      { onConflict: 'slug' },
    )
    .select('id, slug')
    .single()

  if (error) throw error
  return data
}

async function upsertBook(supabase, translationId, book) {
  const { data, error } = await supabase
    .from('bible_books')
    .upsert(
      {
        translation_id: translationId,
        slug: book.slug,
        name: book.name,
        abbreviation: book.apiId,
        testament: book.testament,
        book_order: book.order,
        chapters_count: book.chapters,
      },
      { onConflict: 'translation_id,slug' },
    )
    .select('id, slug')
    .single()

  if (error) throw error
  return data
}

async function upsertChapter(supabase, bookId, chapterNumber) {
  const { data, error } = await supabase
    .from('bible_chapters')
    .upsert(
      {
        book_id: bookId,
        chapter_number: chapterNumber,
      },
      { onConflict: 'book_id,chapter_number' },
    )
    .select('id')
    .single()

  if (error) throw error
  return data
}

async function insertVerseBatch(supabase, rows) {
  if (rows.length === 0) return
  const { error } = await supabase.from('bible_verses').insert(rows)
  if (error) throw error
}

async function importTranslation(supabase, translation) {
  console.log(`\nImporting ${translation.abbreviation}...`)
  const json = await downloadTranslationJson(translation.sourceUrl)
  const translationRow = await upsertTranslation(supabase, translation)

  let totalVerses = 0

  for (const book of BIBLE_BOOKS) {
    const bookJson = json[book.name]
    if (!bookJson) {
      throw new Error(`Book "${book.name}" missing from ${translation.abbreviation} source JSON`)
    }

    const bookRow = await upsertBook(supabase, translationRow.id, book)
    let verseBatch = []

    for (let chapterNumber = 1; chapterNumber <= book.chapters; chapterNumber += 1) {
      const chapterJson = bookJson[String(chapterNumber)]
      if (!chapterJson) {
        throw new Error(
          `${translation.abbreviation} ${book.name} chapter ${chapterNumber} missing in source JSON`,
        )
      }

      const chapterRow = await upsertChapter(supabase, bookRow.id, chapterNumber)
      const verseNumbers = Object.keys(chapterJson)
        .map(Number)
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => a - b)

      for (const verseNumber of verseNumbers) {
        verseBatch.push({
          chapter_id: chapterRow.id,
          verse_number: verseNumber,
          text: String(chapterJson[String(verseNumber)] ?? '').trim(),
        })

        if (verseBatch.length >= VERSE_BATCH_SIZE) {
          await insertVerseBatch(supabase, verseBatch)
          totalVerses += verseBatch.length
          verseBatch = []
        }
      }
    }

    if (verseBatch.length > 0) {
      await insertVerseBatch(supabase, verseBatch)
      totalVerses += verseBatch.length
    }

    process.stdout.write(`  ${book.name} (${book.chapters} chapters)\n`)
  }

  console.log(`  Done: ${totalVerses.toLocaleString()} verses imported for ${translation.abbreviation}`)
}

async function main() {
  const onlySlug = process.argv[2]?.toLowerCase()
  const selected = onlySlug ? TRANSLATIONS.filter((t) => t.slug === onlySlug) : TRANSLATIONS

  if (selected.length === 0) {
    throw new Error(`Unknown translation slug "${onlySlug}". Use kjv, niv, or nlt.`)
  }

  const supabase = createSupabaseAdmin()

  const { error: tableError } = await supabase.from('bible_translations').select('id').limit(1)
  if (tableError?.message?.includes('Could not find the table')) {
    console.log('Bible tables not found. Running schema setup...')
    await ensureBibleSchema()
  } else if (tableError) {
    throw tableError
  }

  if (!onlySlug) {
    await clearBibleData(supabase)
  }

  for (const translation of selected) {
    await importTranslation(supabase, translation)
  }

  console.log('\nBible import complete.')
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
