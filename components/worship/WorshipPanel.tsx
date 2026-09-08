"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import {
  getWorshipPlayback,
  isPlayableWorshipTrack,
  pickFeaturedWorshipTrack,
  type WorshipPlaybackTrack,
} from "@/lib/media/worshipPlayback";

export type WorshipTrack = WorshipPlaybackTrack;

function formatCategory(value?: string | null) {
  const c = (value || "WORSHIP").toUpperCase();
  return c === "PRAISE" ? "Praise" : "Worship";
}

function sourceBadge(track: WorshipTrack) {
  const mode = getWorshipPlayback(track).mode;
  if (mode === "mp3") return "MP3";
  if (mode === "youtube") return "YouTube";
  return null;
}

export default function WorshipPanel({
  track,
  tracks,
  showExplore = true,
}: {
  /** Featured / primary track (legacy). Prefer `tracks` when available. */
  track?: WorshipTrack | null;
  /** Full library slice for the landing playlist (MP3 + YouTube). */
  tracks?: WorshipTrack[] | null;
  showExplore?: boolean;
}) {
  const library = (tracks?.length ? tracks : track ? [track] : []).filter(isPlayableWorshipTrack);
  const initial = pickFeaturedWorshipTrack(library) ?? library[0] ?? null;

  const [activeId, setActiveId] = useState<string | null>(initial?.id ?? null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const next = pickFeaturedWorshipTrack(library) ?? library[0] ?? null;
    setActiveId(next?.id ?? null);
    setPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when server list identity changes
  }, [library.map((t) => t.id).join("|")]);

  const active = library.find((t) => t.id === activeId) ?? initial;
  const playback = getWorshipPlayback(active);

  async function togglePlay() {
    const el = audioRef.current;
    if (!el || playback.mode !== "mp3") return;
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

  function selectTrack(id: string) {
    if (id === activeId) return;
    setPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setActiveId(id);
  }

  return (
    <section className="rounded-2xl bg-[#0b1220] px-5 py-5 text-white shadow-lg ring-1 ring-white/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Worship</h2>
          <p className="mt-0.5 text-xs text-slate-400">Praise & worship from Harvest Souls</p>
        </div>
        {active ? (
          <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
            {formatCategory(active.category)}
          </span>
        ) : null}
      </div>

      {!active ? (
        <p className="mt-6 text-sm text-slate-400">No worship songs yet.</p>
      ) : (
        <div className="mt-5">
          <div className="flex items-center gap-4">
            {playback.mode === "mp3" ? (
              <button
                type="button"
                onClick={togglePlay}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-harvest-gradient text-white shadow-md transition hover:opacity-90"
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
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-harvest-gradient/80 text-white shadow-md">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5.5v13l11-6.5-11-6.5z" />
                </svg>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-white">{active.title}</p>
              <p className="mt-0.5 truncate text-sm text-slate-400">
                {active.artist || "Harvest Souls Worship"}
              </p>
              {playback.mode === "mp3" ? (
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-emerald-300/80">
                  MP3 ready
                </p>
              ) : playback.mode === "youtube" ? (
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-emerald-300/80">
                  YouTube
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-amber-300/90">Audio unavailable</p>
              )}
            </div>
          </div>

          {playback.mode === "mp3" ? (
            <audio
              key={active.id}
              ref={audioRef}
              src={playback.audioUrl}
              preload="metadata"
              className="mt-4 w-full"
              controls
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
          ) : null}

          {playback.mode === "youtube" ? (
            <div className="mt-4 overflow-hidden rounded-xl bg-black aspect-video ring-1 ring-white/10">
              <iframe
                key={active.id}
                title={`${active.title} on YouTube`}
                src={playback.embedUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : null}

          {library.length > 1 ? (
            <ul className="mt-4 max-h-48 space-y-1 overflow-y-auto border-t border-white/10 pt-3">
              {library.map((item) => {
                const badge = sourceBadge(item);
                const selected = item.id === active?.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectTrack(item.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                        selected
                          ? "bg-emerald-500/15 ring-1 ring-emerald-400/30"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">
                          {item.title}
                        </span>
                        <span className="block truncate text-[11px] text-slate-400">
                          {item.artist || "Harvest Souls Worship"}
                        </span>
                      </span>
                      {badge ? (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/90">
                          {badge}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
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
  const playback = getWorshipPlayback(track);
  const listenLabel =
    playback.mode === "mp3" ? "Listen · MP3" : playback.mode === "youtube" ? "Listen · YouTube" : "Open";

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
      <span className="mt-3 text-xs font-medium text-slate-400">{listenLabel}</span>
    </Link>
  );
}
