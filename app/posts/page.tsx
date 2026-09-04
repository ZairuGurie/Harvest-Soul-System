import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import PostMediaGallery, { type PostMediaItem } from "@/components/posts/PostMediaGallery";

type Post = {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  created_at?: string;
};

export default async function PostsPage() {
  const { data: posts } = await supabase
    .from("posts")
    .select("id,title,excerpt,content,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const list = (posts ?? []) as Post[];
  const ids = list.map((p) => p.id);

  const mediaByPost = new Map<string, PostMediaItem[]>();
  if (ids.length > 0) {
    const { data: media, error: mediaError } = await supabase
      .from("media")
      .select("id,url,type,caption,thumbnail_url,post_id")
      .in("post_id", ids);

    if (!mediaError) {
      for (const m of media ?? []) {
        const postId = (m as { post_id?: string }).post_id;
        if (!postId) continue;
        const row: PostMediaItem = {
          id: m.id,
          url: m.url,
          type: m.type,
          caption: m.caption,
          thumbnail_url: m.thumbnail_url,
        };
        const arr = mediaByPost.get(postId) ?? [];
        arr.push(row);
        mediaByPost.set(postId, arr);
      }
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Posts</h1>
        <div>
          <Button variant="ghost" href="/posts/rss">
            Subscribe
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4">
        {list.length === 0 ? (
          <Card>
            <div className="text-sm text-slate-600">No posts yet.</div>
          </Card>
        ) : (
          list.map((p) => {
            const media = mediaByPost.get(p.id) ?? [];
            return (
              <Card key={p.id} className="space-y-2">
                <Link href={`/posts/${p.id}`} className="text-lg font-medium hover:underline">
                  {p.title}
                </Link>
                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                  {p.content || p.excerpt || ""}
                </p>
                <PostMediaGallery items={media} />
                <div className="text-xs text-slate-500">
                  {p.created_at ? new Date(p.created_at).toLocaleString() : ""}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
