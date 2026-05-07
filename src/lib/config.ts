/**
 * All tunable knobs live here. The dashboard's behavior changes with these numbers,
 * so any tuning should happen in one place. Re-deploy after edits.
 */

/** Daily and weekly activity targets. Pessimistic defaults — tune up after a week of real use. */
export const TARGETS = {
  callsPerDay: 20,
  callsPerWeek: 100,
  emailsPerDay: 80,
  emailsPerWeek: 400,
  meetingsPerMonth: 8,
} as const;

/** Working hours used to compute "expected at now" pace lines. */
export const WORKING_HOURS = {
  timezone: "America/Los_Angeles",
  startHour: 8, // 8am local
  endHour: 17, // 5pm local
  /** ISO weekdays: 1=Mon ... 7=Sun. */
  workdays: [1, 2, 3, 4, 5] as const,
} as const;

/** Industry-standard cold-call / cold-email conversion rates (pessimistic). */
export const BENCHMARKS = {
  /**
   * Calls with duration >= this many seconds count as "connected".
   * Lemlist exposes no native "answered" flag — this is a heuristic, not truth.
   * 60s avoids counting most voicemail greetings as connects (they typically
   * run 30–45s). For ground-truth, use `aircallInterested` count instead.
   */
  connectDurationThresholdSec: 60,
  /** Fraction of dials that result in a connect. */
  connectRate: 0.05,
  /** Fraction of connects that result in a booked meeting. */
  connectToMeeting: 0.08,
  /** Fraction of email replies that result in a booked meeting. */
  replyToMeeting: 0.2,
  /** Baseline cold-email reply rate. */
  emailReplyRate: 0.015,
} as const;

export type Targets = typeof TARGETS;
export type WorkingHours = typeof WORKING_HOURS;
export type Benchmarks = typeof BENCHMARKS;
