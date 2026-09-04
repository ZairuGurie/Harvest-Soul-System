import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: announcement } = await supabase
    .from("announcements")
    .select("id,title,content,publish_date,priority")
    .eq("id", id)
    .maybeSingle();

  if (!announcement) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <p className="text-sm text-slate-600">Announcement not found.</p>
          <div className="mt-4">
            <Button variant="ghost" href="/announcements">
              Back to announcements
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const dateLabel = announcement.publish_date
    ? new Date(
        announcement.publish_date.includes("T")
          ? announcement.publish_date
          : `${announcement.publish_date}T00:00:00`
      ).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-harvest-green-dark dark:text-emerald-300">
            Announcement
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
            {announcement.title}
          </h1>
          {dateLabel ? <p className="mt-2 text-xs text-slate-500">{dateLabel}</p> : null}
        </div>
        <div className="whitespace-pre-wrap text-base leading-relaxed text-slate-800 dark:text-slate-100">
          {announcement.content || ""}
        </div>
        <div className="pt-2">
          <Button variant="ghost" href="/announcements">
            Back to announcements
          </Button>
        </div>
      </Card>
    </div>
  );
}
