import { createAdminClient } from "@/lib/supabase/server";
import { convertVideoBufferToMp3 } from "@/lib/media/videoToMp3";
import { POST_MEDIA_BUCKET } from "@/lib/media/upload";

export const WORSHIP_BUCKET = "worship-media";

const VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/mpeg",
]);

/** Stay within typical Supabase project file-size caps (free tier ~50MB). */
const MAX_BYTES = 50 * 1024 * 1024;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

async function bucketExists(name: string) {
  const admin = createAdminClient();
  const { data: buckets } = await admin.storage.listBuckets();
  return (buckets ?? []).some((b) => b.id === name || b.name === name);
}

/**
 * Ensures a public storage bucket for worship files.
 * Falls back to post-media when worship-media cannot be created (plan size limits).
 */
export async function resolveWorshipBucket(): Promise<{ bucket: string; error?: string }> {
  const admin = createAdminClient();

  if (await bucketExists(WORSHIP_BUCKET)) {
    return { bucket: WORSHIP_BUCKET };
  }

  const { error } = await admin.storage.createBucket(WORSHIP_BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    // Omit allowedMimeTypes so MP4 + MP3 always accepted
  });

  if (!error || /already exists|duplicate/i.test(error.message)) {
    return { bucket: WORSHIP_BUCKET };
  }

  // Plan may reject custom limits — try a minimal create.
  const retry = await admin.storage.createBucket(WORSHIP_BUCKET, { public: true });
  if (!retry.error || /already exists|duplicate/i.test(retry.error.message)) {
    return { bucket: WORSHIP_BUCKET };
  }

  if (await bucketExists(POST_MEDIA_BUCKET)) {
    return { bucket: POST_MEDIA_BUCKET };
  }

  const fallback = await admin.storage.createBucket(POST_MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
  });
  if (!fallback.error || /already exists|duplicate/i.test(fallback.error.message)) {
    return { bucket: POST_MEDIA_BUCKET };
  }

  return {
    bucket: WORSHIP_BUCKET,
    error: `Could not create storage bucket: ${error.message}`,
  };
}

export type WorshipUploadResult = {
  videoUrl: string;
  videoStoragePath: string;
  audioUrl: string;
  audioStoragePath: string;
  fileName: string;
  bucket: string;
};

export async function uploadWorshipVideoAndConvert(
  file: File,
  userId: string
): Promise<{ result?: WorshipUploadResult; error?: string }> {
  if (!file || file.size === 0) {
    return { error: "No video file provided." };
  }
  if (!VIDEO_MIME.has(file.type) && !/\.(mp4|webm|mov|avi|mpeg|mpg)$/i.test(file.name)) {
    return {
      error: "Unsupported video type. Use MP4, WebM, or MOV.",
    };
  }
  if (file.size > MAX_BYTES) {
    return {
      error: `${file.name} is too large (max 50MB). Compress the video or trim it, then try again.`,
    };
  }

  const { bucket, error: bucketError } = await resolveWorshipBucket();
  if (bucketError) return { error: bucketError };

  const admin = createAdminClient();
  const stamp = Date.now();
  const safeName = sanitizeFileName(file.name);
  const prefix = bucket === WORSHIP_BUCKET ? userId : `worship/${userId}`;
  const videoPath = `${prefix}/${stamp}-${safeName}`;
  const audioPath = `${prefix}/${stamp}-${safeName.replace(/\.[^.]+$/, "") || "audio"}.mp3`;

  const videoBuffer = Buffer.from(await file.arrayBuffer());

  let mp3: Buffer;
  try {
    ({ mp3 } = await convertVideoBufferToMp3(videoBuffer, file.type || "video/mp4", file.name));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown conversion error";
    return { error: `Could not convert video to MP3: ${message}` };
  }

  const videoUpload = await admin.storage.from(bucket).upload(videoPath, videoBuffer, {
    contentType: file.type || "video/mp4",
    upsert: false,
  });
  if (videoUpload.error) {
    return { error: `Video upload failed: ${videoUpload.error.message}` };
  }

  const audioUpload = await admin.storage.from(bucket).upload(audioPath, mp3, {
    contentType: "audio/mpeg",
    upsert: false,
  });
  if (audioUpload.error) {
    await admin.storage.from(bucket).remove([videoPath]);
    return { error: `MP3 upload failed: ${audioUpload.error.message}` };
  }

  const videoUrl = admin.storage.from(bucket).getPublicUrl(videoPath).data.publicUrl;
  const audioUrl = admin.storage.from(bucket).getPublicUrl(audioPath).data.publicUrl;

  return {
    result: {
      videoUrl,
      videoStoragePath: videoPath,
      audioUrl,
      audioStoragePath: audioPath,
      fileName: file.name,
      bucket,
    },
  };
}

export async function removeWorshipStoragePaths(paths: string[], bucketHint?: string) {
  if (paths.length === 0) return;
  try {
    const admin = createAdminClient();
    const buckets = bucketHint
      ? [bucketHint]
      : [WORSHIP_BUCKET, POST_MEDIA_BUCKET];
    for (const bucket of buckets) {
      await admin.storage.from(bucket).remove(paths);
    }
  } catch {
    // best-effort
  }
}
