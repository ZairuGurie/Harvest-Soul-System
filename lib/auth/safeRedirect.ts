/**
 * Safe same-origin path for login redirects.
 * Rejects protocol-relative URLs (//evil.com) and backslash tricks.
 */
export function safeInternalPath(
  next: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!next) return fallback;
  const value = String(next).trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  if (value.includes("://")) return fallback;
  return value;
}
