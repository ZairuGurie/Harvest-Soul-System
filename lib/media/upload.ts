import { createAdminClient } from "@/lib/supabase/server";

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

const MAX_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10;

export type UploadedMedia = {
  url: string;
  storagePath: string;
  type: "PHOTO" | "VIDEO";
  mimeType: string;
  fileName: string;
};

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function ensurePostMediaBucket() {
  const admin = createAdminClient();
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = (buckets ?? []).some((b) => b.id === POST_MEDIA_BUCKET || b.name === POST_MEDIA_BUCKET);
  if (exists) return;

  const { error } = await admin.storage.createBucket(POST_MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
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
    if (file.size > MAX_BYTES) {
      return { uploads: [], error: `${file.name} is too large (max 50MB).` };
    }
  }

  await ensurePostMediaBucket();
  const admin = createAdminClient();
  const uploads: UploadedMedia[] = [];

  for (const file of files) {
    const type: "PHOTO" | "VIDEO" = file.type.startsWith("video/") ? "VIDEO" : "PHOTO";
    const path = `${userId}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await admin.storage.from(POST_MEDIA_BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return { uploads: [], error: `Upload failed for ${file.name}: ${error.message}` };
    }

    const { data } = admin.storage.from(POST_MEDIA_BUCKET).getPublicUrl(path);
    uploads.push({
      url: data.publicUrl,
      storagePath: path,
      type,
      mimeType: file.type,
      fileName: file.name,
    });
  }

  return { uploads };
}

export async function removeStoragePaths(paths: string[]) {
  if (paths.length === 0) return;
  try {
    const admin = createAdminClient();
    await admin.storage.from(POST_MEDIA_BUCKET).remove(paths);
  } catch {
    // Best-effort cleanup
  }
}
