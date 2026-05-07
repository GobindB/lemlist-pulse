import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCampaignStats } from "@/lib/lemlist/endpoints";
import { cached, cacheKey } from "@/lib/cache";

export const runtime = "nodejs";

const Query = z.object({
  id: z.string().min(1),
  start: z.string().min(1), // ISO 8601
  end: z.string().min(1),
});

/**
 * GET /api/lemlist/stats?id=...&start=...&end=...
 *
 * Per-campaign stats. Lemlist requires explicit start/end — there is no
 * "all time" mode. Cached 5 minutes.
 */
export async function GET(req: NextRequest) {
  const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_query", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { id, start, end } = parsed.data;

  try {
    const stats = await cached(
      () => getCampaignStats(id, start, end),
      cacheKey("campaign:stats", id, start, end),
      60 * 5,
    );
    return NextResponse.json({ id, start, end, stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "lemlist_unavailable", message },
      { status: 503 },
    );
  }
}
