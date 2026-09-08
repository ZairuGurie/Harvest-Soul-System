import Button from "@/components/ui/Button";
import { parseVideoUrl } from "@/lib/media/videoUrl";
import { supabase } from "@/lib/supabaseClient";

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("songs")
    .select("id,title,artist,category,lyrics,audio_url,video_url")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-amber-500/30 bg-white/95 p-8 shadow-lg dark:bg-[#0b1220]/95">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Song not found</h1>
          <div className="mt-6 flex gap-3">
            <Button variant="primary" href="/songs">
              All songs
            </Button>
            <Button variant="ghost" href="/">
              Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const category = (data.category || "WORSHIP").toUpperCase() === "PRAISE" ? "Praise" : "Worship";
  const yt = !data.audio_url ? parseVideoUrl(data.video_url) : null;
  const isYoutube = yt?.provider === "youtube" && !!yt.embedUrl;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <article className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/94 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#0b1220]/94">
        <header className="border-b border-slate-200/70 px-6 py-7 sm:px-9 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-harvest-green dark:text-emerald-300">
            {category}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {data.title}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {data.artist || "Harvest Souls Worship"}
          </p>
        </header>

        <div className="space-y-6 px-6 py-7 sm:px-9">
          {data.audio_url ? (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                Listen (MP3)
              </h2>
              <audio controls src={data.audio_url} className="mt-3 w-full" preload="metadata" />
            </div>
          ) : isYoutube ? (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                Listen (YouTube)
              </h2>
              <div className="mt-3 overflow-hidden rounded-xl bg-black aspect-video">
                <iframe
                  title={`${data.title} on YouTube`}
                  src={yt.embedUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No playable audio available for this song.</p>
          )}

          {data.lyrics ? (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                Notes
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {data.lyrics}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 border-t border-slate-200/70 pt-6 dark:border-white/10">
            <Button variant="primary" href="/songs">
              All songs
            </Button>
            <Button variant="ghost" href="/">
              Home
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}
