"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { parseVideoUrl } from "@/lib/media/videoUrl";
import type { FeaturedSermon } from "./FeaturedSermonPanel";

function formatDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SermonCard({ sermon }: { sermon: FeaturedSermon }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ytHover, setYtHover] = useState(false);
  const parsed = parseVideoUrl(sermon.video_url);
  const dateLabel = formatDate(sermon.sermon_date);
  const canHoverPlay =
    parsed?.hoverPlayable === true &&
    (parsed.provider === "direct" || parsed.provider === "youtube");

  async function playPreview() {
    if (!parsed || !canHoverPlay) return;
    if (parsed.provider === "direct" && videoRef.current) {
      try {
        videoRef.current.muted = true;
        await videoRef.current.play();
        setPlaying(true);
      } catch {
        // ignore
      }
      return;
    }
    if (parsed.provider === "youtube") {
      setYtHover(true);
      setPlaying(true);
    }
  }

  function pausePreview() {
    setPlaying(false);
    setYtHover(false);
    videoRef.current?.pause();
  }

  const hint = canHoverPlay
    ? "Hover to preview · Open to watch"
    : parsed?.provider === "facebook"
      ? "Open to watch on Facebook"
      : "Open to watch";

  return (
    <Link
      href={`/sermons/${sermon.id}`}
      className="group block overflow-hidden rounded-2xl border border-harvest-gold/20 bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/90"
      onMouseEnter={playPreview}
      onMouseLeave={pausePreview}
      onFocus={playPreview}
      onBlur={pausePreview}
    >
      <div className="relative aspect-video overflow-hidden bg-slate-900">
        {parsed?.provider === "direct" && parsed.directSrc ? (
          <video
            ref={videoRef}
            src={`${parsed.directSrc}#t=0.1`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            muted
            playsInline
            loop
            preload="metadata"
          />
        ) : null}

        {ytHover && playing && parsed?.provider === "youtube" && parsed.autoplayEmbedUrl ? (
          <iframe
            src={parsed.autoplayEmbedUrl}
            title={sermon.title}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : null}

        {!(ytHover && playing && parsed?.provider === "youtube") ? (
          <>
            {parsed?.thumbnailUrl ? (
              <Image
                src={parsed.thumbnailUrl}
                alt=""
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            ) : parsed?.provider !== "direct" ? (
              <div className="absolute inset-0 bg-linear-to-br from-harvest-blue/40 via-slate-900 to-harvest-green/40" />
            ) : null}

            <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />

            {parsed ? (
              <>
                <span className="absolute left-3 top-3 rounded bg-black/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {parsed.label}
                </span>
                <span
                  className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                    playing && parsed.provider === "direct" ? "opacity-0" : "opacity-100"
                  }`}
                  aria-hidden
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-harvest-blue-dark shadow-lg transition-transform group-hover:scale-105">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
              </>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="space-y-1 p-4">
        <h3 className="font-semibold text-slate-900 transition-colors duration-200 group-hover:text-harvest-blue-dark dark:text-white dark:group-hover:text-emerald-200">
          {sermon.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {[sermon.speaker, dateLabel].filter(Boolean).join(" · ") || "Harvest Souls"}
        </p>
        <p className="pt-1 text-xs font-medium text-harvest-green-dark dark:text-emerald-300">
          {hint}
        </p>
      </div>
    </Link>
  );
}

export default function SermonsGrid({ items }: { items: FeaturedSermon[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-harvest-gold/30 px-4 py-10 text-center text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">
        No sermons published yet.
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {items.map((s) => (
        <SermonCard key={s.id} sermon={s} />
      ))}
    </div>
  );
}
