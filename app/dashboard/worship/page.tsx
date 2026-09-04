import { requireStaff } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { deleteWorshipSong, setFeaturedWorshipSong } from "../content-actions";
import WorshipComposer from "./WorshipComposer";
import Button from "@/components/ui/Button";

type SongRow = {
  id: string;
  title: string;
  artist: string | null;
  category: string | null;
  audio_url: string | null;
  video_url: string | null;
  is_featured: boolean | null;
  created_at: string | null;
};

export default async function WorshipDashboardPage() {
  await requireStaff();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("songs")
    .select("id, title, artist, category, audio_url, video_url, is_featured, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const tableMissing =
    !!error && /songs|schema cache|relation .* does not exist/i.test(error.message);
  const rows = (data ?? []) as SongRow[];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Worship & Praise</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Upload a worship video — the system converts it to MP3 for the landing page player.
        </p>
      </header>

      {tableMissing ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm text-amber-950 dark:text-amber-100">
          <p className="font-semibold">Songs table needs an update</p>
          <p className="mt-1">
            Run <code className="rounded bg-black/20 px-1">supabase/migrations/20260304160000_worship_songs.sql</code>{" "}
            in Supabase → SQL Editor, then refresh.
          </p>
        </div>
      ) : null}

      <section className="rounded-xl border bg-white p-6 dark:bg-slate-900 dark:border-slate-700">
        <h2 className="mb-4 font-semibold">Upload worship / praise</h2>
        <WorshipComposer />
      </section>

      <section className="overflow-hidden rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700">
        <div className="border-b px-6 py-3 dark:border-slate-800">
          <h2 className="font-semibold">Library ({rows.length})</h2>
        </div>
        {rows.length === 0 && !tableMissing ? (
          <p className="px-6 py-8 text-sm text-slate-500">No worship tracks yet.</p>
        ) : (
          <ul className="divide-y dark:divide-slate-800">
            {rows.map((row) => (
              <li key={row.id} className="px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {row.title}
                      {row.is_featured ? (
                        <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          Featured
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[row.category || "WORSHIP", row.artist || "—"].join(" · ")}
                      {row.audio_url ? " · MP3 ready" : " · No audio"}
                    </p>
                    {row.audio_url ? (
                      <audio controls src={row.audio_url} className="mt-3 w-full max-w-md" preload="none" />
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!row.is_featured ? (
                      <form action={setFeaturedWorshipSong}>
                        <input type="hidden" name="id" value={row.id} />
                        <Button type="submit" variant="outline" className="text-sm">
                          Set featured
                        </Button>
                      </form>
                    ) : null}
                    {row.video_url ? (
                      <a
                        href={row.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-harvest-green-dark hover:bg-harvest-green/10 dark:text-emerald-200"
                      >
                        Video
                      </a>
                    ) : null}
                    <form action={deleteWorshipSong}>
                      <input type="hidden" name="id" value={row.id} />
                      <Button type="submit" variant="ghost" className="text-red-600 text-sm">
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
