-- Bible reader schema (KJV, NIV, NLT)
-- Run via: npm run bible:setup

CREATE TABLE IF NOT EXISTS bible_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'English',
  copyright TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bible_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_id UUID NOT NULL REFERENCES bible_translations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  testament TEXT NOT NULL CHECK (testament IN ('OT', 'NT')),
  book_order INTEGER NOT NULL,
  chapters_count INTEGER NOT NULL,
  UNIQUE (translation_id, slug)
);

CREATE TABLE IF NOT EXISTS bible_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES bible_books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL CHECK (chapter_number > 0),
  UNIQUE (book_id, chapter_number)
);

CREATE TABLE IF NOT EXISTS bible_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES bible_chapters(id) ON DELETE CASCADE,
  verse_number INTEGER NOT NULL CHECK (verse_number > 0),
  text TEXT NOT NULL,
  UNIQUE (chapter_id, verse_number)
);

CREATE INDEX IF NOT EXISTS idx_bible_books_translation_id ON bible_books(translation_id);
CREATE INDEX IF NOT EXISTS idx_bible_books_translation_slug ON bible_books(translation_id, slug);
CREATE INDEX IF NOT EXISTS idx_bible_chapters_book_id ON bible_chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_bible_verses_chapter_id ON bible_verses(chapter_id);

ALTER TABLE bible_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_verses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read bible_translations" ON bible_translations;
CREATE POLICY "Public read bible_translations" ON bible_translations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read bible_books" ON bible_books;
CREATE POLICY "Public read bible_books" ON bible_books FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read bible_chapters" ON bible_chapters;
CREATE POLICY "Public read bible_chapters" ON bible_chapters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read bible_verses" ON bible_verses;
CREATE POLICY "Public read bible_verses" ON bible_verses FOR SELECT USING (true);
