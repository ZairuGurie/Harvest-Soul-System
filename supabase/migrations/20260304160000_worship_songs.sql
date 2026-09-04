-- Worship & Praise songs (video upload + auto MP3 audio).
-- Run in Supabase Dashboard → SQL Editor if not applied via CLI.

CREATE TABLE IF NOT EXISTS public.songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text,
  lyrics text,
  category text NOT NULL DEFAULT 'WORSHIP',
  video_url text,
  audio_url text,
  video_storage_path text,
  audio_storage_path text,
  thumbnail_url text,
  duration_seconds integer,
  is_featured boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'PUBLIC',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'WORSHIP',
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS video_storage_path text,
  ADD COLUMN IF NOT EXISTS audio_storage_path text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Older schemas may already have title/artist/lyrics/created_at.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'songs' AND column_name = 'title'
  ) THEN
    ALTER TABLE public.songs ADD COLUMN title text NOT NULL DEFAULT 'Untitled';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_songs_featured
  ON public.songs (is_featured, created_at DESC)
  WHERE visibility = 'PUBLIC';

CREATE INDEX IF NOT EXISTS idx_songs_category
  ON public.songs (category, created_at DESC);

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read public songs" ON public.songs;
CREATE POLICY "Public can read public songs"
  ON public.songs
  FOR SELECT
  TO anon, authenticated
  USING (visibility = 'PUBLIC');

DROP POLICY IF EXISTS "Authenticated can manage songs" ON public.songs;
CREATE POLICY "Authenticated can manage songs"
  ON public.songs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.songs IS
  'Worship and Praise tracks. Video uploads are converted to MP3 for the player.';
