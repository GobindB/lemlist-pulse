import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import {
  fetchJson,
  LemlistError,
  LemlistSchemaError,
  __testing,
} from "@/lib/lemlist/client";
import { ActivitiesResponse } from "@/lib/lemlist/types";

const ORIGINAL_KEY = process.env.LEMLIST_API_KEY;

beforeEach(() => {
  process.env.LEMLIST_API_KEY = "test-key";
});

afterEach(() => {
  vi.restoreAllMocks();
  if (ORIGINAL_KEY === undefined) delete process.env.LEMLIST_API_KEY;
  else process.env.LEMLIST_API_KEY = ORIGINAL_KEY;
});

function mockFetch(impl: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const spy = vi.spyOn(globalThis, "fetch");
  spy.mockImplementation(async (input, init) => {
    const url = typeof input === "string" ? input : (input as URL | Request).toString();
    return impl(url, init);
  });
  return spy;
}

describe("TokenBucket", () => {
  it("rate-limits when tokens drained, refilling over time", async () => {
    const { TokenBucket } = __testing;
    const bucket = new TokenBucket(2, 10); // 2 burst, 10/sec refill
    const start = Date.now();
    await bucket.take();
    await bucket.take();
    await bucket.take(); // third call must wait ~100ms for one token
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(80);
  });

  it("allows immediate burst up to capacity without waiting", async () => {
    const { TokenBucket } = __testing;
    const bucket = new TokenBucket(3, 1); // big capacity, slow refill
    const start = Date.now();
    await bucket.take();
    await bucket.take();
    await bucket.take();
    expect(Date.now() - start).toBeLessThan(50);
  });
});

describe("fetchJson", () => {
  it("parses a successful response with the schema", async () => {
    mockFetch(() =>
      new Response(
        JSON.stringify([
          {
            _id: "a1",
            type: "aircallCreated",
            createdAt: "2026-05-06T10:00:00.000Z",
            duration: 45,
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await fetchJson({
      path: "/activities",
      schema: ActivitiesResponse,
    });

    expect(result).toHaveLength(1);
    expect((result as Array<{ _id: string }>)[0]._id).toBe("a1");
  });

  it("retries once on 429 honoring Retry-After", async () => {
    let calls = 0;
    mockFetch(() => {
      calls++;
      if (calls === 1) {
        return new Response(null, {
          status: 429,
          headers: { "Retry-After": "0" },
        });
      }
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const result = await fetchJson({
      path: "/activities",
      schema: ActivitiesResponse,
    });

    expect(calls).toBe(2);
    expect(result).toEqual([]);
  });

  it("throws LemlistError on non-2xx after retries", async () => {
    mockFetch(() =>
      new Response(JSON.stringify({ error: "bad request" }), { status: 400 }),
    );

    await expect(
      fetchJson({ path: "/activities", schema: ActivitiesResponse }),
    ).rejects.toBeInstanceOf(LemlistError);
  });

  it("throws LemlistSchemaError when response shape doesn't match", async () => {
    mockFetch(() =>
      new Response(JSON.stringify({ unexpected: "object-not-array" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      fetchJson({ path: "/activities", schema: ActivitiesResponse }),
    ).rejects.toBeInstanceOf(LemlistSchemaError);
  });

  it("throws clear error when LEMLIST_API_KEY is missing", async () => {
    delete process.env.LEMLIST_API_KEY;
    const tinySchema = z.array(z.unknown());
    await expect(
      fetchJson({ path: "/activities", schema: tinySchema }),
    ).rejects.toThrow(/LEMLIST_API_KEY/);
  });

  it("includes query params on the request URL", async () => {
    let receivedUrl = "";
    mockFetch((url) => {
      receivedUrl = url;
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await fetchJson({
      path: "/activities",
      query: { type: "aircallCreated", limit: 100, offset: 0 },
      schema: ActivitiesResponse,
    });

    expect(receivedUrl).toContain("type=aircallCreated");
    expect(receivedUrl).toContain("limit=100");
    expect(receivedUrl).toContain("offset=0");
  });

  it("sends Basic auth header with empty username and key as password", async () => {
    let receivedAuth = "";
    mockFetch((_url, init) => {
      const headers = new Headers(init?.headers);
      receivedAuth = headers.get("Authorization") ?? "";
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await fetchJson({
      path: "/activities",
      schema: ActivitiesResponse,
      apiKey: "explicit-test-key",
    });

    // Expect: Basic base64(":explicit-test-key")
    const expected = `Basic ${Buffer.from(":explicit-test-key").toString("base64")}`;
    expect(receivedAuth).toBe(expected);
  });
});
