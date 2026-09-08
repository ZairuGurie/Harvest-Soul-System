"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { createWorshipSong, type ContentState } from "../content-actions";
import Button from "@/components/ui/Button";
import { parseVideoUrl } from "@/lib/media/videoUrl";

const field =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-700";

type Preview = { file: File; url: string };
type SourceMode = "upload" | "youtube";

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
  const [sourceMode, setSourceMode] = useState<SourceMode>("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [featureOnLanding, setFeatureOnLanding] = useState(true);
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
    setYoutubeUrl("");
    setFeatureOnLanding(sourceMode === "youtube");
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    formRef.current?.reset();
  }, [state?.success, sourceMode]);

  function switchMode(mode: SourceMode) {
    setSourceMode(mode);
    setLocalError(null);
    setProgress(null);
    // YouTube tracks are intended for the landing panel — default feature on.
    setFeatureOnLanding(mode === "youtube");
    if (mode === "youtube") {
      clearPreview();
    } else {
      setYoutubeUrl("");
    }
  }

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

    if (sourceMode === "youtube") {
      const parsed = parseVideoUrl(youtubeUrl);
      if (!parsed || parsed.provider !== "youtube") {
        setLocalError("Enter a valid YouTube link (youtube.com or youtu.be).");
        return;
      }
      fd.set("source", "youtube");
      fd.set("video_url", youtubeUrl.trim());
      setProgress("Saving YouTube worship entry…");
      startTransition(() => {
        formAction(fd);
      });
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
              ? "File is too large for the server (check MEDIA_MAX_UPLOAD_BYTES / plan limits)."
              : `Upload / conversion failed (HTTP ${res.status}).`)
        );
        setProgress(null);
        setUploading(false);
        return;
      }

      fd.set("source", "upload");
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
  const ytParsed = parseVideoUrl(youtubeUrl);
  const ytValid = ytParsed?.provider === "youtube";

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
        <input
          type="checkbox"
          name="is_featured"
          value="true"
          checked={featureOnLanding}
          onChange={(e) => setFeatureOnLanding(e.target.checked)}
          className="rounded"
        />
        Feature on the landing page Worship panel (replaces previous featured; does not delete other songs)
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => switchMode("youtube")}
          disabled={busy}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            sourceMode === "youtube"
              ? "bg-harvest-green text-white"
              : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          YouTube link
        </button>
        <button
          type="button"
          onClick={() => switchMode("upload")}
          disabled={busy}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            sourceMode === "upload"
              ? "bg-harvest-green text-white"
              : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          Upload video → MP3
        </button>
      </div>

      {sourceMode === "youtube" ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-950/40">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">YouTube worship</p>
          <p className="mt-1 text-xs text-slate-500">
            Paste a YouTube link. No file is stored — playback uses the YouTube player (saves storage).
            Existing MP3 tracks in the library are unchanged.
          </p>
          <label className="mt-3 mb-1 block text-xs font-medium text-slate-500">YouTube URL</label>
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=… or https://youtu.be/…"
            className={field}
            disabled={busy}
          />
          {youtubeUrl.trim() && !ytValid ? (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
              Waiting for a valid YouTube URL…
            </p>
          ) : null}
          {ytValid && ytParsed?.embedUrl ? (
            <div className="mt-3 overflow-hidden rounded-lg bg-black aspect-video">
              <iframe
                title="YouTube preview"
                src={ytParsed.embedUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-950/40">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Worship video</p>
          <p className="mt-1 text-xs text-slate-500">
            Upload MP4 / WebM / MOV (up to 100MB; Supabase/Vercel plan limits apply). Audio is extracted
            automatically to MP3. Previous worship tracks stay in the library.
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
      )}

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
