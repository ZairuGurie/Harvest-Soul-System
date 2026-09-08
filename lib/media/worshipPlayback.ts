import { parseVideoUrl } from "@/lib/media/videoUrl";

export type WorshipPlaybackTrack = {
  id: string;
  title: string;
  artist?: string | null;
  category?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
  is_featured?: boolean | null;
};

export function getWorshipPlayback(track: WorshipPlaybackTrack | null) {
  if (!track) return { mode: "none" as const };
  if (track.audio_url) {
    return { mode: "mp3" as const, audioUrl: track.audio_url };
  }
  const parsed = parseVideoUrl(track.video_url);
  if (parsed?.provider === "youtube" && parsed.embedUrl) {
    return { mode: "youtube" as const, embedUrl: parsed.embedUrl };
  }
  return { mode: "none" as const };
}

/** MP3 or YouTube — both are valid for the landing Worship panel. */
export function isPlayableWorshipTrack(
  track: WorshipPlaybackTrack | null | undefined
): track is WorshipPlaybackTrack {
  return getWorshipPlayback(track ?? null).mode !== "none";
}

/** Prefer featured playable track; otherwise newest playable (YouTube or MP3). */
export function pickFeaturedWorshipTrack(
  tracks: WorshipPlaybackTrack[]
): WorshipPlaybackTrack | null {
  const featured = tracks.find((t) => t.is_featured && isPlayableWorshipTrack(t));
  if (featured) return featured;
  return tracks.find((t) => isPlayableWorshipTrack(t)) ?? null;
}
