import { z } from "zod";

const BASE_URL = "https://api.lemlist.com/api";

/**
 * In-memory token bucket. Lemlist's hard ceiling is 20 req / 2s. We sustain 8 r/s
 * with a burst of 12, leaving headroom for multiple Vercel function instances to
 * coexist under the global limit.
 */
class TokenBucket {
  private tokens: number;
  private lastRefill = Date.now();

  constructor(
    private readonly capacity: number,
    private readonly refillPerSec: number,
  ) {
    this.tokens = capacity;
  }

  async take(): Promise<void> {
    while (true) {
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      const deficit = 1 - this.tokens;
      const waitMs = Math.ceil((deficit / this.refillPerSec) * 1000);
      await sleep(waitMs);
    }
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSec = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      this.capacity,
      this.tokens + elapsedSec * this.refillPerSec,
    );
    this.lastRefill = now;
  }
}

const bucket = new TokenBucket(12, 8);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function authHeader(): string {
  const key = process.env.LEMLIST_API_KEY;
  if (!key) {
    throw new Error(
      "LEMLIST_API_KEY is not set. Add it to .env.local (local dev) or Vercel env vars (production).",
    );
  }
  // Basic auth: empty username, key as password.
  const encoded = Buffer.from(`:${key}`).toString("base64");
  return `Basic ${encoded}`;
}

export class LemlistError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    public readonly path: string,
  ) {
    super(`Lemlist ${status} on ${path}: ${body.slice(0, 200)}`);
    this.name = "LemlistError";
  }
}

export class LemlistSchemaError extends Error {
  constructor(
    public readonly path: string,
    public readonly issues: z.ZodIssue[],
  ) {
    super(`Lemlist schema drift on ${path}: ${JSON.stringify(issues, null, 2)}`);
    this.name = "LemlistSchemaError";
  }
}

export interface FetchJsonOptions {
  /** Path beginning with "/", e.g. "/campaigns". */
  path: string;
  /** Optional query string parameters. */
  query?: Record<string, string | number | undefined>;
  /** Schema to parse the response body. */
  schema: z.ZodType;
  /** Override the API key (for testing). */
  apiKey?: string;
  /** Override base URL (for testing). */
  baseUrl?: string;
}

/**
 * Single fetch with token bucket throttle, one 429 retry honoring Retry-After,
 * and zod parsing of the response body. Throws LemlistError on HTTP failure
 * after retries, LemlistSchemaError if the body fails the schema.
 */
export async function fetchJson<T>(opts: FetchJsonOptions): Promise<T> {
  const { path, query, schema, apiKey, baseUrl } = opts;
  const url = buildUrl(baseUrl ?? BASE_URL, path, query);
  const auth = apiKey ? `Basic ${Buffer.from(`:${apiKey}`).toString("base64")}` : authHeader();

  await bucket.take();
  let res = await fetch(url, {
    headers: { Authorization: auth, Accept: "application/json" },
  });

  if (res.status === 429) {
    const retryAfterRaw = res.headers.get("Retry-After");
    const retryAfterMs = retryAfterRaw ? Number(retryAfterRaw) * 1000 : 1000;
    await sleep(retryAfterMs);
    await bucket.take();
    res = await fetch(url, {
      headers: { Authorization: auth, Accept: "application/json" },
    });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new LemlistError(res.status, body, path);
  }

  const json = await res.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new LemlistSchemaError(path, parsed.error.issues);
  }
  return parsed.data as T;
}

function buildUrl(
  base: string,
  path: string,
  query?: Record<string, string | number | undefined>,
): string {
  const url = new URL(`${base}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

/** Exposed for testing. */
export const __testing = { TokenBucket };
