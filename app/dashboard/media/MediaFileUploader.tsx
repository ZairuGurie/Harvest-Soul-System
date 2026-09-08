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
  mimeType?: string;
  fileName?: string;
  fileSizeBytes?: number;
};

const initial: ContentState = null;

async function uploadViaSignedOrProxy(file: File): Promise<UploadedMedia> {
  const prepRes = await fetch("/api/posts/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "sign",
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
    }),
  });
  const prepJson = (await prepRes.json().catch(() => null)) as
    | {
        upload?: {
          signedUrl: string;
          path: string;
          publicUrl: string;
          type: "PHOTO" | "VIDEO";
          mimeType: string;
          fileName: string;
          fileSizeBytes: number;
        };
        error?: string;
      }
    | null;

  if (prepRes.ok && prepJson?.upload?.signedUrl) {
    const put = await fetch(prepJson.upload.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!put.ok) {
      throw new Error("Direct storage upload failed. Try a smaller file.");
    }
    return {
      url: prepJson.upload.publicUrl,
      storagePath: prepJson.upload.path,
      type: prepJson.upload.type,
      mimeType: prepJson.upload.mimeType,
      fileName: prepJson.upload.fileName,
      fileSizeBytes: prepJson.upload.fileSizeBytes,
    };
  }

  const uploadFd = new FormData();
  uploadFd.append("media", file, file.name);
  const res = await fetch("/api/posts/media", { method: "POST", body: uploadFd });
  const json = (await res.json().catch(() => null)) as
    | { uploads?: UploadedMedia[]; error?: string }
    | null;
  if (!res.ok || !json?.uploads?.[0]) {
    throw new Error(json?.error || prepJson?.error || "Media upload failed.");
  }
  return json.uploads[0];
}

/**
 * Upload photos/videos from device into Harvest Souls storage.
 * Preferred path when Facebook embeds fail (private / multi-photo posts).
 */
export default function MediaFileUploader() {
  const [state, formAction] = useActionState(createPost, initial);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [title, setTitle] = useState("");
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [dragOver, setDragOver] = useState(false);
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
    setLocalError(null);
    setProgress(null);
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
    setProgress(null);

    if (previews.length === 0) {
      setLocalError("Select at least one photo or video to upload.");
      return;
    }

    setUploading(true);
    const uploads: UploadedMedia[] = [];
    try {
      for (let i = 0; i < previews.length; i++) {
        setProgress(`Uploading ${i + 1} of ${previews.length}…`);
        uploads.push(await uploadViaSignedOrProxy(previews[i].file));
      }
      setProgress("Saving…");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Media upload failed.");
      setProgress(null);
      return;
    } finally {
      setUploading(false);
    }

    const fd = new FormData();
    fd.set("content", caption);
    fd.set("title", title);
    fd.set("status", "PUBLISHED");
    fd.set("media_json", JSON.stringify(uploads));

    startTransition(() => {
      formAction(fd);
    });
  }

  const busy = pending || uploading;
  const error = localError || state?.error || null;

  return (
    <section className="rounded-xl border border-harvest-gold/30 bg-white p-6 dark:border-harvest-gold/20 dark:bg-slate-900">
      <h2 className="font-semibold text-slate-900 dark:text-slate-100">Upload photos & videos</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Download files from Facebook (or your phone), then upload them here. Files are stored in
        Harvest Souls and show on the landing page, Posts, and Media gallery — no Facebook embed
        needed.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div
          className={`rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragOver
              ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30"
              : "border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-950/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          <input
            ref={pickerRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            Drag & drop photos or videos here
          </p>
          <p className="mt-1 text-xs text-slate-500">
            JPG, PNG, WebP, GIF, MP4, WebM · up to 10 files · max ~100MB each
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => pickerRef.current?.click()}
          >
            Choose files
          </Button>
          {summary ? (
            <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">{summary} selected</p>
          ) : null}
        </div>

        {previews.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
                  aria-label="Remove file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Caption (optional)
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="JOIN A LIFEGROUP. GROW IN FAITH…"
            rows={3}
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Title (optional)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Auto from caption if empty"
            className={field}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={busy || previews.length === 0}>
            {uploading
              ? progress || "Uploading…"
              : pending
                ? "Publishing…"
                : "Upload & publish"}
          </Button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {state?.success ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-300">{state.success}</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
