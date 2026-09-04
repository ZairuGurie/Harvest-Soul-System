"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

export type RecentMediaItem = {
  id: string;
  title?: string | null;
  url?: string | null;
  thumbnail_url?: string | null;
  type?: string | null;
  post_id?: string | null;
};

function MediaTile({ item }: { item: RecentMediaItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const isVideo = String(item.type || "").toUpperCase() === "VIDEO";
  const href = item.post_id ? `/posts/${item.post_id}` : item.url || "/posts";
  const src = item.url || item.thumbnail_url || "";

  async function playPreview() {
    if (!isVideo || !videoRef.current) return;
    try {
      videoRef.current.muted = true;
      await videoRef.current.play();
      setPlaying(true);
    } catch {
      // Autoplay may be blocked; first frame still shows via preload.
    }
  }

  function pausePreview() {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setPlaying(false);
  }

  return (
    <Link
      href={href}
      className="group relative block aspect-square overflow-hidden rounded-xl border border-harvest-gold/20 bg-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700"
      onMouseEnter={playPreview}
      onMouseLeave={pausePreview}
      onFocus={playPreview}
      onBlur={pausePreview}
    >
      {isVideo && src ? (
        <video
          ref={videoRef}
          src={`${src}#t=0.1`}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          muted
          playsInline
          loop
          preload="metadata"
        />
      ) : src ? (
        <Image
          src={src}
          alt={item.title || "Church media"}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 50vw, 220px"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-harvest-blue/30 to-harvest-green/30" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-90" />

      {isVideo ? (
        <>
          <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Video
          </span>
          <span
            className={`absolute inset-0 flex items-center justify-center transition-opacity ${
              playing ? "opacity-0" : "opacity-100"
            }`}
            aria-hidden
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-harvest-blue-dark shadow-lg transition-transform group-hover:scale-105">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </>
      ) : (
        <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Photo
        </span>
      )}

      {item.title ? (
        <p className="absolute bottom-2 left-2 right-2 truncate text-xs font-medium text-white drop-shadow">
          {item.title}
        </p>
      ) : null}
    </Link>
  );
}

export default function RecentMediaPanel({ items }: { items: RecentMediaItem[] }) {
  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Recent Media</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Photos and videos from church life — hover a video to preview.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-harvest-gold/30 px-4 py-8 text-center text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">
          No media available yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((m) => (
            <MediaTile key={m.id} item={m} />
          ))}
        </div>
      )}
    </div>
  );
}
