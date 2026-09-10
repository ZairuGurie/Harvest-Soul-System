import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { supabase } from "@/lib/supabaseClient";
import { getBirthdaysThisMonth } from "@/lib/birthdays";
import Image from "next/image";
import LatestPostCard, { type LatestPostCover } from "@/components/posts/LatestPostCard";
import AnnouncementsPanel from "@/components/announcements/AnnouncementsPanel";
import RecentMediaPanel, { type RecentMediaItem } from "@/components/media/RecentMediaPanel";
import FeaturedSermonPanel, { type FeaturedSermon } from "@/components/sermons/FeaturedSermonPanel";
import BirthdaysPanel from "@/components/birthdays/BirthdaysPanel";
import UpcomingEventsPanel, { type UpcomingEvent } from "@/components/events/UpcomingEventsPanel";
import { isUpcomingOrToday } from "@/lib/events/format";
import WorshipPanel, { type WorshipTrack } from "@/components/worship/WorshipPanel";
import {
  isPlayableWorshipTrack,
  pickFeaturedWorshipTrack,
} from "@/lib/media/worshipPlayback";

type Post = { id: string; title: string; excerpt?: string; created_at?: string };
type Announcement = {
  id: string;
  title: string;
  content?: string;
  publish_date?: string;
  priority?: string;
};

export default async function Home() {
  const [
    { data: posts },
    announcementsResult,
    { data: events },
    sermonsResult,
    mediaResult,
    songsResult,
    birthdays,
  ] = await Promise.all([
    supabase.from('posts').select('id,title,excerpt,created_at').order('created_at', { ascending: false }).limit(4),
    supabase.from('announcements').select('id,title,content,publish_date,priority').order('publish_date', { ascending: false }).limit(5),
    supabase.from('events').select('id,title,event_date,start_time,location').order('event_date', { ascending: true }).limit(5),
    supabase
      .from("sermons")
      .select("id,title,speaker,sermon_date,description,video_url,is_featured")
      .eq("is_featured", true)
      .limit(1),
    supabase.from('media').select('id,title,url,thumbnail_url,type,post_id').order('created_at', { ascending: false }).limit(6),
    supabase
      .from("songs")
      .select("id,title,artist,category,audio_url,video_url,is_featured")
      .eq("visibility", "PUBLIC")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(24),
    getBirthdaysThisMonth(),
  ]);

  let announcementsList = (announcementsResult.data ?? []) as Announcement[];
  if (announcementsResult.error) {
    const fallback = await supabase
      .from("announcements")
      .select("id,title,content,publish_date")
      .order("publish_date", { ascending: false })
      .limit(5);
    announcementsList = (fallback.data ?? []) as Announcement[];
  }

  let mediaList = (mediaResult.data ?? []) as RecentMediaItem[];
  if (mediaResult.error) {
    const fallback = await supabase
      .from("media")
      .select("id,title,url,thumbnail_url,type")
      .order("created_at", { ascending: false })
      .limit(6);
    mediaList = (fallback.data ?? []) as RecentMediaItem[];
  }

  const postsList = (posts ?? []) as Post[];
  const eventsList = ((events ?? []) as UpcomingEvent[])
    .filter((e) => isUpcomingOrToday(e.event_date))
    .slice(0, 5);

  let featuredSermon = ((sermonsResult.data ?? [])[0] as FeaturedSermon | undefined) ?? null;
  if (sermonsResult.error || !featuredSermon) {
    // No sticky featured yet (migration missing or none selected) — show latest without deleting others.
    const fallback = await supabase
      .from("sermons")
      .select("id,title,speaker,sermon_date,description,video_url")
      .order("sermon_date", { ascending: false })
      .limit(1);
    if (!featuredSermon) {
      featuredSermon = ((fallback.data ?? [])[0] as FeaturedSermon | undefined) ?? null;
    }
  }
  let worshipTracks = ((songsResult.data ?? []) as WorshipTrack[]).filter(isPlayableWorshipTrack);
  let featuredWorship: WorshipTrack | null = pickFeaturedWorshipTrack(worshipTracks);
  if (songsResult.error || worshipTracks.length === 0) {
    const fallback = await supabase
      .from("songs")
      .select("id,title,artist,category,audio_url,video_url,is_featured")
      .order("created_at", { ascending: false })
      .limit(24);
    const fallbackTracks = ((fallback.data ?? []) as WorshipTrack[]).filter(isPlayableWorshipTrack);
    if (fallbackTracks.length > 0) {
      worshipTracks = fallbackTracks;
      featuredWorship = pickFeaturedWorshipTrack(fallbackTracks) ?? featuredWorship;
    }
  }
  const monthLabel = new Date().toLocaleString(undefined, { month: "long" });

  const coverByPost = new Map<string, LatestPostCover>();
  if (postsList.length > 0) {
    const { data: postMedia, error: coverError } = await supabase
      .from("media")
      .select("post_id,url,type,thumbnail_url")
      .in(
        "post_id",
        postsList.map((p) => p.id)
      );
    if (!coverError) {
      for (const m of postMedia ?? []) {
        const postId = (m as { post_id?: string }).post_id;
        const mediaUrl = (m as { url?: string }).url;
        if (!postId || !mediaUrl || coverByPost.has(postId)) continue;
        const type = String((m as { type?: string }).type || "").toUpperCase() === "VIDEO" ? "VIDEO" : "PHOTO";
        coverByPost.set(postId, { url: mediaUrl, type });
      }
    }
  }

  return (
    <div className="flex flex-col flex-1 font-sans">
      {/* Hero */}
      <section className="mb-8">
        <Card className="hs-motion flex flex-col items-center gap-6 p-6 transition-shadow duration-300 hover:shadow-xl sm:p-8 md:flex-row md:p-10" accent>
          <div className="flex-1">
            <p className="text-sm font-bold tracking-wider text-harvest-green-dark uppercase dark:text-emerald-300">
              Harvest Souls Mission Christian Church
            </p>
            <h1 className="mt-3 text-3xl leading-tight font-bold md:text-5xl">
              <span className="text-harvest-blue-dark dark:text-white">Growing in Faith.</span>{' '}
              <span className="text-harvest-green-dark dark:text-emerald-300">Serving in Love.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-800 md:text-lg dark:text-slate-100">
              A digital home for church life, worship, and community in Macanhan, Carmen,
              Cagayan de Oro City.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="primary" className="px-5" href="/sermons">Explore Sermons</Button>
              <Button variant="ghost" className="px-5" href="/bible">Read the Bible</Button>
            </div>
          </div>

          <div className="w-full shrink-0 md:w-72">
            <Image
              src="/harvest-souls-logo.png"
              alt="Harvest Souls Mission Christian Church logo"
              width={288}
              height={288}
              className="hs-motion w-full rounded-full object-cover shadow-lg ring-4 ring-harvest-gold/50 hover:scale-[1.02] hover:ring-harvest-gold/80 hover:shadow-xl"
              style={{ width: "100%", height: "auto" }}
              priority
            />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Latest Posts */}
          <Card>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Latest Posts</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Photos and videos from church life — hover a video to preview.
                </p>
              </div>
              <Button variant="outline" href="/posts" className="hidden sm:inline-flex">
                View all
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {postsList.length === 0 ? (
                <div className="col-span-2 text-sm text-slate-600 dark:text-slate-300">No posts found.</div>
              ) : (
                postsList.map((p) => (
                  <LatestPostCard
                    key={p.id}
                    id={p.id}
                    title={p.title}
                    excerpt={p.excerpt}
                    createdAt={p.created_at}
                    cover={coverByPost.get(p.id) ?? null}
                  />
                ))
              )}
            </div>
            <div className="mt-4 flex justify-end sm:hidden">
              <Button variant="outline" href="/posts">View All Posts</Button>
            </div>
          </Card>

          {/* Featured Sermon */}
          <Card>
            <FeaturedSermonPanel sermon={featuredSermon} />
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          {/* Announcements */}
          <Card>
            <AnnouncementsPanel items={announcementsList} />
          </Card>

          <UpcomingEventsPanel items={eventsList} />

          <BirthdaysPanel items={birthdays} monthLabel={monthLabel} />
        </aside>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <Card className="lg:col-span-2">
          <RecentMediaPanel items={mediaList} />
          <div className="mt-4 flex justify-end">
            <Button variant="outline" href="/media">
              View All Media
            </Button>
          </div>
        </Card>

        <WorshipPanel track={featuredWorship} tracks={worshipTracks} />
      </section>

      <section className="mb-12">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Bible</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Daily Verse</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">John 3:16 — For God so loved the world...</div>
            </div>
            <Button variant="ghost" href="/bible">Open Bible</Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
