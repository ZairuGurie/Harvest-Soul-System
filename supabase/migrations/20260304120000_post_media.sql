-- Link media to posts + public storage bucket for photo/video posts.
-- Self-contained: does NOT require public.is_staff() from the auth migration.
-- App uploads use the service role (bypasses storage RLS).
-- Run in Supabase SQL Editor.

-- 1) Attach media rows to posts (Facebook-style photo/video posts)
ALTER TABLE media
  ADD COLUMN IF NOT EXISTS post_id uuid REFERENCES posts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_media_post_id ON media(post_id);

-- 2) Public storage bucket for uploaded post photos/videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3) Storage policies (no is_staff dependency)
DROP POLICY IF EXISTS "post_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "post_media_staff_insert" ON storage.objects;
DROP POLICY IF EXISTS "post_media_staff_update" ON storage.objects;
DROP POLICY IF EXISTS "post_media_staff_delete" ON storage.objects;
DROP POLICY IF EXISTS "post_media_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "post_media_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "post_media_auth_delete" ON storage.objects;

CREATE POLICY "post_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-media');

-- Authenticated users may write; dashboard mutations also use service role.
CREATE POLICY "post_media_auth_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-media');

CREATE POLICY "post_media_auth_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'post-media')
  WITH CHECK (bucket_id = 'post-media');

CREATE POLICY "post_media_auth_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-media');
