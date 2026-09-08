type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory daily rate limit (best-effort on serverless).
 * Key should include user id or anonymized IP.
 */
export function checkRateLimit(
  key: string,
  limit: number
): { allowed: boolean; remaining: number; resetAt: number } {
  if (limit <= 0) {
    return { allowed: false, remaining: 0, resetAt: Date.now() + 86_400_000 };
  }

  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + 86_400_000;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}
