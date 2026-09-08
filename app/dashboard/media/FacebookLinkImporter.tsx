"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { parseVideoUrl } from "@/lib/media/videoUrl";
import { importFacebookLinkAction } from "./facebook-actions";
import type { ContentState } from "../content-actions";

const field =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-700";

const initial: ContentState = null;

export default function FacebookLinkImporter() {
  const [state, formAction, pending] = useActionState(importFacebookLinkAction, initial);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [publishAsPost, setPublishAsPost] = useState(true);

  const preview = useMemo(() => parseVideoUrl(url), [url]);
  const showEmbed =
    preview &&
    (preview.provider === "facebook" || preview.provider === "youtube") &&
    !!preview.embedUrl;
  const isFbPost = preview?.provider === "facebook" && preview.facebookKind === "post";

  useEffect(() => {
    if (!state?.success) return;
    setUrl("");
    setTitle("");
    setCaption("");
    setPublishAsPost(true);
  }, [state?.success]);

  return (
    <section className="rounded-xl border border-emerald-200/60 bg-white p-6 dark:border-emerald-900/40 dark:bg-slate-900">
      <h2 className="font-semibold text-slate-900 dark:text-slate-100">
        Paste Facebook link
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        No Meta Developer account needed. Paste a Facebook <strong>post</strong> (including
        multi-photo albums), photo link, watch, reel, or video URL. The post must be{" "}
        <strong>public</strong> for the embed to load.
      </p>

      <form action={formAction} className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Facebook post / photo / video URL
          </label>
          <input
            name="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.facebook.com/.../posts/... or /photo/ or /reel/..."
            required
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Title (optional)
          </label>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sunday service highlight"
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Caption (optional)
          </label>
          <textarea
            name="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            placeholder="Short caption shown with the post"
            className={field}
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={publishAsPost}
            onChange={(e) => setPublishAsPost(e.target.checked)}
            className="mt-0.5 rounded"
          />
          <span>
            Also publish as a post (shows on the landing page and Posts feed)
            <input type="hidden" name="publish_as_post" value={publishAsPost ? "true" : "false"} />
          </span>
        </label>

        {showEmbed ? (
          <div
            className={`overflow-hidden rounded-lg bg-white max-w-xl ${
              isFbPost ? "min-h-112" : "aspect-video bg-black"
            }`}
          >
            <iframe
              title="Facebook preview"
              src={preview.embedUrl}
              className="h-full w-full min-h-112"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={pending || !url.trim()}>
            {pending ? "Importing…" : "Import link"}
          </Button>
          <p className="text-xs text-slate-500">
            Multi-photo posts use Facebook’s post embed (not the video player).
          </p>
        </div>

        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state?.success ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{state.success}</p>
        ) : null}
      </form>
    </section>
  );
}
