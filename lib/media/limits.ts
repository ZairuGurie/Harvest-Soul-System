/**
 * Practical upload size limits.
 * Supabase / Vercel plans still enforce their own caps — this is not "unlimited".
 *
 * Override with MEDIA_MAX_UPLOAD_BYTES (integer bytes), e.g. 104857600 = 100MB.
 */
const DEFAULT_MAX_BYTES = 100 * 1024 * 1024; // 100MB
const HARD_CEILING_BYTES = 200 * 1024 * 1024; // 200MB app ceiling

export function getMaxUploadBytes(): number {
  const raw = process.env.MEDIA_MAX_UPLOAD_BYTES;
  if (raw && /^\d+$/.test(raw)) {
    const n = Number(raw);
    if (n > 0) return Math.min(n, HARD_CEILING_BYTES);
  }
  return DEFAULT_MAX_BYTES;
}

export function formatBytesLabel(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${Math.round(mb)}MB`;
  return `${Math.round(bytes / 1024)}KB`;
}

export function sanitizeStorageFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() || "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "").slice(0, 120) || "file";
}

/** Collision-resistant object key: {userId}/{uuid}/{sanitizedName} */
export function buildUniqueStoragePath(userId: string, fileName: string, prefix?: string): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const safe = sanitizeStorageFileName(fileName);
  const mid = prefix ? `${prefix}/${userId}` : userId;
  return `${mid}/${id}/${safe}`;
}

/** Allow deletes only for paths owned by this user (or worship/{userId}/...). */
export function isPathOwnedByUser(path: string, userId: string): boolean {
  if (!path || path.includes("..") || path.startsWith("/")) return false;
  return (
    path.startsWith(`${userId}/`) ||
    path.startsWith(`worship/${userId}/`)
  );
}
