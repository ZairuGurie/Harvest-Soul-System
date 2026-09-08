import { createAdminClient } from "@/lib/supabase/server";
import { ensurePostMediaBucket, POST_MEDIA_BUCKET } from "@/lib/media/upload";
import { buildUniqueStoragePath } from "@/lib/media/limits";
import {
  extractMediaFromPost,
  fetchPagePosts,
  type ExtractedMediaItem,
  type FbPost,
} from "@/lib/facebook/graph";
import { getFacebookConfig } from "@/lib/facebook/config";

export type FacebookSyncResult = {
  scanned: number;
  imported: number;
  skipped: number;
  mediaImported: number;
  errors: string[];
};

function captionTitle(caption: string, hasPhoto: boolean, hasVideo: boolean) {
  const line = caption.split(/\r?\n/).map((s) => s.trim()).find(Boolean) || "";
  if (line) return line.length > 80 ? `${line.slice(0, 77)}…` : line;
  if (hasVideo && !hasPhoto) return "Facebook video";
  if (hasPhoto) return "Facebook photo";
  return "Facebook update";
}

function guessExtFromContentType(ct: string | null, kind: "PHOTO" | "VIDEO") {
  const t = (ct || "").toLowerCase();
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  if (t.includes("gif")) return "gif";
  if (t.includes("webm")) return "webm";
  if (t.includes("quicktime") || t.includes("mov")) return "mov";
  if (t.includes("mp4") || t.includes("video")) return "mp4";
  return kind === "VIDEO" ? "mp4" : "jpg";
}

async function downloadToPostMedia(
  userId: string,
  sourceUrl: string,
  kind: "PHOTO" | "VIDEO",
  label: string
): Promise<{ url: string; storagePath: string; mimeType: string; fileSizeBytes: number } | null> {
  try {
    const res = await fetch(sourceUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: { Accept: "*/*" },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type");
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 64) return null;

    // Skip HTML error pages pretending to be media.
    const ct = (contentType || "").toLowerCase();
    if (ct.includes("text/html") || ct.includes("application/json")) return null;

    const isImage = ct.startsWith("image/") || (!ct && kind === "PHOTO");
    const isVideo = ct.startsWith("video/") || (!ct && kind === "VIDEO");
    if (kind === "PHOTO" && !isImage && !ct.includes("octet-stream")) return null;
    if (kind === "VIDEO" && !isVideo && !ct.includes("octet-stream")) return null;

    const mimeType =
      ct && !ct.includes("octet-stream")
        ? ct.split(";")[0].trim()
        : kind === "VIDEO"
          ? "video/mp4"
          : "image/jpeg";

    const ext = guessExtFromContentType(mimeType, kind);
    const fileName = sanitizeLabel(label, ext);
    const storagePath = buildUniqueStoragePath(userId, fileName);

    await ensurePostMediaBucket();
    const admin = createAdminClient();
    const { error } = await admin.storage.from(POST_MEDIA_BUCKET).upload(storagePath, buf, {
      contentType: mimeType,
      upsert: false,
    });
    if (error) return null;

    const { data } = admin.storage.from(POST_MEDIA_BUCKET).getPublicUrl(storagePath);
    return {
      url: data.publicUrl,
      storagePath,
      mimeType,
      fileSizeBytes: buf.byteLength,
    };
  } catch {
    return null;
  }
}

function sanitizeLabel(label: string, ext: string) {
  const base = label
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${base || "facebook-media"}.${ext}`;
}

async function resolveMediaRow(
  userId: string,
  item: ExtractedMediaItem,
  title: string
): Promise<{
  url: string;
  storage_path: string;
  type: "PHOTO" | "VIDEO";
  thumbnail_url: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  original_filename: string | null;
  facebook_media_id: string;
} | null> {
  // Prefer downloading photos into our bucket so gallery stays stable if FB CDN expires.
  if (item.kind === "PHOTO" && item.mediaUrl) {
    const stored = await downloadToPostMedia(userId, item.mediaUrl, "PHOTO", title);
    if (stored) {
      return {
        url: stored.url,
        storage_path: stored.storagePath,
        type: "PHOTO",
        thumbnail_url: stored.url,
        mime_type: stored.mimeType,
        file_size_bytes: stored.fileSizeBytes,
        original_filename: sanitizeLabel(title, guessExtFromContentType(stored.mimeType, "PHOTO")),
        facebook_media_id: item.facebookMediaId,
      };
    }
    // Fallback: keep Facebook CDN URL (may expire later).
    return {
      url: item.mediaUrl,
      storage_path: item.mediaUrl,
      type: "PHOTO",
      thumbnail_url: item.mediaUrl,
      mime_type: null,
      file_size_bytes: null,
      original_filename: null,
      facebook_media_id: item.facebookMediaId,
    };
  }

  // Videos: keep Facebook permalink for embed (download often blocked / huge).
  const videoUrl = item.permalink || item.mediaUrl;
  if (item.kind === "VIDEO" && videoUrl) {
    if (item.mediaUrl && !/^https?:\/\/(www\.)?facebook\.com\//i.test(item.mediaUrl)) {
      const stored = await downloadToPostMedia(userId, item.mediaUrl, "VIDEO", title);
      if (stored) {
        return {
          url: stored.url,
          storage_path: stored.storagePath,
          type: "VIDEO",
          thumbnail_url: null,
          mime_type: stored.mimeType,
          file_size_bytes: stored.fileSizeBytes,
          original_filename: sanitizeLabel(title, "mp4"),
          facebook_media_id: item.facebookMediaId,
        };
      }
    }
    return {
      url: videoUrl,
      storage_path: videoUrl,
      type: "VIDEO",
      thumbnail_url: null,
      mime_type: null,
      file_size_bytes: null,
      original_filename: null,
      facebook_media_id: item.facebookMediaId,
    };
  }

  return null;
}

async function existingFacebookPostIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("posts")
    .select("facebook_post_id")
    .in("facebook_post_id", ids);

  if (error) {
    // Column may not exist yet — treat as empty so sync can surface a clear migration error on insert.
    if (/facebook_post_id|schema cache|column/i.test(error.message)) {
      return new Set();
    }
    throw new Error(error.message);
  }

  return new Set(
    (data ?? [])
      .map((r) => r.facebook_post_id as string | null)
      .filter((id): id is string => !!id)
  );
}

async function importOnePost(
  userId: string,
  post: FbPost
): Promise<{ imported: boolean; mediaCount: number; error?: string }> {
  const mediaItems = extractMediaFromPost(post);
  if (mediaItems.length === 0) {
    return { imported: false, mediaCount: 0 };
  }

  const caption = (post.message || "").trim();
  const hasPhoto = mediaItems.some((m) => m.kind === "PHOTO");
  const hasVideo = mediaItems.some((m) => m.kind === "VIDEO");
  const title = captionTitle(caption, hasPhoto, hasVideo);
  const excerpt = caption
    ? caption.length > 160
      ? `${caption.slice(0, 157)}…`
      : caption
    : null;

  const resolved = [];
  for (const item of mediaItems) {
    const row = await resolveMediaRow(userId, item, title);
    if (row) resolved.push(row);
  }
  if (resolved.length === 0) {
    return { imported: false, mediaCount: 0, error: `No usable media on ${post.id}` };
  }

  const admin = createAdminClient();
  const publishedAt = post.created_time
    ? new Date(post.created_time).toISOString()
    : new Date().toISOString();

  const insertPayload = {
    author_id: userId,
    title,
    excerpt,
    content: caption || title,
    status: "PUBLISHED",
    published_at: publishedAt,
    facebook_post_id: post.id,
  };

  let { data: created, error } = await admin
    .from("posts")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error && /facebook_post_id|schema cache|column/i.test(error.message)) {
    return {
      imported: false,
      mediaCount: 0,
      error:
        "Database needs the Facebook sync migration. Run supabase/migrations/20260908130000_facebook_page_sync.sql in the Supabase SQL Editor.",
    };
  }

  if (error) {
    if (/duplicate|unique/i.test(error.message)) {
      return { imported: false, mediaCount: 0 };
    }
    return { imported: false, mediaCount: 0, error: error.message };
  }

  if (!created?.id) {
    return { imported: false, mediaCount: 0, error: "Post insert returned no id." };
  }

  const mediaRows = resolved.map((r) => ({
    uploaded_by: userId,
    post_id: created.id,
    title,
    url: r.url,
    type: r.type,
    caption: caption || null,
    storage_path: r.storage_path,
    visibility: "PUBLIC",
    thumbnail_url: r.thumbnail_url,
    mime_type: r.mime_type,
    file_size_bytes: r.file_size_bytes,
    original_filename: r.original_filename,
    facebook_media_id: r.facebook_media_id,
  }));

  let { error: mediaError } = await admin.from("media").insert(mediaRows);
  if (
    mediaError &&
    /facebook_media_id|mime_type|file_size_bytes|original_filename|schema cache|column/i.test(
      mediaError.message
    )
  ) {
    const basicRows = mediaRows.map(
      ({
        mime_type: _m,
        file_size_bytes: _f,
        original_filename: _o,
        facebook_media_id: _fb,
        ...rest
      }) => rest
    );
    const retry = await admin.from("media").insert(basicRows);
    mediaError = retry.error;
  }

  if (mediaError) {
    // Roll back the post; storage objects for this import stay (explicit delete only).
    await admin.from("posts").delete().eq("id", created.id);
    return { imported: false, mediaCount: 0, error: mediaError.message };
  }

  return { imported: true, mediaCount: mediaRows.length };
}

/**
 * Import Page posts that contain photos/videos into `posts` + `media`.
 * Skips posts already imported (matched by facebook_post_id).
 */
export async function syncFacebookPageMedia(userId: string): Promise<FacebookSyncResult> {
  const cfg = getFacebookConfig();
  if (!cfg) {
    return {
      scanned: 0,
      imported: 0,
      skipped: 0,
      mediaImported: 0,
      errors: [
        "Facebook is not configured. Add FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN to environment variables.",
      ],
    };
  }

  const result: FacebookSyncResult = {
    scanned: 0,
    imported: 0,
    skipped: 0,
    mediaImported: 0,
    errors: [],
  };

  let posts: FbPost[];
  try {
    posts = await fetchPagePosts(cfg.syncLimit);
  } catch (e) {
    result.errors.push(e instanceof Error ? e.message : "Failed to fetch Facebook posts.");
    return result;
  }

  result.scanned = posts.length;
  const existing = await existingFacebookPostIds(posts.map((p) => p.id));

  for (const post of posts) {
    if (existing.has(post.id)) {
      result.skipped += 1;
      continue;
    }

    const mediaItems = extractMediaFromPost(post);
    if (mediaItems.length === 0) {
      result.skipped += 1;
      continue;
    }

    try {
      const one = await importOnePost(userId, post);
      if (one.error) {
        result.errors.push(one.error);
        // Stop early on migration missing — every insert would fail the same way.
        if (/Facebook sync migration/i.test(one.error)) break;
        continue;
      }
      if (one.imported) {
        result.imported += 1;
        result.mediaImported += one.mediaCount;
        existing.add(post.id);
      } else {
        result.skipped += 1;
      }
    } catch (e) {
      result.errors.push(
        e instanceof Error ? e.message : `Failed importing Facebook post ${post.id}`
      );
    }
  }

  return result;
}
