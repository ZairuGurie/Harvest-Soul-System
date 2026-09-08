"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/log";
import { createAdminClient } from "@/lib/supabase/server";
import { facebookConfigStatus } from "@/lib/facebook/config";
import { syncFacebookPageMedia } from "@/lib/facebook/sync";
import { parseVideoUrl, resolveVideoUrl } from "@/lib/media/videoUrl";
import type { ContentState } from "@/app/dashboard/content-actions";

export async function getFacebookSyncStatus() {
  await requireStaff();
  return facebookConfigStatus();
}

function isFacebookHost(raw: string) {
  try {
    const host = new URL(raw.trim()).hostname.replace(/^www\./, "").toLowerCase();
    return (
      host === "facebook.com" ||
      host === "m.facebook.com" ||
      host === "fb.watch" ||
      host === "fb.com" ||
      host.endsWith(".facebook.com")
    );
  } catch {
    return false;
  }
}

function defaultTitle(caption: string, kind: "PHOTO" | "VIDEO") {
  const line = caption.split(/\r?\n/).map((s) => s.trim()).find(Boolean) || "";
  if (line) return line.length > 80 ? `${line.slice(0, 77)}…` : line;
  return kind === "VIDEO" ? "Facebook video" : "Facebook photos";
}

/**
 * Manual alternative to Graph API sync: paste a Facebook watch/reel/video OR
 * photo / multi-photo post link into the media library — optionally as a published post.
 */
export async function importFacebookLinkAction(
  _prev: ContentState,
  formData: FormData
): Promise<ContentState> {
  const user = await requireStaff();
  const rawUrl = String(formData.get("url") || "").trim();
  const titleInput = String(formData.get("title") || "").trim();
  const caption = String(formData.get("caption") || "").trim();
  const publishAsPost = String(formData.get("publish_as_post") || "") === "true";

  if (!rawUrl) return { error: "Paste a Facebook video or photo post URL." };
  if (!/^https?:\/\//i.test(rawUrl)) {
    return { error: "URL must start with https://" };
  }

  const looksLikeImage = /\.(jpe?g|png|webp|gif)(\?|$)/i.test(rawUrl);
  let resolved = rawUrl;
  let kind: "PHOTO" | "VIDEO" = "VIDEO";

  if (isFacebookHost(rawUrl)) {
    resolved = await resolveVideoUrl(rawUrl);
    const parsed = parseVideoUrl(resolved);
    if (parsed?.provider === "facebook" && parsed.facebookKind === "video") {
      kind = "VIDEO";
    } else if (parsed?.provider === "facebook" && parsed.facebookKind === "post") {
      // Multi-photo / single photo / text+photos — Embedded Posts plugin
      kind = "PHOTO";
    } else if (looksLikeImage) {
      kind = "PHOTO";
    } else {
      return {
        error:
          "Could not recognize that Facebook link. Use a post, photo album, watch, reel, or /videos/ URL.",
      };
    }
  } else if (looksLikeImage) {
    kind = "PHOTO";
  } else {
    const parsed = parseVideoUrl(rawUrl);
    if (parsed?.provider === "youtube" || parsed?.provider === "direct") {
      kind = "VIDEO";
      resolved = rawUrl;
    } else {
      return {
        error:
          "Use a Facebook post/photo/video link, a YouTube link, a direct image URL, or upload files under Posts.",
      };
    }
  }

  const title = titleInput || defaultTitle(caption, kind);
  const excerpt = caption
    ? caption.length > 160
      ? `${caption.slice(0, 157)}…`
      : caption
    : null;

  const admin = createAdminClient();
  let postId: string | null = null;

  if (publishAsPost) {
    const { data: post, error: postError } = await admin
      .from("posts")
      .insert({
        author_id: user.id,
        title,
        excerpt,
        content: caption || title,
        status: "PUBLISHED",
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (postError) return { error: postError.message };
    postId = post.id;
  }

  const mediaPayload: Record<string, unknown> = {
    uploaded_by: user.id,
    post_id: postId,
    title,
    url: resolved,
    type: kind,
    caption: caption || null,
    storage_path: resolved,
    visibility: "PUBLIC",
    // Facebook page URLs are not direct image files — avoid broken <img> thumbnails.
    thumbnail_url:
      kind === "PHOTO" && !isFacebookHost(resolved) && looksLikeImage ? resolved : null,
  };

  let { data: media, error: mediaError } = await admin
    .from("media")
    .insert(mediaPayload)
    .select("id")
    .single();

  if (mediaError && /post_id|schema cache|column/i.test(mediaError.message) && postId) {
    // Retry without post_id if column missing
    const { post_id: _p, ...withoutPost } = mediaPayload;
    const retry = await admin.from("media").insert(withoutPost).select("id").single();
    media = retry.data;
    mediaError = retry.error;
  }

  if (mediaError) {
    if (postId) await admin.from("posts").delete().eq("id", postId);
    return { error: mediaError.message };
  }

  await writeAuditLog({
    actorId: user.id,
    action: "create",
    entityType: "media",
    entityId: media?.id ?? null,
    summary: `Imported Facebook ${kind.toLowerCase()} link: ${title}`,
    metadata: { url: resolved, publishAsPost, postId },
  });

  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/posts");
  revalidatePath("/media");
  revalidatePath("/posts");
  revalidatePath("/");

  return {
    success: publishAsPost
      ? `${kind === "VIDEO" ? "Video" : "Photo"} published to posts and media gallery.`
      : `${kind === "VIDEO" ? "Video" : "Photo"} added to the media gallery.`,
  };
}

export async function syncFacebookPageAction(
  _prev: ContentState,
  _formData: FormData
): Promise<ContentState> {
  const user = await requireStaff();
  const result = await syncFacebookPageMedia(user.id);

  if (result.errors.length && result.imported === 0 && result.scanned === 0) {
    return { error: result.errors[0] };
  }

  await writeAuditLog({
    actorId: user.id,
    action: "sync",
    entityType: "facebook_page",
    entityId: null,
    summary: `Facebook sync: imported ${result.imported} posts (${result.mediaImported} media), skipped ${result.skipped}, scanned ${result.scanned}`,
    metadata: {
      scanned: result.scanned,
      imported: result.imported,
      skipped: result.skipped,
      mediaImported: result.mediaImported,
      errorCount: result.errors.length,
    },
  });

  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/posts");
  revalidatePath("/media");
  revalidatePath("/posts");
  revalidatePath("/");

  const parts = [
    `Scanned ${result.scanned} Facebook posts`,
    `imported ${result.imported}`,
    `${result.mediaImported} photos/videos`,
    `skipped ${result.skipped}`,
  ];
  const errHint =
    result.errors.length > 0
      ? ` (${result.errors.length} warning${result.errors.length === 1 ? "" : "s"}: ${result.errors[0]})`
      : "";

  if (result.imported === 0 && result.errors.length > 0) {
    return {
      error: `${parts.join(", ")}.${errHint}`,
    };
  }

  return {
    success: `${parts.join(", ")}.${errHint}`,
  };
}
