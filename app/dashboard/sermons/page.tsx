import { requireStaff } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { deleteSermon } from "../content-actions";
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
};

export default async function SermonsDashboardPage() {
  await requireStaff();
  const admin = createAdminClient();
  const { data } = await admin
    .from("sermons")
    .select("id, title, speaker, sermon_date, description, video_url")
    .order("sermon_date", { ascending: false })
    .limit(50);

  const sermons = (data ?? []) as SermonRow[];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Sermons</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Paste a Facebook or YouTube link, and upload the video file for hover-to-play on the landing
          page (same as Recent Media).
        </p>
      </header>

      <section className="rounded-xl border bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-4 font-semibold">Add sermon</h2>
        <SermonComposer />
      </section>

      <section className="overflow-hidden rounded-xl border bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b px-6 py-3 dark:border-slate-800">
          <h2 className="font-semibold">Published sermons</h2>
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
                    <p className="font-medium text-slate-900 dark:text-white">{s.title}</p>
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
                  <form action={deleteSermon}>
                    <input type="hidden" name="id" value={s.id} />
                    <Button type="submit" variant="ghost" className="text-red-600">
                      Delete
                    </Button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
