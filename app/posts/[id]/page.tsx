import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import PostMediaGallery, { type PostMediaItem } from "@/components/posts/PostMediaGallery";

type PostRow = {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  created_at?: string;
};

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: post } = await supabase
    .from("posts")
    .select("id,title,content,excerpt,created_at")
    .eq("id", id)
    .single();

  if (!post) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <div className="text-sm text-slate-600">Post not found.</div>
          <div className="mt-4">
            <Button variant="ghost" href="/posts">
              Back to posts
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const typed = post as PostRow;
  const { data: media, error: mediaError } = await supabase
    .from("media")
    .select("id,url,type,caption,thumbnail_url")
    .eq("post_id", id);

  const items = mediaError ? [] : ((media ?? []) as PostMediaItem[]);

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <h1 className="text-2xl font-semibold">{typed.title}</h1>
        <div className="text-xs text-slate-500 mb-4">
          {typed.created_at ? new Date(typed.created_at).toLocaleString() : ""}
        </div>
        <div className="text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
          {typed.content ?? typed.excerpt ?? ""}
        </div>
        <PostMediaGallery items={items} />
        <div className="mt-6">
          <Button variant="ghost" href="/posts">
            Back
          </Button>
        </div>
      </Card>
    </div>
  );
}
