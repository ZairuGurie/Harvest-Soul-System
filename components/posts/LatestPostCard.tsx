"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { isFacebookMediaUrl, parseVideoUrl } from "@/lib/media/videoUrl";

export type LatestPostCover = {
  url: string;
  type: "PHOTO" | "VIDEO";
};

export type LatestPostCardProps = {
  id: string;
  title: string;
  excerpt?: string | null;
  createdAt?: string | null;
  cover?: LatestPostCover | null;
};

function isDirectPlayableVideo(url: string) {
  if (isFacebookMediaUrl(url)) return false;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("youtube") || host === "youtu.be") return false;
  } catch {
    return false;
  }
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || /\/storage\//i.test(url);
}

export default function LatestPostCard({
  id,
  title,
  excerpt,
  createdAt,
  cover,
}: LatestPostCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const fb = cover?.url ? parseVideoUrl(cover.url) : null;
  const isFbEmbed = fb?.provider === "facebook";
  const canHoverPlay = cover?.type === "VIDEO" && !!cover.url && isDirectPlayableVideo(cover.url);

  async function playPreview() {
    const el = videoRef.current;
    if (!el || !canHoverPlay) return;
    try {
      el.muted = true;
      await el.play();
      setPlaying(true);
    } catch {
      // Autoplay may be blocked; still shows first frame via preload.
    }
  }

  function pausePreview() {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    setPlaying(false);
  }

  const dateLabel = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  const cta =
    isFbEmbed && fb?.facebookKind === "post"
      ? "Open to view photos"
      : cover?.type === "VIDEO"
        ? "Open to watch"
        : "Read post";

  return (
    <Link
      href={`/posts/${id}`}
      className="group block overflow-hidden rounded-2xl border border-harvest-gold/20 bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/90"
      onMouseEnter={playPreview}
      onMouseLeave={pausePreview}
      onFocus={playPreview}
      onBlur={pausePreview}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-harvest-blue/20 via-slate-800 to-harvest-green/30">
        {canHoverPlay ? (
          <>
            <video
              ref={videoRef}
              src={`${cover!.url}#t=0.1`}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              muted
              playsInline
              loop
              preload="metadata"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={`inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-harvest-blue-dark shadow-lg transition-all ${
                  playing ? "scale-90 opacity-0" : "opacity-100 group-hover:scale-105"
                }`}
                aria-hidden
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
            <span className="absolute left-3 top-3 rounded-md bg-black/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Video
            </span>
          </>
        ) : isFbEmbed ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-harvest-blue-dark shadow-lg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
            <span className="absolute left-3 top-3 rounded-md bg-black/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {fb?.facebookKind === "post" ? "Photos" : "Facebook"}
            </span>
          </>
        ) : cover?.type === "PHOTO" && cover.url && !isFacebookMediaUrl(cover.url) ? (
          <>
            <Image
              src={cover.url}
              alt=""
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 420px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          </>
        ) : cover?.type === "VIDEO" ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-harvest-blue-dark shadow-lg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
            <span className="absolute left-3 top-3 rounded-md bg-black/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Video
            </span>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-white/70">Harvest Souls</span>
          </div>
        )}

        {dateLabel ? (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/55 px-2 py-0.5 text-[11px] text-white/90">
            {dateLabel}
          </span>
        ) : null}
      </div>

      <div className="space-y-1.5 p-4">
        <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-harvest-blue-dark dark:text-white dark:group-hover:text-emerald-200">
          {title}
        </h3>
        {excerpt ? (
          <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{excerpt}</p>
        ) : null}
        <p className="pt-1 text-xs font-medium text-harvest-green-dark dark:text-emerald-300">
          {cta}
        </p>
      </div>
    </Link>
  );
}
