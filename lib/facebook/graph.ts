import { getFacebookConfig } from "@/lib/facebook/config";

export type FbAttachmentMedia = {
  image?: { src?: string; width?: number; height?: number };
  source?: string;
};

export type FbAttachment = {
  media_type?: string;
  type?: string;
  title?: string;
  url?: string;
  target?: { id?: string; url?: string };
  media?: FbAttachmentMedia;
  subattachments?: { data?: FbAttachment[] };
};

export type FbPost = {
  id: string;
  message?: string;
  created_time?: string;
  permalink_url?: string;
  full_picture?: string;
  attachments?: { data?: FbAttachment[] };
};

type GraphListResponse<T> = {
  data?: T[];
  paging?: { next?: string; cursors?: { after?: string } };
  error?: { message?: string; type?: string; code?: number };
};

function graphBase(version: string) {
  return `https://graph.facebook.com/${version}`;
}

async function graphGet<T>(
  path: string,
  params: Record<string, string>
): Promise<T> {
  const cfg = getFacebookConfig();
  if (!cfg) {
    throw new Error(
      "Facebook sync is not configured. Set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN."
    );
  }

  const url = new URL(`${graphBase(cfg.graphVersion)}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  url.searchParams.set("access_token", cfg.accessToken);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const json = (await res.json()) as T & {
    error?: { message?: string; type?: string; code?: number };
  };

  if (!res.ok || json.error) {
    const msg =
      json.error?.message ||
      `Facebook Graph API error (${res.status}). Check Page ID, token, and permissions.`;
    throw new Error(msg);
  }

  return json;
}

const POST_FIELDS = [
  "id",
  "message",
  "created_time",
  "permalink_url",
  "full_picture",
  "attachments{media_type,type,title,url,target{id,url},media,subattachments{media_type,type,url,target{id,url},media}}",
].join(",");

/** Page-owned posts (not visitor posts on the Page). */
export async function fetchPagePosts(limit?: number): Promise<FbPost[]> {
  const cfg = getFacebookConfig();
  if (!cfg) {
    throw new Error(
      "Facebook sync is not configured. Set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN."
    );
  }

  const pageLimit = limit ?? cfg.syncLimit;
  const out: FbPost[] = [];
  let after: string | undefined;

  while (out.length < pageLimit) {
    const batchSize = Math.min(25, pageLimit - out.length);
    const params: Record<string, string> = {
      fields: POST_FIELDS,
      limit: String(batchSize),
    };
    if (after) params.after = after;

    const json = await graphGet<GraphListResponse<FbPost>>(
      `/${encodeURIComponent(cfg.pageId)}/posts`,
      params
    );

    const batch = json.data ?? [];
    if (batch.length === 0) break;
    out.push(...batch);

    after = json.paging?.cursors?.after;
    if (!after || !json.paging?.next) break;
  }

  return out.slice(0, pageLimit);
}

export type ExtractedMediaItem = {
  kind: "PHOTO" | "VIDEO";
  /** Stable-ish id for dedupe when Graph provides one */
  facebookMediaId: string;
  /** Direct image CDN or video file URL when available */
  mediaUrl: string | null;
  /** Permalink useful for Facebook video embeds */
  permalink: string | null;
  title?: string | null;
};

function flattenAttachments(atts: FbAttachment[] | undefined): FbAttachment[] {
  if (!atts?.length) return [];
  const out: FbAttachment[] = [];
  for (const a of atts) {
    const subs = a.subattachments?.data;
    if (subs?.length) {
      out.push(...flattenAttachments(subs));
    } else {
      out.push(a);
    }
  }
  return out;
}

function isVideoType(mediaType?: string, type?: string) {
  const t = `${mediaType || ""} ${type || ""}`.toLowerCase();
  return t.includes("video") || t.includes("reel");
}

function isPhotoType(mediaType?: string, type?: string) {
  const t = `${mediaType || ""} ${type || ""}`.toLowerCase();
  return t.includes("photo") || t.includes("image") || t === "album";
}

/**
 * Pull playable/importable media from a Graph post.
 * Prefers attachment media; falls back to full_picture for photo posts.
 */
export function extractMediaFromPost(post: FbPost): ExtractedMediaItem[] {
  const items: ExtractedMediaItem[] = [];
  const permalink = post.permalink_url?.trim() || null;
  const attachments = flattenAttachments(post.attachments?.data);

  for (let i = 0; i < attachments.length; i++) {
    const a = attachments[i];
    const targetId = a.target?.id?.trim();
    const mediaId = targetId || `${post.id}:att:${i}`;
    const imageSrc = a.media?.image?.src?.trim() || null;
    const videoSrc = a.media?.source?.trim() || null;
    const attUrl = a.url?.trim() || a.target?.url?.trim() || null;

    if (isVideoType(a.media_type, a.type)) {
      items.push({
        kind: "VIDEO",
        facebookMediaId: mediaId,
        mediaUrl: videoSrc,
        permalink: attUrl || permalink,
        title: a.title || null,
      });
      continue;
    }

    if (isPhotoType(a.media_type, a.type) || imageSrc) {
      items.push({
        kind: "PHOTO",
        facebookMediaId: mediaId,
        mediaUrl: imageSrc || attUrl,
        permalink: attUrl || permalink,
        title: a.title || null,
      });
    }
  }

  // Photo posts sometimes only expose full_picture.
  if (items.length === 0 && post.full_picture) {
    items.push({
      kind: "PHOTO",
      facebookMediaId: `${post.id}:full_picture`,
      mediaUrl: post.full_picture,
      permalink,
      title: null,
    });
  }

  // Video-only posts with no parsed attachments — keep permalink for embed.
  if (items.length === 0 && permalink && /\/(videos|reel|watch)\b/i.test(permalink)) {
    items.push({
      kind: "VIDEO",
      facebookMediaId: `${post.id}:permalink`,
      mediaUrl: null,
      permalink,
      title: null,
    });
  }

  return items;
}
