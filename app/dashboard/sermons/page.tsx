import { requireStaff } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { deleteSermon, setFeaturedSermon } from "../content-actions";
import SermonComposer from "./SermonComposer";
import Button from "@/components/ui/Button";
import { parseVideoUrl } from "@/lib/media/videoUrl";

type SermonRow = {
  id: string;
  title: string;
  speaker?: string | null;
  sermon_date?: string | null;
  description?: string | null;
  video_url?: string | null;
  is_featured?: boolean | null;
};

export default async function SermonsDashboardPage() {
  await requireStaff();
  const admin = createAdminClient();

  let sermons: SermonRow[] = [];
  let featuredColumnReady = true;

  const withFeatured = await admin
    .from("sermons")
    .select("id, title, speaker, sermon_date, description, video_url, is_featured")
    .order("sermon_date", { ascending: false })
    .limit(100);

  if (withFeatured.error && /is_featured|schema cache|column/i.test(withFeatured.error.message)) {
    featuredColumnReady = false;
    const basic = await admin
      .from("sermons")
      .select("id, title, speaker, sermon_date, description, video_url")
      .order("sermon_date", { ascending: false })
      .limit(100);
    sermons = (basic.data ?? []) as SermonRow[];
  } else {
    sermons = (withFeatured.data ?? []) as SermonRow[];
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Sermons</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Add multiple sermons — older ones stay stored. Use <strong>Set featured</strong> to choose
          the landing-page Featured Sermon (uploading a new sermon does not replace it).
        </p>
      </header>

      {!featuredColumnReady ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm text-amber-950 dark:text-amber-100">
          <p className="font-semibold">Featured Sermon column missing</p>
          <p className="mt-1">
            Run{" "}
            <code className="rounded bg-black/20 px-1">
              supabase/migrations/20260908120000_media_storage_improvements.sql
            </code>{" "}
            in Supabase → SQL Editor, then refresh.
          </p>
        </div>
      ) : null}

      <section className="rounded-xl border bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-4 font-semibold">Add sermon</h2>
        <SermonComposer />
      </section>

      <section className="overflow-hidden rounded-xl border bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b px-6 py-3 dark:border-slate-800">
          <h2 className="font-semibold">Library ({sermons.length})</h2>
        </div>
        {sermons.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-500">No sermons yet.</p>
        ) : (
          <ul className="divide-y dark:divide-slate-800">
            {sermons.map((s) => {
              const parsed = parseVideoUrl(s.video_url);
              return (
                <li key={s.id} className="flex items-start justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {s.title}
                      {s.is_featured ? (
                        <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          Featured
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[s.speaker || "—", s.sermon_date || "—"].join(" · ")}
                      {parsed ? ` · ${parsed.label}` : ""}
                      {parsed?.hoverPlayable ? " · hover preview ready" : parsed ? " · open link to watch" : ""}
                    </p>
                    {s.video_url ? (
                      <a
                        href={s.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block truncate text-xs text-harvest-blue-dark hover:underline dark:text-sky-300"
                      >
                        {s.video_url}
                      </a>
                    ) : (
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">No video linked</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {featuredColumnReady && !s.is_featured ? (
                      <form action={setFeaturedSermon}>
                        <input type="hidden" name="id" value={s.id} />
                        <Button type="submit" variant="outline" className="text-sm">
                          Set featured
                        </Button>
                      </form>
                    ) : null}
                    <form action={deleteSermon}>
                      <input type="hidden" name="id" value={s.id} />
                      <Button type="submit" variant="ghost" className="text-red-600">
                        Delete
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
