import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import RecentMediaPanel, { type RecentMediaItem } from "@/components/media/RecentMediaPanel";

export default async function MediaPage() {
  let items: RecentMediaItem[] = [];
  const withPost = await supabase
    .from("media")
    .select("id,title,url,thumbnail_url,type,post_id")
    .order("created_at", { ascending: false })
    .limit(48);

  if (withPost.error) {
    const fallback = await supabase
      .from("media")
      .select("id,title,url,thumbnail_url,type")
      .order("created_at", { ascending: false })
      .limit(48);
    items = (fallback.data ?? []) as RecentMediaItem[];
  } else {
    items = (withPost.data ?? []) as RecentMediaItem[];
  }

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Media Gallery</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Browse photos and videos shared by Harvest Souls.
          </p>
        </div>
        <Button variant="ghost" href="/">
          Home
        </Button>
      </div>
      <Card>
        <RecentMediaPanel items={items} />
      </Card>
    </div>
  );
}
