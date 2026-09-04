"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { createWorshipSong, type ContentState } from "../content-actions";
import Button from "@/components/ui/Button";

const field =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-700";

type Preview = { file: File; url: string };

type UploadedWorship = {
  videoUrl: string;
  videoStoragePath: string;
  audioUrl: string;
  audioStoragePath: string;
};

const initial: ContentState = null;

export default function WorshipComposer() {
  const [state, formAction] = useActionState(createWorshipSong, initial);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
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
    setProgress(null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    formRef.current?.reset();
  }, [state?.success]);

  function onPick(files: FileList | null) {
    if (!files?.[0]) return;
    const file = files[0];
    if (!file.type.startsWith("video/") && !/\.(mp4|webm|mov)$/i.test(file.name)) {
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
    const title = String(fd.get("title") || "").trim();

    if (!title) {
      setLocalError("Title is required.");
      return;
    }
    if (!preview) {
      setLocalError("Upload a worship/praise video. It will be converted to MP3 automatically.");
      return;
    }

    setUploading(true);
    setProgress("Uploading video and converting to MP3…");
    try {
      const body = new FormData();
      body.append("video", preview.file);
      const res = await fetch("/api/worship/upload", { method: "POST", body });
      const json = (await res.json().catch(() => null)) as
        | { upload?: UploadedWorship; error?: string }
        | null;
      if (!res.ok || !json?.upload) {
        setLocalError(
          json?.error ||
            (res.status === 413
              ? "File is too large for the server (max 50MB)."
              : `Upload / conversion failed (HTTP ${res.status}).`)
        );
        setProgress(null);
        setUploading(false);
        return;
      }

      fd.set("video_url", json.upload.videoUrl);
      fd.set("video_storage_path", json.upload.videoStoragePath);
      fd.set("audio_url", json.upload.audioUrl);
      fd.set("audio_storage_path", json.upload.audioStoragePath);
      setProgress("Saving worship entry…");
      startTransition(() => {
        formAction(fd);
      });
    } catch {
      setLocalError("Network error while uploading. Please try again.");
      setProgress(null);
    } finally {
      setUploading(false);
    }
  }

  const busy = uploading || pending;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Title</label>
        <input name="title" required placeholder="e.g. Great Is Thy Faithfulness" className={field} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Artist / Team</label>
          <input name="artist" placeholder="Worship team" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Category</label>
          <select name="category" defaultValue="WORSHIP" className={field}>
            <option value="WORSHIP">Worship</option>
            <option value="PRAISE">Praise</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Notes (optional)</label>
        <textarea name="lyrics" rows={2} placeholder="Short note or lyrics excerpt" className={field} />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input type="checkbox" name="is_featured" value="true" defaultChecked className="rounded" />
        Feature on the landing page Worship panel
      </label>

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-950/40">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Worship video</p>
        <p className="mt-1 text-xs text-slate-500">
          Upload MP4 / WebM / MOV (max 50MB). Audio is extracted automatically to MP3 for the
          player.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => pickerRef.current?.click()} disabled={busy}>
            Choose video
          </Button>
          {preview ? (
            <Button type="button" variant="ghost" onClick={clearPreview} disabled={busy}>
              Remove
            </Button>
          ) : null}
        </div>
        <input
          ref={pickerRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files)}
        />
        {preview ? (
          <video
            src={preview.url}
            controls
            className="mt-3 max-h-56 w-full rounded-lg bg-black object-contain"
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Processing…" : "Publish worship"}
        </Button>
        {progress ? <p className="text-sm text-slate-500">{progress}</p> : null}
        {localError ? <p className="text-sm text-red-600">{localError}</p> : null}
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state?.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
