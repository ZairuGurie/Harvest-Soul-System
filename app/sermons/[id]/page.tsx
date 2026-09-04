import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import { parseVideoUrl, resolveVideoUrl } from "@/lib/media/videoUrl";

export default async function SermonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: sermon } = await supabase
    .from("sermons")
    .select("id,title,speaker,sermon_date,description,video_url")
    .eq("id", id)
    .maybeSingle();

  if (!sermon) {
    return (
      <div className="container mx-auto max-w-3xl py-8">
        <Card>
          <p className="text-sm text-slate-600">Sermon not found.</p>
          <div className="mt-4">
            <Button variant="ghost" href="/sermons">
              Back to sermons
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const resolvedUrl = sermon.video_url ? await resolveVideoUrl(sermon.video_url) : null;
  const parsed = parseVideoUrl(resolvedUrl);
  const dateLabel = sermon.sermon_date
    ? new Date(
        sermon.sermon_date.includes("T")
          ? sermon.sermon_date
          : `${sermon.sermon_date}T00:00:00`
      ).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-harvest-green-dark dark:text-emerald-300">
            Sermon
            {parsed ? ` · ${parsed.label}` : ""}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
            {sermon.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {[sermon.speaker, dateLabel].filter(Boolean).join(" · ")}
          </p>
        </div>

        {parsed?.provider === "direct" && parsed.directSrc ? (
          <div className="aspect-video overflow-hidden rounded-xl bg-black">
            <video src={parsed.directSrc} controls playsInline autoPlay className="h-full w-full" />
          </div>
        ) : parsed?.provider === "youtube" && parsed.embedUrl ? (
          <div className="aspect-video overflow-hidden rounded-xl bg-black">
            <iframe
              src={`${parsed.embedUrl}&autoplay=1`}
              title={sermon.title}
              className="h-full w-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        ) : parsed?.provider === "facebook" && resolvedUrl ? (
          <div className="space-y-3">
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                src={parsed.embedUrl}
                title={sermon.title}
                className="h-full w-full border-0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
                allowFullScreen
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              If the player above is blocked by Facebook, open the original reel instead:
            </p>
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-harvest-gradient px-4 py-2 font-medium text-white shadow-sm hover:opacity-90"
            >
              Watch on Facebook
            </a>
          </div>
        ) : resolvedUrl ? (
          <div className="rounded-xl border border-dashed border-harvest-gold/30 px-4 py-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Open this sermon on the original host.
            </p>
            <div className="mt-3">
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-harvest-gradient px-4 py-2 font-medium text-white shadow-sm hover:opacity-90"
              >
                Open video link
              </a>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No video linked for this sermon.</p>
        )}

        {sermon.description ? (
          <div className="whitespace-pre-wrap text-base leading-relaxed text-slate-800 dark:text-slate-100">
            {sermon.description}
          </div>
        ) : null}

        <div className="pt-2">
          <Button variant="ghost" href="/sermons">
            Back to sermons
          </Button>
        </div>
      </Card>
    </div>
  );
}
