"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPost, type ContentState } from "../content-actions";
import Button from "@/components/ui/Button";

const field =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-700";

type Preview = {
  id: string;
  file: File;
  url: string;
  kind: "photo" | "video";
};

type UploadedMedia = {
  url: string;
  storagePath: string;
  type: "PHOTO" | "VIDEO";
};

const initial: ContentState = null;

export default function PostComposer() {
  const [state, formAction] = useActionState(createPost, initial);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("PUBLISHED");
  const [previews, setPreviews] = useState<Preview[]>([]);
  const pickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  useEffect(() => {
    if (!state?.success) return;
    setCaption("");
    setTitle("");
    setStatus("PUBLISHED");
    setLocalError(null);
    setPreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
  }, [state?.success]);

  const summary = useMemo(() => {
    const photos = previews.filter((p) => p.kind === "photo").length;
    const videos = previews.filter((p) => p.kind === "video").length;
    const parts = [];
    if (photos) parts.push(`${photos} photo${photos === 1 ? "" : "s"}`);
    if (videos) parts.push(`${videos} video${videos === 1 ? "" : "s"}`);
    return parts.join(" · ");
  }, [previews]);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming: Preview[] = [];
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) continue;
      incoming.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
        kind: file.type.startsWith("video/") ? "video" : "photo",
      });
    }
    setPreviews((prev) => [...prev, ...incoming].slice(0, 10));
    if (pickerRef.current) pickerRef.current.value = "";
  }

  function removePreview(id: string) {
    setPreviews((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);

    if (!caption.trim() && previews.length === 0) {
      setLocalError("Add a caption or attach at least one photo/video.");
      return;
    }

    let uploads: UploadedMedia[] = [];

    if (previews.length > 0) {
      setUploading(true);
      try {
        const uploadFd = new FormData();
        for (const p of previews) {
          uploadFd.append("media", p.file, p.file.name);
        }
        const res = await fetch("/api/posts/media", {
          method: "POST",
          body: uploadFd,
        });
        const json = (await res.json().catch(() => null)) as
          | { uploads?: UploadedMedia[]; error?: string }
          | null;
        if (!res.ok || !json?.uploads) {
          setLocalError(json?.error || "Media upload failed.");
          return;
        }
        uploads = json.uploads;
      } catch {
        setLocalError("Media upload failed. Please try again.");
        return;
      } finally {
        setUploading(false);
      }
    }

    const fd = new FormData();
    fd.set("content", caption);
    fd.set("title", title);
    fd.set("status", status);
    if (uploads.length > 0) {
      fd.set("media_json", JSON.stringify(uploads));
    }

    startTransition(() => {
      formAction(fd);
    });
  }

  const busy = pending || uploading;
  const error = localError || state?.error || null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/50">
        <label className="block text-sm font-medium mb-2">What&apos;s on your heart?</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption… Share an update with photos or a video."
          rows={4}
          className={`${field} resize-y min-h-25`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm mb-1">Title (optional)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Auto from caption if empty"
            className={field}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={field}
          >
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={pickerRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <Button type="button" variant="outline" onClick={() => pickerRef.current?.click()}>
            Add photos / video
          </Button>
          {summary ? (
            <span className="text-xs text-slate-500">{summary} selected</span>
          ) : (
            <span className="text-xs text-slate-500">
              JPG, PNG, WebP, GIF, MP4, WebM · max 10 · 50MB each
            </span>
          )}
        </div>

        {previews.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {previews.map((p) => (
              <div
                key={p.id}
                className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-black dark:border-slate-700"
              >
                {p.kind === "video" ? (
                  <video src={p.url} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                )}
                <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] uppercase text-white">
                  {p.kind}
                </span>
                <button
                  type="button"
                  onClick={() => removePreview(p.id)}
                  className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white hover:bg-black"
                  aria-label="Remove attachment"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={busy}>
          {uploading ? "Uploading media…" : pending ? "Publishing…" : "Publish post"}
        </Button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {state?.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
