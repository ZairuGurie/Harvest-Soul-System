import { createAdminClient } from "@/lib/supabase/server";
import { convertVideoBufferToMp3 } from "@/lib/media/videoToMp3";
import { POST_MEDIA_BUCKET } from "@/lib/media/upload";
import {
  buildUniqueStoragePath,
  formatBytesLabel,
  getMaxUploadBytes,
  isPathOwnedByUser,
} from "@/lib/media/limits";

export const WORSHIP_BUCKET = "worship-media";

const VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/mpeg",
]);

async function bucketExists(name: string) {
  const admin = createAdminClient();
  const { data: buckets } = await admin.storage.listBuckets();
  return (buckets ?? []).some((b) => b.id === name || b.name === name);
}

/**
 * Ensures a public storage bucket for worship files.
 * Falls back to post-media when worship-media cannot be created (plan limits).
 * Never deletes existing objects.
 */
export async function resolveWorshipBucket(): Promise<{ bucket: string; error?: string }> {
  const admin = createAdminClient();
  const maxBytes = getMaxUploadBytes();

  if (await bucketExists(WORSHIP_BUCKET)) {
    try {
      await admin.storage.updateBucket(WORSHIP_BUCKET, {
        public: true,
        fileSizeLimit: maxBytes,
      });
    } catch {
      // keep existing
    }
    return { bucket: WORSHIP_BUCKET };
  }

  const { error } = await admin.storage.createBucket(WORSHIP_BUCKET, {
    public: true,
    fileSizeLimit: maxBytes,
  });

  if (!error || /already exists|duplicate/i.test(error.message)) {
    return { bucket: WORSHIP_BUCKET };
  }

  const retry = await admin.storage.createBucket(WORSHIP_BUCKET, { public: true });
  if (!retry.error || /already exists|duplicate/i.test(retry.error.message)) {
    return { bucket: WORSHIP_BUCKET };
  }

  if (await bucketExists(POST_MEDIA_BUCKET)) {
    return { bucket: POST_MEDIA_BUCKET };
  }

  const fallback = await admin.storage.createBucket(POST_MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: maxBytes,
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
  fileSizeBytes?: number;
};

export async function uploadWorshipVideoAndConvert(
  file: File,
  userId: string
): Promise<{ result?: WorshipUploadResult; error?: string }> {
  const maxBytes = getMaxUploadBytes();
  if (!file || file.size === 0) {
    return { error: "No video file provided." };
  }
  if (!VIDEO_MIME.has(file.type) && !/\.(mp4|webm|mov|avi|mpeg|mpg)$/i.test(file.name)) {
    return {
      error: "Unsupported video type. Use MP4, WebM, or MOV.",
    };
  }
  if (file.size > maxBytes) {
    return {
      error: `${file.name} is too large (max ${formatBytesLabel(maxBytes)}). Compress or trim, then try again.`,
    };
  }

  const { bucket, error: bucketError } = await resolveWorshipBucket();
  if (bucketError) return { error: bucketError };

  const admin = createAdminClient();
  const prefix = bucket === WORSHIP_BUCKET ? undefined : "worship";
  const videoPath = buildUniqueStoragePath(userId, file.name, prefix);
  const audioBase = file.name.replace(/\.[^.]+$/, "") || "audio";
  const audioPath = buildUniqueStoragePath(userId, `${audioBase}.mp3`, prefix);

  const videoBuffer = Buffer.from(await file.arrayBuffer());

  let mp3: Buffer;
  try {
    ({ mp3 } = await convertVideoBufferToMp3(videoBuffer, file.type || "video/mp4", file.name));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown conversion error";
    // Do not touch existing worship media — nothing was stored yet.
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
    // Clean up ONLY the newly uploaded video from this request.
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
      fileSizeBytes: file.size,
    },
  };
}

export async function removeWorshipStoragePaths(paths: string[], bucketHint?: string, ownerUserId?: string) {
  const safe = paths.filter((p) => {
    if (!p || typeof p !== "string") return false;
    if (p.includes("..") || /^https?:\/\//i.test(p) || p.startsWith("/")) return false;
    if (ownerUserId) return isPathOwnedByUser(p, ownerUserId);
    return true;
  });
  if (safe.length === 0) return;
  try {
    const admin = createAdminClient();
    const buckets = bucketHint ? [bucketHint] : [WORSHIP_BUCKET, POST_MEDIA_BUCKET];
    for (const bucket of buckets) {
      await admin.storage.from(bucket).remove(safe);
    }
  } catch {
    // best-effort for THIS request's objects
  }
}
