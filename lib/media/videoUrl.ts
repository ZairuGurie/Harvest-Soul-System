export type VideoProvider = "facebook" | "youtube" | "direct" | "unknown";

/** Facebook video plugin vs Embedded Posts plugin (photos / multi-photo / text posts). */
export type FacebookEmbedKind = "video" | "post";

export type ParsedVideoUrl = {
  original: string;
  provider: VideoProvider;
  /** Native <video> src when provider is direct */
  directSrc?: string;
  /** iframe embed URL (Facebook / YouTube) */
  embedUrl?: string;
  /** Embed URL with muted autoplay for hover preview */
  autoplayEmbedUrl?: string;
  /** Optional poster / thumbnail when available */
  thumbnailUrl?: string;
  /** True when hover autoplay via iframe is reliable */
  hoverPlayable: boolean;
  label: string;
  /** Set when provider is facebook */
  facebookKind?: FacebookEmbedKind;
};

function safeUrl(raw: string): URL | null {
  try {
    return new URL(raw.trim());
  } catch {
    return null;
  }
}

function isDirectVideo(pathname: string, hostname: string) {
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(pathname)) return true;
  if (/supabase\.co$/i.test(hostname) && /\/storage\//i.test(pathname)) return true;
  return false;
}

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id || null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname.startsWith("/embed/")) {
      return url.pathname.split("/")[2] || null;
    }
    if (url.pathname.startsWith("/shorts/")) {
      return url.pathname.split("/")[2] || null;
    }
    return url.searchParams.get("v");
  }
  return null;
}

export function isFacebookUrl(url: URL) {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  return (
    host === "facebook.com" ||
    host === "m.facebook.com" ||
    host === "fb.watch" ||
    host === "fb.com" ||
    host.endsWith(".facebook.com")
  );
}

export function isFacebookMediaUrl(raw?: string | null): boolean {
  if (!raw?.trim()) return false;
  const url = safeUrl(raw);
  return !!url && isFacebookUrl(url);
}

/**
 * Decide video.php vs post.php.
 * Multi-photo albums, permalinks, /posts/, /photo/, /share/p/ → Embedded Post.
 * Reels, watch, /videos/, fb.watch → Video plugin.
 */
export function classifyFacebookEmbedKind(raw: string): FacebookEmbedKind {
  const url = safeUrl(raw);
  if (!url || !isFacebookUrl(url)) return "post";

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const path = url.pathname;

  if (host === "fb.watch") return "video";
  if (/\/reel\//i.test(path)) return "video";
  if (/\/videos\//i.test(path)) return "video";
  if (/\/watch\/?/i.test(path)) return "video";
  if (/\/share\/[rv]\//i.test(path)) return "video";

  const watchId = url.searchParams.get("v");
  if (watchId && /^\d+$/.test(watchId)) return "video";

  // Explicit photo / multi-photo / feed post shapes
  if (/\/photo\/?/i.test(path)) return "post";
  if (/\/photos\//i.test(path)) return "post";
  if (/\/posts\//i.test(path)) return "post";
  if (/\/permalink\.php$/i.test(path)) return "post";
  if (/\/story\.php$/i.test(path)) return "post";
  if (/\/share\/p\//i.test(path)) return "post";

  const set = url.searchParams.get("set") || "";
  if (/^pcb\./i.test(set) || /story_fbid/i.test(url.search)) return "post";

  // Unknown facebook.com links: prefer post embed (photo albums fail on video.php).
  return "post";
}

/** Strip tracking params that break Facebook's embed plugins. */
export function canonicalizeFacebookUrl(raw: string): string {
  const url = safeUrl(raw);
  if (!url || !isFacebookUrl(url)) return raw.trim();

  const path = url.pathname.replace(/\/+$/, "");

  const reel = path.match(/\/reel\/(\d+)/i);
  if (reel) return `https://www.facebook.com/reel/${reel[1]}`;

  const videos = path.match(/\/(?:[^/]+\/)?videos\/(\d+)/i);
  if (videos) return `https://www.facebook.com/facebook/videos/${videos[1]}`;

  const watchId = url.searchParams.get("v");
  if (watchId && /^\d+$/.test(watchId)) {
    return `https://www.facebook.com/watch/?v=${watchId}`;
  }

  // Keep query for permalink/photo (story_fbid, fbid, set=pcb.*) — required for embeds.
  if (
    /\/permalink\.php$/i.test(path) ||
    /\/story\.php$/i.test(path) ||
    /\/photo\/?/i.test(path) ||
    url.searchParams.has("story_fbid") ||
    url.searchParams.has("fbid")
  ) {
    const keep = new URLSearchParams();
    for (const key of ["story_fbid", "id", "fbid", "set", "type"]) {
      const val = url.searchParams.get(key);
      if (val) keep.set(key, val);
    }
    const qs = keep.toString();
    return `https://www.facebook.com${path}${qs ? `?${qs}` : ""}`;
  }

  // /PageName/posts/pfbid... or /share/p/...
  return `https://www.facebook.com${path}${url.search || ""}`.replace(/\/+$/, "") || raw.trim();
}

function facebookVideoEmbed(href: string, autoplay: boolean) {
  const encoded = encodeURIComponent(canonicalizeFacebookUrl(href));
  const base = `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&width=560&height=315`;
  return autoplay ? `${base}&autoplay=true&mute=0` : base;
}

/** Embedded Posts plugin — shows text + single/multi photos in one iframe. */
function facebookPostEmbed(href: string) {
  const encoded = encodeURIComponent(canonicalizeFacebookUrl(href));
  return `https://www.facebook.com/plugins/post.php?href=${encoded}&show_text=true&width=500`;
}

/**
 * Normalize a sermon / media video link into playable embed or direct sources.
 * Accepts Facebook watch/reel/share links, photo posts, fb.watch, YouTube, and direct MP4/WebM.
 */
export function parseVideoUrl(raw?: string | null): ParsedVideoUrl | null {
  if (!raw?.trim()) return null;
  const original = raw.trim();
  const url = safeUrl(original);
  if (!url) {
    return {
      original,
      provider: "unknown",
      hoverPlayable: false,
      label: "Link",
    };
  }

  if (isFacebookUrl(url)) {
    const canonical = canonicalizeFacebookUrl(original);
    const facebookKind = classifyFacebookEmbedKind(canonical);
    if (facebookKind === "video") {
      return {
        original,
        provider: "facebook",
        facebookKind: "video",
        embedUrl: facebookVideoEmbed(canonical, false),
        autoplayEmbedUrl: facebookVideoEmbed(canonical, true),
        hoverPlayable: false,
        label: "Facebook video",
      };
    }
    return {
      original,
      provider: "facebook",
      facebookKind: "post",
      embedUrl: facebookPostEmbed(canonical),
      autoplayEmbedUrl: facebookPostEmbed(canonical),
      hoverPlayable: false,
      label: "Facebook post",
    };
  }

  const yt = youtubeId(url);
  if (yt) {
    return {
      original,
      provider: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt}?rel=0`,
      autoplayEmbedUrl: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&mute=1&rel=0&playsinline=1`,
      thumbnailUrl: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
      hoverPlayable: true,
      label: "YouTube",
    };
  }

  if (isDirectVideo(url.pathname, url.hostname)) {
    return {
      original,
      provider: "direct",
      directSrc: original,
      hoverPlayable: true,
      label: "Video",
    };
  }

  return {
    original,
    provider: "unknown",
    hoverPlayable: false,
    label: "Video link",
  };
}

/** Sermons / video-only fields — Facebook photo posts are not valid here. */
export function isAcceptedVideoUrl(raw?: string | null): boolean {
  const parsed = parseVideoUrl(raw);
  if (!parsed) return false;
  if (parsed.provider === "facebook") return parsed.facebookKind === "video";
  return parsed.provider !== "unknown";
}

/** Media importer — Facebook videos and photo/multi-photo posts. */
export function isAcceptedFacebookOrVideoUrl(raw?: string | null): boolean {
  const parsed = parseVideoUrl(raw);
  if (!parsed) return false;
  return parsed.provider !== "unknown";
}

/**
 * Follow redirects for Facebook share short links so embeds use a canonical URL.
 */
export async function resolveVideoUrl(raw: string): Promise<string> {
  const trimmed = raw.trim();
  const url = safeUrl(trimmed);
  if (!url) return trimmed;

  if (!isFacebookUrl(url)) return trimmed;

  const needsResolve =
    /\/share\/[pvr]\//i.test(url.pathname) ||
    url.hostname.replace(/^www\./, "").toLowerCase() === "fb.watch";

  if (!needsResolve) return canonicalizeFacebookUrl(trimmed);

  try {
    const res = await fetch(trimmed, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HarvestSoulsBot/1.0; +https://harvestsoulschurch.org)",
        Accept: "text/html",
      },
    });
    if (res.url) return canonicalizeFacebookUrl(res.url);
  } catch {
    // Keep original if resolve fails
  }

  return canonicalizeFacebookUrl(trimmed);
}
