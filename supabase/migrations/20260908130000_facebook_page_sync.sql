-- Facebook Page sync: track imported Graph post IDs (additive, idempotent).

alter table public.posts
  add column if not exists facebook_post_id text;

alter table public.media
  add column if not exists facebook_media_id text;

create unique index if not exists posts_facebook_post_id_uidx
  on public.posts (facebook_post_id)
  where facebook_post_id is not null;

create unique index if not exists media_facebook_media_id_uidx
  on public.media (facebook_media_id)
  where facebook_media_id is not null;

comment on column public.posts.facebook_post_id is
  'Meta Graph API post id (e.g. PAGEID_POSTID). Used to dedupe Facebook imports.';

comment on column public.media.facebook_media_id is
  'Meta Graph attachment/media id when imported from a Facebook Page.';
