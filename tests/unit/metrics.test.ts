import { describe, it, expect } from "vitest";
import { expectedAtNow, paceStatus } from "@/lib/metrics/pacing";
import {
  projectedMeetingsFromCalls,
  projectedMeetingsFromEmails,
  workdaysRemainingInMonth,
  workdaysElapsedInMonth,
} from "@/lib/metrics/projection";
import {
  connectRate,
  interestedRate,
  replyRate,
  totalDurationSec,
  countByType,
  callCount,
} from "@/lib/metrics/derived";
import { BENCHMARKS, WORKING_HOURS } from "@/lib/config";
import type { Activity } from "@/lib/lemlist/types";

const HOURS = {
  timezone: "America/Los_Angeles",
  startHour: 8,
  endHour: 17,
  workdays: [1, 2, 3, 4, 5] as const,
};

/** UTC date that maps to a specific local time in America/Los_Angeles.
 *  PT is UTC-7 (PDT). So "2026-05-06 12:00 PDT" = "2026-05-06 19:00 UTC". */
function pdt(localISO: string): Date {
  // Naive: interpret string as PDT (-07:00). Adjust if timezone changes seasonally.
  return new Date(`${localISO}-07:00`);
}

describe("expectedAtNow", () => {
  it("returns 0 before working hours start", () => {
    const now = pdt("2026-05-06T07:30:00"); // 7:30am PDT, before 8am
    expect(expectedAtNow(now, 30, HOURS)).toBe(0);
  });

  it("returns target after working hours end", () => {
    const now = pdt("2026-05-06T18:00:00"); // 6pm PDT, after 5pm
    expect(expectedAtNow(now, 30, HOURS)).toBe(30);
  });

  it("returns mid-target at midpoint of the working window", () => {
    const now = pdt("2026-05-06T12:30:00"); // 12:30pm PDT — exactly halfway between 8 and 17
    expect(expectedAtNow(now, 30, HOURS)).toBe(15);
  });

  it("returns 0 on weekends", () => {
    const sat = pdt("2026-05-09T12:00:00"); // Saturday noon
    expect(expectedAtNow(sat, 30, HOURS)).toBe(0);
    const sun = pdt("2026-05-10T12:00:00"); // Sunday noon
    expect(expectedAtNow(sun, 30, HOURS)).toBe(0);
  });

  it("scales with target", () => {
    const now = pdt("2026-05-06T12:30:00"); // halfway
    expect(expectedAtNow(now, 100, HOURS)).toBe(50);
  });
});

describe("paceStatus", () => {
  it("returns 'on-track' within ±10% tolerance band", () => {
    expect(paceStatus(10, 10)).toBe("on-track");
    expect(paceStatus(11, 10)).toBe("on-track"); // +10%
    expect(paceStatus(9, 10)).toBe("on-track"); // -10%
  });

  it("returns 'ahead' above the band", () => {
    expect(paceStatus(12, 10)).toBe("ahead");
    expect(paceStatus(20, 10)).toBe("ahead");
  });

  it("returns 'behind' below the band", () => {
    expect(paceStatus(8, 10)).toBe("behind");
    expect(paceStatus(0, 10)).toBe("behind");
  });

  it("treats expected=0 as on-track unless actual is positive", () => {
    expect(paceStatus(0, 0)).toBe("on-track");
    expect(paceStatus(5, 0)).toBe("ahead");
  });
});

describe("projection math", () => {
  it("multiplies calls × connectRate × connectToMeeting", () => {
    const projected = projectedMeetingsFromCalls(30, 10, BENCHMARKS);
    // 30 calls/day × 10 days = 300 calls. 300 × 0.05 × 0.08 = 1.2 → rounded to 1
    expect(projected).toBe(1);
  });

  it("scales linearly with daily rate", () => {
    const a = projectedMeetingsFromCalls(60, 10, BENCHMARKS);
    const b = projectedMeetingsFromCalls(30, 10, BENCHMARKS);
    expect(a).toBeGreaterThanOrEqual(b * 2 - 1);
  });

  it("returns 0 with no remaining workdays", () => {
    expect(projectedMeetingsFromCalls(30, 0, BENCHMARKS)).toBe(0);
  });

  it("emails projection: 80/day × 20 days × 1.5% reply × 20% reply→meeting", () => {
    // 80 × 20 = 1600 emails. 1600 × 0.015 × 0.2 = 4.8 → 5
    const projected = projectedMeetingsFromEmails(80, 20, BENCHMARKS);
    expect(projected).toBe(5);
  });
});

describe("workdaysRemainingInMonth", () => {
  it("counts mid-month correctly", () => {
    // 2026-05-06 is a Wednesday. May has 31 days. From May 6 to May 31:
    // Working days: 6,7,8(M-W-Th-F start partial) ... Mon-Fri only.
    // Just sanity-check that result is positive and reasonable.
    const now = new Date("2026-05-06T12:00:00Z");
    const remaining = workdaysRemainingInMonth(now, [1, 2, 3, 4, 5]);
    expect(remaining).toBeGreaterThan(15);
    expect(remaining).toBeLessThan(22);
  });

  it("end-of-month case: last workday returns 1", () => {
    // Find the last workday of May 2026 → May 29 (Friday)
    const now = new Date(2026, 4, 29, 12, 0); // May 29 2026
    const remaining = workdaysRemainingInMonth(now, [1, 2, 3, 4, 5]);
    expect(remaining).toBe(1);
  });
});

describe("workdaysElapsedInMonth", () => {
  it("returns 0 on the first day of the month", () => {
    const now = new Date(2026, 4, 1, 12, 0); // Fri May 1
    expect(workdaysElapsedInMonth(now, [1, 2, 3, 4, 5])).toBe(0);
  });

  it("counts only completed workdays before today", () => {
    // Thu May 7 2026. Workdays before today: May 1 (Fri), 4 (Mon), 5 (Tue), 6 (Wed) = 4
    const now = new Date(2026, 4, 7, 12, 0);
    expect(workdaysElapsedInMonth(now, [1, 2, 3, 4, 5])).toBe(4);
  });

  it("excludes weekends", () => {
    // Mon May 11 2026. Workdays before today in May: May 1, 4, 5, 6, 7, 8 = 6
    const now = new Date(2026, 4, 11, 12, 0);
    expect(workdaysElapsedInMonth(now, [1, 2, 3, 4, 5])).toBe(6);
  });
});

describe("derived metrics", () => {
  // Real lemlist emits BOTH aircallCreated AND aircallEnded for each dial.
  // Only aircallEnded carries duration — that's our canonical "call happened" event.
  const sampleActivities: Activity[] = [
    { _id: "c1", type: "aircallCreated", createdAt: "2026-05-06T10:00:00Z" },
    { _id: "e1", type: "aircallEnded", createdAt: "2026-05-06T10:01:00Z", duration: 60 },
    { _id: "c2", type: "aircallCreated", createdAt: "2026-05-06T11:00:00Z" },
    { _id: "e2", type: "aircallEnded", createdAt: "2026-05-06T11:00:05Z", duration: 5 },
    { _id: "c3", type: "aircallCreated", createdAt: "2026-05-06T12:00:00Z" },
    { _id: "e3", type: "aircallEnded", createdAt: "2026-05-06T12:00:35Z", duration: 35 },
    { _id: "c4", type: "aircallCreated", createdAt: "2026-05-06T13:00:00Z" },
    { _id: "e4", type: "aircallEnded", createdAt: "2026-05-06T13:00:00Z", duration: 0 },
    { _id: "i1", type: "aircallInterested", createdAt: "2026-05-06T14:00:00Z" },
  ];

  it("callCount: only aircallEnded events (one per dial)", () => {
    expect(callCount(sampleActivities)).toBe(4);
  });

  it("connectRate: 2 of 4 ended calls had duration >= 30s", () => {
    // Pass threshold explicitly so the test isn't coupled to config defaults.
    expect(connectRate(sampleActivities, 30)).toBe(0.5);
  });

  it("connectRate: 1 of 4 ended calls had duration >= 60s (default threshold)", () => {
    expect(connectRate(sampleActivities)).toBe(0.25);
  });

  it("connectRate: returns 0 with no calls", () => {
    expect(connectRate([])).toBe(0);
  });

  it("interestedRate: 1 interested / 4 ended = 0.25", () => {
    expect(interestedRate(sampleActivities)).toBe(0.25);
  });

  it("replyRate: replied / sent", () => {
    expect(replyRate({ sent: 100, replied: 5 })).toBe(0.05);
    expect(replyRate({ sent: 0, replied: 0 })).toBe(0);
  });

  it("totalDurationSec: sums durations including zero/missing", () => {
    expect(totalDurationSec(sampleActivities)).toBe(60 + 5 + 35 + 0);
  });

  it("countByType: matches a type filter", () => {
    expect(countByType(sampleActivities, ["aircallEnded"])).toBe(4);
    expect(
      countByType(sampleActivities, ["aircallInterested", "aircallNotInterested"]),
    ).toBe(1);
  });
});

describe("config sanity", () => {
  it("WORKING_HOURS has a 9-hour window", () => {
    expect(WORKING_HOURS.endHour - WORKING_HOURS.startHour).toBe(9);
  });

  it("BENCHMARKS rates are between 0 and 1", () => {
    expect(BENCHMARKS.connectRate).toBeGreaterThan(0);
    expect(BENCHMARKS.connectRate).toBeLessThan(1);
    expect(BENCHMARKS.connectToMeeting).toBeGreaterThan(0);
    expect(BENCHMARKS.connectToMeeting).toBeLessThan(1);
  });
});
