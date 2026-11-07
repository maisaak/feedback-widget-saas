import "server-only";

const windows = new Map<string, number[]>();
let lastPrunedAt = 0;
let longestWindowMs = 0;

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  longestWindowMs = Math.max(longestWindowMs, windowMs);

  if (now - lastPrunedAt >= longestWindowMs) {
    for (const [entryKey, timestamps] of windows) {
      const active = timestamps.filter((timestamp) => timestamp > now - longestWindowMs);
      if (active.length === 0) windows.delete(entryKey);
      else windows.set(entryKey, active);
    }
    lastPrunedAt = now;
  }

  const timestamps = (windows.get(key) ?? []).filter(
    (timestamp) => timestamp > now - windowMs,
  );
  const oldest = timestamps[0];
  if (timestamps.length >= limit && oldest !== undefined) {
    windows.set(key, timestamps);
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, oldest + windowMs - now),
    };
  }

  timestamps.push(now);
  windows.set(key, timestamps);
  return { ok: true, remaining: Math.max(0, limit - timestamps.length), retryAfterMs: 0 };
}
