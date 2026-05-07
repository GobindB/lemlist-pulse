import { NextResponse } from "next/server";
import { getCampaigns } from "@/lib/lemlist/endpoints";
import { cached, cacheKey } from "@/lib/cache";

export const runtime = "nodejs";

/** GET /api/lemlist/campaigns — list of campaigns for the API key. Cached 10 min. */
export async function GET() {
  try {
    const campaigns = await cached(
      () => getCampaigns(),
      cacheKey("campaigns:list", "all"),
      60 * 10,
    );
    return NextResponse.json({ campaigns });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "lemlist_unavailable", message },
      { status: 503 },
    );
  }
}
