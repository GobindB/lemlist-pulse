import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const ORIGINAL_KEY = process.env.LEMLIST_API_KEY;

beforeEach(() => {
  process.env.LEMLIST_API_KEY = "test-key";
  // Disable KV — let cache pass through to direct fetches
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
});

afterEach(() => {
  vi.restoreAllMocks();
  if (ORIGINAL_KEY === undefined) delete process.env.LEMLIST_API_KEY;
  else process.env.LEMLIST_API_KEY = ORIGINAL_KEY;
});

function mockFetch(impl: (url: string) => Response) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : (input as URL | Request).toString();
    return impl(url);
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/lemlist/me", () => {
  it("resolves userId from the first sender returned by /team/senders", async () => {
    mockFetch(() =>
      jsonResponse([
        {
          userId: "usr_test123",
          campaigns: [
            { _id: "cam_a", name: "Cold Outreach Q2" },
            { _id: "cam_b", name: "Re-engagement" },
          ],
        },
      ]),
    );

    const { GET } = await import("@/app/api/lemlist/me/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe("usr_test123");
    expect(body.campaignCount).toBe(2);
  });

  it("handles a sender with no campaigns array", async () => {
    mockFetch(() => jsonResponse([{ userId: "usr_lonely" }]));

    const { GET } = await import("@/app/api/lemlist/me/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe("usr_lonely");
    expect(body.campaignCount).toBe(0);
  });

  it("returns 503 on lemlist failure", async () => {
    mockFetch(() => jsonResponse({ error: "boom" }, 500));

    const { GET } = await import("@/app/api/lemlist/me/route");
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("lemlist_unavailable");
  });

  it("returns 500 when LEMLIST_API_KEY is missing", async () => {
    delete process.env.LEMLIST_API_KEY;
    const { GET } = await import("@/app/api/lemlist/me/route");
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe("/api/lemlist/activity", () => {
  it("rejects missing range param with 400", async () => {
    mockFetch(() => jsonResponse([]));
    const { GET } = await import("@/app/api/lemlist/activity/route");
    const req = new NextRequest("http://localhost/api/lemlist/activity");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("rejects invalid range with 400", async () => {
    mockFetch(() => jsonResponse([]));
    const { GET } = await import("@/app/api/lemlist/activity/route");
    const req = new NextRequest("http://localhost/api/lemlist/activity?range=year");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns activities for range=today", async () => {
    const nowIso = new Date().toISOString();
    mockFetch(() =>
      jsonResponse([
        { _id: "a1", type: "aircallCreated", createdAt: nowIso, duration: 60 },
      ]),
    );
    const { GET } = await import("@/app/api/lemlist/activity/route");
    const req = new NextRequest("http://localhost/api/lemlist/activity?range=today");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.range).toBe("today");
    expect(body.activities).toHaveLength(1);
  });

  it("filters by userId when provided", async () => {
    const nowIso = new Date().toISOString();
    mockFetch(() =>
      jsonResponse([
        { _id: "a1", type: "aircallCreated", createdAt: nowIso, userId: "u1" },
        { _id: "a2", type: "aircallCreated", createdAt: nowIso, userId: "u2" },
      ]),
    );
    const { GET } = await import("@/app/api/lemlist/activity/route");
    const req = new NextRequest(
      "http://localhost/api/lemlist/activity?range=today&userId=u1",
    );
    const res = await GET(req);
    const body = await res.json();
    expect(body.activities).toHaveLength(1);
    expect(body.activities[0].userId).toBe("u1");
  });

  it("filters out activities outside the today window even if lemlist returns them", async () => {
    // Activity from 3 days ago — should be excluded from "today" range.
    const oldIso = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = new Date().toISOString();
    mockFetch(() =>
      jsonResponse([
        { _id: "a_old", type: "aircallCreated", createdAt: oldIso },
        { _id: "a_now", type: "aircallCreated", createdAt: nowIso },
      ]),
    );
    const { GET } = await import("@/app/api/lemlist/activity/route");
    const req = new NextRequest("http://localhost/api/lemlist/activity?range=today");
    const res = await GET(req);
    const body = await res.json();
    expect(body.activities).toHaveLength(1);
    expect(body.activities[0]._id).toBe("a_now");
  });
});

describe("/api/lemlist/campaigns", () => {
  it("returns the campaigns array", async () => {
    mockFetch(() =>
      jsonResponse([{ _id: "c1", name: "Q2 Outbound" }]),
    );
    const { GET } = await import("@/app/api/lemlist/campaigns/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.campaigns).toHaveLength(1);
    expect(body.campaigns[0].name).toBe("Q2 Outbound");
  });
});

describe("/api/lemlist/stats", () => {
  it("rejects missing query params with 400", async () => {
    mockFetch(() => jsonResponse({ sent: 0 }));
    const { GET } = await import("@/app/api/lemlist/stats/route");
    const req = new NextRequest("http://localhost/api/lemlist/stats?id=c1");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns stats with valid params", async () => {
    mockFetch(() =>
      jsonResponse({
        sent: 100,
        delivered: 99,
        opened: 50,
        replied: 5,
        bounced: 1,
      }),
    );
    const { GET } = await import("@/app/api/lemlist/stats/route");
    const req = new NextRequest(
      "http://localhost/api/lemlist/stats?id=c1&start=2026-05-01&end=2026-05-06",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("c1");
    expect(body.stats.sent).toBe(100);
  });
});
