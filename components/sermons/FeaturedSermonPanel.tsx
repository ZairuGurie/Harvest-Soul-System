"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { parseVideoUrl } from "@/lib/media/videoUrl";

export type FeaturedSermon = {
  id: string;
  title: string;
  speaker?: string | null;
  sermon_date?: string | null;
  description?: string | null;
  video_url?: string | null;
};

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

export default function FeaturedSermonPanel({
  sermon,
  compact = false,
}: {
  sermon: FeaturedSermon | null;
  compact?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ytHover, setYtHover] = useState(false);

  const parsed = parseVideoUrl(sermon?.video_url);
  const dateLabel = formatDate(sermon?.sermon_date);
  const watchHref = sermon ? `/sermons/${sermon.id}` : "/sermons";
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
        // Autoplay may be blocked; first frame still shows via preload.
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
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }

  if (!sermon) {
    return (
      <div>
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Featured Sermon</h2>
        <div className="rounded-xl border border-dashed border-harvest-gold/30 px-4 py-8 text-center text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">
          No featured sermon yet.
        </div>
      </div>
    );
  }

  const hint = canHoverPlay
    ? "Hover to preview · click to watch"
    : parsed?.provider === "facebook"
      ? "Click to watch on Facebook"
      : "Click to watch";

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Featured Sermon</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{hint}</p>
        </div>
      </div>

      <div className={compact ? "space-y-4" : "md:flex md:items-stretch md:gap-6"}>
        <Link
          href={watchHref}
          className={`group relative block overflow-hidden rounded-xl border border-harvest-gold/20 bg-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 ${
            compact ? "aspect-video w-full" : "aspect-video w-full shrink-0 md:w-64 lg:w-72"
          }`}
          onMouseEnter={playPreview}
          onMouseLeave={pausePreview}
          onFocus={playPreview}
          onBlur={pausePreview}
        >
          {/* Direct uploaded video — reliable hover play */}
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

          {/* YouTube muted autoplay on hover */}
          {ytHover && playing && parsed?.provider === "youtube" && parsed.autoplayEmbedUrl ? (
            <iframe
              src={parsed.autoplayEmbedUrl}
              title={sermon.title}
              className="absolute inset-0 h-full w-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : null}

          {/* Idle poster (always for Facebook; YouTube until hover) */}
          {!(ytHover && playing && parsed?.provider === "youtube") ? (
            <>
              {parsed?.thumbnailUrl ? (
                <Image
                  src={parsed.thumbnailUrl}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 320px"
                />
              ) : parsed?.provider !== "direct" ? (
                <div className="absolute inset-0 bg-linear-to-br from-harvest-blue/50 via-slate-900 to-harvest-green/45" />
              ) : null}

              <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/20 to-transparent" />

              {parsed ? (
                <>
                  <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
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
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-white/70">No video linked</span>
                </div>
              )}
            </>
          ) : null}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-center pt-3 md:pt-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{sermon.title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {[sermon.speaker, dateLabel].filter(Boolean).join(" · ") || "Harvest Souls"}
          </p>
          {sermon.description ? (
            <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
              {sermon.description}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" href={watchHref}>
              Watch Sermon
            </Button>
            {parsed?.provider === "facebook" && sermon.video_url ? (
              <a
                href={sermon.video_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-harvest-blue/30 px-4 py-2 text-sm font-medium text-harvest-blue-dark hover:bg-harvest-blue/5 dark:border-sky-700 dark:text-sky-200"
              >
                Open Facebook
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
