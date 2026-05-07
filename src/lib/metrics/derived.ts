import type { Activity } from "@/lib/lemlist/types";
import { BENCHMARKS } from "@/lib/config";

/**
 * One canonical call event per dial. Lemlist emits BOTH `aircallCreated` and
 * `aircallEnded` for every call — only `aircallEnded` carries duration, so we
 * use it as the "this call happened" anchor.
 */
function endedCalls(activities: Activity[]): Activity[] {
  return activities.filter((a) => a.type === "aircallEnded");
}

/**
 * Connect rate — fraction of dials with `duration >= connectDurationThresholdSec`.
 * Lemlist provides no native "connected" flag; the duration threshold is the
 * standard SDR-tooling convention. Tunable in `src/lib/config.ts`.
 */
export function connectRate(
  activities: Activity[],
  threshold: number = BENCHMARKS.connectDurationThresholdSec,
): number {
  const calls = endedCalls(activities);
  if (calls.length === 0) return 0;
  const connected = calls.filter((a) => (a.duration ?? 0) >= threshold);
  return connected.length / calls.length;
}

/** Fraction of completed calls that resulted in `aircallInterested`. */
export function interestedRate(activities: Activity[]): number {
  const calls = endedCalls(activities);
  if (calls.length === 0) return 0;
  const interested = activities.filter((a) => a.type === "aircallInterested").length;
  return interested / calls.length;
}

/** Count of distinct dials in the window (one per `aircallEnded`). */
export function callCount(activities: Activity[]): number {
  return endedCalls(activities).length;
}

/** Email reply rate. */
export function replyRate(stats: { sent: number; replied: number }): number {
  if (stats.sent === 0) return 0;
  return stats.replied / stats.sent;
}

/** Sum durations for "talk time" cards. */
export function totalDurationSec(activities: Activity[]): number {
  return activities.reduce((sum, a) => sum + (a.duration ?? 0), 0);
}

/** Count activities by `type` filter. Common pattern in card-level rendering. */
export function countByType(activities: Activity[], types: readonly string[]): number {
  const set = new Set(types);
  return activities.filter((a) => set.has(a.type)).length;
}
