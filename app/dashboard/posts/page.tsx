import { requireStaff } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { deletePost } from "../content-actions";
import PostComposer from "./PostComposer";
import PostMediaGallery, { type PostMediaItem } from "@/components/posts/PostMediaGallery";
import Button from "@/components/ui/Button";

type MediaRow = PostMediaItem & { post_id?: string | null };

export default async function PostsDashboardPage() {
  await requireStaff();
  const admin = createAdminClient();
  const { data: posts } = await admin
    .from("posts")
    .select("id, title, content, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const postIds = (posts ?? []).map((p) => p.id);
  let mediaByPost = new Map<string, PostMediaItem[]>();

  if (postIds.length > 0) {
    const { data: media, error: mediaError } = await admin
      .from("media")
      .select("id, url, type, caption, thumbnail_url, post_id")
      .in("post_id", postIds);

    if (!mediaError) {
      mediaByPost = new Map();
      for (const m of (media ?? []) as MediaRow[]) {
        if (!m.post_id) continue;
        const list = mediaByPost.get(m.post_id) ?? [];
        list.push(m);
        mediaByPost.set(m.post_id, list);
      }
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Posts</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Share updates with captions, photos, and videos — like a church feed.
        </p>
      </header>

      <section className="rounded-xl border bg-white p-6 dark:bg-slate-900 dark:border-slate-700">
        <h2 className="font-semibold mb-4">Create post</h2>
        <PostComposer />
      </section>

      <section className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-slate-800 font-semibold">Recent posts</div>
        <ul className="divide-y dark:divide-slate-800">
          {(posts ?? []).map((p) => {
            const attachments = mediaByPost.get(p.id) ?? [];
            return (
              <li key={p.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{p.title}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-3">
                      {p.content}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {p.status} · {p.created_at ? new Date(p.created_at).toLocaleString() : ""}
                      {attachments.length
                        ? ` · ${attachments.length} media`
                        : ""}
                    </p>
                    <PostMediaGallery items={attachments} />
                  </div>
                  <form action={deletePost}>
                    <input type="hidden" name="id" value={p.id} />
                    <Button type="submit" variant="ghost" className="text-red-600 shrink-0">
                      Delete
                    </Button>
                  </form>
                </div>
              </li>
            );
          })}
          {(posts ?? []).length === 0 ? (
            <li className="px-6 py-8 text-sm text-slate-500">No posts yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
