import { createAdminClient } from "@/lib/supabase/server";
import {
  buildUniqueStoragePath,
  formatBytesLabel,
  getMaxUploadBytes,
  isPathOwnedByUser,
  sanitizeStorageFileName,
} from "@/lib/media/limits";

export const POST_MEDIA_BUCKET = "post-media";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const MAX_FILES = 10;

export type UploadedMedia = {
  url: string;
  storagePath: string;
  type: "PHOTO" | "VIDEO";
  mimeType: string;
  fileName: string;
  fileSizeBytes?: number;
};

export { sanitizeStorageFileName };

export async function ensurePostMediaBucket() {
  const admin = createAdminClient();
  const maxBytes = getMaxUploadBytes();
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = (buckets ?? []).some((b) => b.id === POST_MEDIA_BUCKET || b.name === POST_MEDIA_BUCKET);
  if (exists) {
    // Best-effort bump of plan-compatible limit (ignored if provider rejects).
    try {
      await admin.storage.updateBucket(POST_MEDIA_BUCKET, {
        public: true,
        fileSizeLimit: maxBytes,
        allowedMimeTypes: [...ALLOWED_MIME],
      });
    } catch {
      // keep existing bucket settings
    }
    return;
  }

  const { error } = await admin.storage.createBucket(POST_MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: maxBytes,
    allowedMimeTypes: [...ALLOWED_MIME],
  });
  if (error && !/already exists|duplicate/i.test(error.message)) {
    throw new Error(`Could not create storage bucket: ${error.message}`);
  }
}

export function collectMediaFiles(formData: FormData): File[] {
  const raw = formData.getAll("media");
  return raw.filter((f): f is File => f instanceof File && f.size > 0);
}

export async function uploadPostMediaFiles(
  files: File[],
  userId: string
): Promise<{ uploads: UploadedMedia[]; error?: string }> {
  const maxBytes = getMaxUploadBytes();
  if (files.length === 0) return { uploads: [] };
  if (files.length > MAX_FILES) {
    return { uploads: [], error: `You can attach up to ${MAX_FILES} photos/videos.` };
  }

  for (const file of files) {
    if (!ALLOWED_MIME.has(file.type)) {
      return {
        uploads: [],
        error: `Unsupported file type: ${file.type || file.name}. Use JPG, PNG, WebP, GIF, MP4, or WebM.`,
      };
    }
    if (file.size > maxBytes) {
      return {
        uploads: [],
        error: `${file.name} is too large (max ${formatBytesLabel(maxBytes)}).`,
      };
    }
  }

  await ensurePostMediaBucket();
  const admin = createAdminClient();
  const uploads: UploadedMedia[] = [];

  for (const file of files) {
    const type: "PHOTO" | "VIDEO" = file.type.startsWith("video/") ? "VIDEO" : "PHOTO";
    const path = buildUniqueStoragePath(userId, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await admin.storage.from(POST_MEDIA_BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      // Roll back only objects created in this request.
      if (uploads.length > 0) {
        await removeStoragePaths(
          uploads.map((u) => u.storagePath),
          userId
        );
      }
      return { uploads: [], error: `Upload failed for ${file.name}: ${error.message}` };
    }

    const { data } = admin.storage.from(POST_MEDIA_BUCKET).getPublicUrl(path);
    uploads.push({
      url: data.publicUrl,
      storagePath: path,
      type,
      mimeType: file.type,
      fileName: file.name,
      fileSizeBytes: file.size,
    });
  }

  return { uploads };
}

/**
 * Prepare a direct-to-Storage signed upload (avoids routing large bodies through Next/Vercel).
 * Old objects are never overwritten (unique path + upsert false on client).
 */
export async function preparePostMediaSignedUpload(
  userId: string,
  fileName: string,
  mimeType: string,
  fileSize: number
): Promise<
  | {
      upload: {
        bucket: string;
        path: string;
        token: string;
        signedUrl: string;
        publicUrl: string;
        type: "PHOTO" | "VIDEO";
        fileName: string;
        mimeType: string;
        fileSizeBytes: number;
      };
    }
  | { error: string }
> {
  const maxBytes = getMaxUploadBytes();
  if (!ALLOWED_MIME.has(mimeType)) {
    return {
      error: `Unsupported file type: ${mimeType || fileName}. Use JPG, PNG, WebP, GIF, MP4, or WebM.`,
    };
  }
  if (fileSize <= 0 || fileSize > maxBytes) {
    return { error: `File is too large (max ${formatBytesLabel(maxBytes)}).` };
  }

  await ensurePostMediaBucket();
  const admin = createAdminClient();
  const path = buildUniqueStoragePath(userId, fileName);
  const { data, error } = await admin.storage.from(POST_MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    return { error: error?.message || "Could not prepare upload." };
  }

  const publicUrl = admin.storage.from(POST_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
  const type: "PHOTO" | "VIDEO" = mimeType.startsWith("video/") ? "VIDEO" : "PHOTO";

  return {
    upload: {
      bucket: POST_MEDIA_BUCKET,
      path,
      token: data.token,
      signedUrl: data.signedUrl,
      publicUrl,
      type,
      fileName: sanitizeStorageFileName(fileName),
      mimeType,
      fileSizeBytes: fileSize,
    },
  };
}

export async function removeStoragePaths(paths: string[], ownerUserId?: string) {
  const safe = paths.filter((p) => {
    if (!p || typeof p !== "string") return false;
    if (p.includes("..") || /^https?:\/\//i.test(p)) return false;
    if (ownerUserId) return isPathOwnedByUser(p, ownerUserId);
    // Without owner, only allow previously stored-looking relative keys (no traversal).
    return !p.startsWith("/") && !p.includes("..");
  });
  if (safe.length === 0) return;
  try {
    const admin = createAdminClient();
    await admin.storage.from(POST_MEDIA_BUCKET).remove(safe);
  } catch {
    // Best-effort cleanup of THIS request's objects only
  }
}
