import { kv } from "@vercel/kv";

/**
 * Wraps a fetch with a TTL cache backed by Vercel KV.
 *
 * Behavior:
 * - If KV env vars are not set (local dev without KV linked), passes through to `fn` directly.
 * - On read failure, logs a warning and falls through to `fn`.
 * - On write failure, logs and returns the fresh value (cache miss next time, no big deal).
 *
 * NOTE: `@vercel/kv` is deprecated in favor of `@upstash/redis`. They use the same
 * underlying KV store; migration is mechanical when we get to it.
 */
export async function cached<T>(
  fn: () => Promise<T>,
  key: string,
  ttlSeconds: number,
): Promise<T> {
  if (!kvAvailable()) return fn();

  try {
    const hit = await kv.get<T>(key);
    if (hit !== null && hit !== undefined) return hit;
  } catch (err) {
    console.warn(`[cache] read failed for ${key}; passing through`, err);
    return fn();
  }

  const fresh = await fn();
  try {
    await kv.set(key, fresh, { ex: ttlSeconds });
  } catch (err) {
    console.warn(`[cache] write failed for ${key}; serving fresh`, err);
  }
  return fresh;
}

export function kvAvailable(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
  );
}

/** Build a cache key from positional parts. Hyphen-separated, URL-safe. */
export function cacheKey(...parts: (string | number)[]): string {
  return parts.map((p) => String(p)).join(":");
}
