-- Media persistence, Featured Sermon, tighter Storage/songs RLS.
-- Additive and backward-compatible. Does NOT delete existing Storage objects.
-- Run in Supabase → SQL Editor if not applied via CLI.
-- Requires public.is_staff() from 20260302120000_auth_roles_audit.sql.

-- 1) Explicit Featured Sermon (sticky; upload must NOT auto-replace)
ALTER TABLE public.sermons
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_sermons_featured
  ON public.sermons (is_featured, sermon_date DESC)
  WHERE is_featured = true;

-- At most one featured sermon
CREATE UNIQUE INDEX IF NOT EXISTS uq_sermons_one_featured
  ON public.sermons ((true))
  WHERE is_featured = true;

-- At most one featured song (worship) if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'songs' AND column_name = 'is_featured'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_songs_one_featured
      ON public.songs ((true))
      WHERE is_featured = true;
  END IF;
END $$;

-- Optional media metadata (safe if already present)
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS original_filename text;

-- 2) Raise practical bucket size caps (plan may still enforce lower limits)
UPDATE storage.buckets
SET file_size_limit = 209715200 -- 200MB
WHERE id IN ('post-media', 'worship-media');

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('worship-media', 'worship-media', true, 209715200)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = GREATEST(COALESCE(storage.buckets.file_size_limit, 0), 209715200);

-- 3) Tighten post-media Storage policies: public read, staff write only
DROP POLICY IF EXISTS "post_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "post_media_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "post_media_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "post_media_auth_delete" ON storage.objects;
DROP POLICY IF EXISTS "post_media_staff_insert" ON storage.objects;
DROP POLICY IF EXISTS "post_media_staff_update" ON storage.objects;
DROP POLICY IF EXISTS "post_media_staff_delete" ON storage.objects;

CREATE POLICY "post_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-media');

CREATE POLICY "post_media_staff_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-media' AND public.is_staff());

CREATE POLICY "post_media_staff_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'post-media' AND public.is_staff())
  WITH CHECK (bucket_id = 'post-media' AND public.is_staff());

CREATE POLICY "post_media_staff_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-media' AND public.is_staff());

-- 4) Worship-media Storage policies (same model)
DROP POLICY IF EXISTS "worship_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "worship_media_staff_insert" ON storage.objects;
DROP POLICY IF EXISTS "worship_media_staff_update" ON storage.objects;
DROP POLICY IF EXISTS "worship_media_staff_delete" ON storage.objects;

CREATE POLICY "worship_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'worship-media');

CREATE POLICY "worship_media_staff_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'worship-media' AND public.is_staff());

CREATE POLICY "worship_media_staff_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'worship-media' AND public.is_staff())
  WITH CHECK (bucket_id = 'worship-media' AND public.is_staff());

CREATE POLICY "worship_media_staff_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'worship-media' AND public.is_staff());

-- 5) Songs: staff write only (keep public read of PUBLIC visibility)
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can manage songs" ON public.songs;
DROP POLICY IF EXISTS "songs_staff_write" ON public.songs;
DROP POLICY IF EXISTS "Public can read public songs" ON public.songs;
DROP POLICY IF EXISTS "songs_public_read" ON public.songs;

CREATE POLICY "songs_public_read"
  ON public.songs FOR SELECT
  TO anon, authenticated
  USING (visibility = 'PUBLIC' OR public.is_staff());

CREATE POLICY "songs_staff_write"
  ON public.songs FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

COMMENT ON COLUMN public.sermons.is_featured IS
  'Explicit Featured Sermon. Changing this must not delete other sermons.';
