"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { createSermon, type ContentState } from "../content-actions";
import Button from "@/components/ui/Button";

const field =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-700";

type Preview = {
  file: File;
  url: string;
};

type UploadedMedia = {
  url: string;
  storagePath: string;
  type: "PHOTO" | "VIDEO";
};

const initial: ContentState = null;

export default function SermonComposer() {
  const [state, formAction] = useActionState(createSermon, initial);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  useEffect(() => {
    if (!state?.success) return;
    setLocalError(null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    formRef.current?.reset();
  }, [state?.success]);

  function onPick(files: FileList | null) {
    if (!files?.[0]) return;
    const file = files[0];
    if (!file.type.startsWith("video/")) {
      setLocalError("Please choose a video file (MP4, WebM, or MOV).");
      return;
    }
    setLocalError(null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return { file, url: URL.createObjectURL(file) };
    });
    if (pickerRef.current) pickerRef.current.value = "";
  }

  function clearPreview() {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const link = String(fd.get("video_url") || "").trim();

    if (!preview && !link) {
      setLocalError("Add a Facebook/YouTube link or upload a sermon video file.");
      return;
    }

    // Uploaded file becomes the playable video_url (reliable hover preview).
    // Prefer signed direct-to-Storage so large files are not overwritten and stay unique.
    if (preview) {
      setUploading(true);
      try {
        const prepRes = await fetch("/api/posts/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "sign",
            fileName: preview.file.name,
            mimeType: preview.file.type || "video/mp4",
            fileSize: preview.file.size,
          }),
        });
        const prepJson = (await prepRes.json().catch(() => null)) as
          | {
              upload?: { signedUrl: string; path: string; publicUrl: string };
              error?: string;
            }
          | null;

        if (prepRes.ok && prepJson?.upload?.signedUrl) {
          const put = await fetch(prepJson.upload.signedUrl, {
            method: "PUT",
            headers: { "Content-Type": preview.file.type || "video/mp4" },
            body: preview.file,
          });
          if (!put.ok) {
            setLocalError("Video upload to storage failed.");
            return;
          }
          fd.set("video_url", prepJson.upload.publicUrl);
        } else {
          const uploadFd = new FormData();
          uploadFd.append("media", preview.file, preview.file.name);
          const res = await fetch("/api/posts/media", {
            method: "POST",
            body: uploadFd,
          });
          const json = (await res.json().catch(() => null)) as
            | { uploads?: UploadedMedia[]; error?: string }
            | null;
          if (!res.ok || !json?.uploads?.[0]) {
            setLocalError(json?.error || prepJson?.error || "Video upload failed.");
            return;
          }
          fd.set("video_url", json.uploads[0].url);
        }
        if (link) fd.set("external_url", link);
      } catch {
        setLocalError("Video upload failed. Please try again.");
        return;
      } finally {
        setUploading(false);
      }
    }

    startTransition(() => {
      formAction(fd);
    });
  }

  const busy = pending || uploading;
  const error = localError || state?.error || null;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input name="title" placeholder="Sunday message title" required className={field} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Speaker</label>
          <input name="speaker" placeholder="Pastor name" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Date</label>
          <input name="sermon_date" type="date" className={field} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          name="description"
          placeholder="Short summary of the message"
          rows={3}
          className={field}
        />
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/50">
        <div>
          <label className="mb-1 block text-sm font-medium">Facebook / YouTube link</label>
          <input
            name="video_url"
            type="url"
            placeholder="https://www.facebook.com/share/r/... or YouTube"
            className={field}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Facebook share and reel links are accepted. For hover-to-play on the landing page, also
            upload the video file below.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Upload sermon video (recommended)</label>
          <input
            ref={pickerRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => pickerRef.current?.click()}>
              Choose video file
            </Button>
            <span className="text-xs text-slate-500">MP4 / WebM / MOV · up to 100MB (plan limits apply)</span>
          </div>

          {preview ? (
            <div className="relative mt-3 aspect-video overflow-hidden rounded-xl border border-slate-200 bg-black dark:border-slate-700">
              <video src={preview.url} className="h-full w-full object-contain" controls muted playsInline />
              <button
                type="button"
                onClick={clearPreview}
                className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white"
                aria-label="Remove video"
              >
                ×
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={busy}>
          {uploading ? "Uploading video…" : pending ? "Saving…" : "Add sermon"}
        </Button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {state?.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
