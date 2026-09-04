export type VideoProvider = "facebook" | "youtube" | "direct" | "unknown";

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

function isFacebookUrl(url: URL) {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  return (
    host === "facebook.com" ||
    host === "m.facebook.com" ||
    host === "fb.watch" ||
    host === "fb.com" ||
    host.endsWith(".facebook.com")
  );
}

/** Strip tracking params that break Facebook's embed plugin. */
export function canonicalizeFacebookUrl(raw: string): string {
  const url = safeUrl(raw);
  if (!url || !isFacebookUrl(url)) return raw.trim();

  // Keep clean path for /reel/ID, /videos/ID, /watch/?v=
  const path = url.pathname.replace(/\/+$/, "");
  const reel = path.match(/\/reel\/(\d+)/i);
  if (reel) return `https://www.facebook.com/reel/${reel[1]}`;

  const videos = path.match(/\/(?:[^/]+\/)?videos\/(\d+)/i);
  if (videos) return `https://www.facebook.com/facebook/videos/${videos[1]}`;

  const watchId = url.searchParams.get("v");
  if (watchId && /^\d+$/.test(watchId)) {
    return `https://www.facebook.com/watch/?v=${watchId}`;
  }

  // share/r short links stay as-is until resolved server-side
  return `${url.origin}${url.pathname}`.replace(/\/+$/, "") + (url.search || "");
}

function facebookEmbed(href: string, autoplay: boolean) {
  const encoded = encodeURIComponent(canonicalizeFacebookUrl(href));
  const base = `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&width=560&height=315`;
  return autoplay ? `${base}&autoplay=true&mute=0` : base;
}

/**
 * Normalize a sermon / media video link into playable embed or direct sources.
 * Accepts Facebook watch/reel/share links, fb.watch, YouTube, and direct MP4/WebM.
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
    const isShareShort = /\/share\/[rv]\//i.test(url.pathname);
    return {
      original,
      provider: "facebook",
      embedUrl: facebookEmbed(canonical, false),
      autoplayEmbedUrl: facebookEmbed(canonical, true),
      // Facebook share/reel embeds are often blocked in iframes — avoid hover iframe.
      hoverPlayable: false,
      label: isShareShort ? "Facebook" : "Facebook",
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

export function isAcceptedVideoUrl(raw?: string | null): boolean {
  const parsed = parseVideoUrl(raw);
  if (!parsed) return false;
  return parsed.provider !== "unknown";
}

/**
 * Follow redirects for Facebook share/r and fb.watch short links so embeds use a canonical URL.
 */
export async function resolveVideoUrl(raw: string): Promise<string> {
  const trimmed = raw.trim();
  const url = safeUrl(trimmed);
  if (!url) return trimmed;

  if (!isFacebookUrl(url)) return trimmed;

  const needsResolve =
    /\/share\/[rv]\//i.test(url.pathname) ||
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
