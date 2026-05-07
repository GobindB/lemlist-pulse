import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { startOfDay, endOfDay, startOfWeek } from "date-fns";
import { getAllActivities } from "@/lib/lemlist/endpoints";
import { cached, cacheKey } from "@/lib/cache";
import { WORKING_HOURS } from "@/lib/config";

export const runtime = "nodejs";

const Query = z.object({
  range: z.enum(["today", "week", "month"]),
  userId: z.string().optional(),
  campaignId: z.string().optional(),
});

/**
 * GET /api/lemlist/activity?range=today|week[&userId=...]
 *
 * Returns raw activities for the requested window, scoped to the configured timezone.
 * The client computes derived rates (connect rate, etc.) from the raw set.
 */
export async function GET(req: NextRequest) {
  const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_query", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { range, userId, campaignId } = parsed.data;

  const { startDate, endDate, label } = computeRange(range);
  const userScope = userId ?? "all";
  const campaignScope = campaignId ?? "all";
  const ttl = 60;

  try {
    const activities = await cached(
      () => getAllActivities({ startDate, endDate, campaignId }),
      cacheKey(`activity:${range}`, userScope, campaignScope, label),
      ttl,
    );

    // Lemlist's /activities endpoint does not reliably honor startDate/endDate.
    // We pass them through as a hint, but always trust the local window check
    // by filtering on each activity's createdAt.
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    const filtered = activities.filter((a) => {
      const t = new Date(a.createdAt).getTime();
      if (t < startMs || t > endMs) return false;
      if (userId && a.userId && a.userId !== userId) return false;
      return true;
    });

    return NextResponse.json({
      range,
      startDate,
      endDate,
      activities: filtered,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

function computeRange(range: "today" | "week" | "month"): {
  startDate: string;
  endDate: string;
  label: string;
} {
  const now = new Date();
  const localNow = toZonedTime(now, WORKING_HOURS.timezone);

  if (range === "today") {
    const localStart = startOfDay(localNow);
    const localEnd = endOfDay(localNow);
    return {
      startDate: fromZonedTime(localStart, WORKING_HOURS.timezone).toISOString(),
      endDate: fromZonedTime(localEnd, WORKING_HOURS.timezone).toISOString(),
      label: localNow.toISOString().slice(0, 10),
    };
  }

  if (range === "month") {
    const localMonthStart = new Date(
      localNow.getFullYear(),
      localNow.getMonth(),
      1,
    );
    const localEnd = endOfDay(localNow);
    return {
      startDate: fromZonedTime(localMonthStart, WORKING_HOURS.timezone).toISOString(),
      endDate: fromZonedTime(localEnd, WORKING_HOURS.timezone).toISOString(),
      label: localNow.toISOString().slice(0, 7), // yyyy-mm
    };
  }

  // week — weekStartsOn: 1 = Monday
  const localWeekStart = startOfWeek(localNow, { weekStartsOn: 1 });
  const localEnd = endOfDay(localNow);
  return {
    startDate: fromZonedTime(localWeekStart, WORKING_HOURS.timezone).toISOString(),
    endDate: fromZonedTime(localEnd, WORKING_HOURS.timezone).toISOString(),
    label: isoWeekLabel(localWeekStart),
  };
}

function isoWeekLabel(date: Date): string {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function errorResponse(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return NextResponse.json(
    { error: "lemlist_unavailable", message },
    { status: 503 },
  );
}
