import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import SermonsGrid from "@/components/sermons/SermonsGrid";
import type { FeaturedSermon } from "@/components/sermons/FeaturedSermonPanel";

export default async function SermonsPage() {
  const { data } = await supabase
    .from("sermons")
    .select("id,title,speaker,sermon_date,description,video_url")
    .order("sermon_date", { ascending: false })
    .limit(48);

  const items = (data ?? []) as FeaturedSermon[];

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Sermons</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Watch messages from Harvest Souls — hover a video to preview.
          </p>
        </div>
        <Button variant="ghost" href="/">
          Home
        </Button>
      </div>

      <Card>
        <SermonsGrid items={items} />
      </Card>
    </div>
  );
}
