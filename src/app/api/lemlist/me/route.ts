import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getTeamSenders } from "@/lib/lemlist/endpoints";
import { cached, cacheKey } from "@/lib/cache";

export const runtime = "nodejs";

/**
 * Resolve the userId for the API key in env. Lemlist has no native /me, so we
 * pull /team/senders and find the sender whose apiKey matches.
 *
 * Cached for 7 days, keyed by sha256(apiKey) — the key itself never appears
 * in the cache key. If the key rotates, the cache misses harmlessly.
 */
export async function GET() {
  const key = process.env.LEMLIST_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "missing_api_key", message: "LEMLIST_API_KEY is not set." },
      { status: 500 },
    );
  }

  const keyHash = createHash("sha256").update(key).digest("hex").slice(0, 16);

  try {
    const me = await cached(
      async () => {
        const senders = await getTeamSenders();
        const sender = senders[0];
        if (!sender) {
          throw new Error("No senders returned by /team/senders");
        }
        return {
          userId: sender.userId,
          campaignCount: sender.campaigns?.length ?? 0,
        };
      },
      cacheKey("me:userId", keyHash),
      60 * 60 * 24 * 7,
    );
    return NextResponse.json(me);
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return NextResponse.json(
    { error: "lemlist_unavailable", message },
    { status: 503 },
  );
}
