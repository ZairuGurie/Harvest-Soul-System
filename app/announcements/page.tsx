import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import AnnouncementsPanel, {
  type AnnouncementItem,
} from "@/components/announcements/AnnouncementsPanel";

export default async function AnnouncementsPage() {
  let items: AnnouncementItem[] = [];
  const withPriority = await supabase
    .from("announcements")
    .select("id,title,content,publish_date,priority")
    .order("publish_date", { ascending: false })
    .limit(50);

  if (withPriority.error) {
    const fallback = await supabase
      .from("announcements")
      .select("id,title,content,publish_date")
      .order("publish_date", { ascending: false })
      .limit(50);
    items = (fallback.data ?? []) as AnnouncementItem[];
  } else {
    items = (withPriority.data ?? []) as AnnouncementItem[];
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Announcements</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Stay up to date with Harvest Souls church notices.
          </p>
        </div>
        <Button variant="ghost" href="/">
          Home
        </Button>
      </div>

      <Card>
        <AnnouncementsPanel items={items} showViewAll={false} />
      </Card>
    </div>
  );
}
