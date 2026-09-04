import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import { WorshipTrackCard, type WorshipTrack } from "@/components/worship/WorshipPanel";

export default async function SongsPage() {
  const { data } = await supabase
    .from("songs")
    .select("id,title,artist,category,audio_url,video_url")
    .eq("visibility", "PUBLIC")
    .order("created_at", { ascending: false })
    .limit(48);

  const items = (data ?? []) as WorshipTrack[];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/92 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#0b1220]/92">
        <header className="border-b border-slate-200/70 px-6 py-7 sm:px-9 dark:border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-harvest-green dark:text-emerald-300">
                Worship & Praise
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Songs
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Listen to MP3 audio extracted from worship videos.
              </p>
            </div>
            <Button variant="ghost" href="/">
              Home
            </Button>
          </div>
        </header>

        <div className="px-6 py-8 sm:px-9">
          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300/70 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
              No worship songs published yet.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((track) => (
                <li key={track.id}>
                  <WorshipTrackCard track={track} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
