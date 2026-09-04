"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export type WorshipTrack = {
  id: string;
  title: string;
  artist?: string | null;
  category?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
};

function formatCategory(value?: string | null) {
  const c = (value || "WORSHIP").toUpperCase();
  return c === "PRAISE" ? "Praise" : "Worship";
}

export default function WorshipPanel({
  track,
  showExplore = true,
}: {
  track: WorshipTrack | null;
  showExplore?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  async function togglePlay() {
    const el = audioRef.current;
    if (!el || !track?.audio_url) return;
    try {
      if (el.paused) {
        await el.play();
        setPlaying(true);
      } else {
        el.pause();
        setPlaying(false);
      }
    } catch {
      setPlaying(false);
    }
  }

  return (
    <section className="rounded-2xl bg-[#0b1220] px-5 py-5 text-white shadow-lg ring-1 ring-white/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Worship</h2>
          <p className="mt-0.5 text-xs text-slate-400">Praise & worship from Harvest Souls</p>
        </div>
        {track ? (
          <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
            {formatCategory(track.category)}
          </span>
        ) : null}
      </div>

      {!track ? (
        <p className="mt-6 text-sm text-slate-400">No featured song yet.</p>
      ) : (
        <div className="mt-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={togglePlay}
              disabled={!track.audio_url}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-harvest-gradient text-white shadow-md transition hover:opacity-90 disabled:opacity-40"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5.5v13l11-6.5-11-6.5z" />
                </svg>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-white">{track.title}</p>
              <p className="mt-0.5 truncate text-sm text-slate-400">
                {track.artist || "Harvest Souls Worship"}
              </p>
              {track.audio_url ? (
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-emerald-300/80">
                  MP3 ready
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-amber-300/90">Audio unavailable</p>
              )}
            </div>
          </div>

          {track.audio_url ? (
            <audio
              ref={audioRef}
              src={track.audio_url}
              preload="metadata"
              className="mt-4 w-full"
              controls
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
          ) : null}
        </div>
      )}

      {showExplore ? (
        <div className="mt-5 flex justify-end border-t border-white/10 pt-4">
          <Button
            variant="outline"
            href="/songs"
            className="border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/10"
          >
            Explore Songs
          </Button>
        </div>
      ) : null}
    </section>
  );
}

export function WorshipTrackCard({ track }: { track: WorshipTrack }) {
  return (
    <Link
      href={`/songs/${track.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-4 transition hover:-translate-y-0.5 hover:border-harvest-green/40 hover:shadow-md dark:border-white/10 dark:bg-slate-950/70 dark:hover:border-emerald-400/30"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide text-harvest-green dark:text-emerald-300">
        {formatCategory(track.category)}
      </span>
      <span className="mt-2 font-semibold text-slate-900 group-hover:text-harvest-green-dark dark:text-white dark:group-hover:text-emerald-200">
        {track.title}
      </span>
      <span className="mt-1 text-sm text-slate-500">{track.artist || "Harvest Souls Worship"}</span>
      <span className="mt-3 text-xs font-medium text-slate-400">
        {track.audio_url ? "Listen · MP3" : "Open"}
      </span>
    </Link>
  );
}
