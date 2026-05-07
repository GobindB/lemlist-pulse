import type { Benchmarks } from "@/lib/config";

/**
 * Project additional meetings booked from remaining call activity at the given
 * daily rate. Returns the FORWARD-LOOKING delta — caller adds it to meetings
 * already booked to render "projected month-end total".
 */
export function projectedMeetingsFromCalls(
  callsPerDay: number,
  workdaysRemaining: number,
  benchmarks: Benchmarks,
): number {
  const remainingCalls = callsPerDay * workdaysRemaining;
  return Math.round(
    remainingCalls * benchmarks.connectRate * benchmarks.connectToMeeting,
  );
}

/** Same idea applied to email volume → replies → meetings. */
export function projectedMeetingsFromEmails(
  emailsPerDay: number,
  workdaysRemaining: number,
  benchmarks: Benchmarks,
): number {
  const remainingEmails = emailsPerDay * workdaysRemaining;
  return Math.round(
    remainingEmails * benchmarks.emailReplyRate * benchmarks.replyToMeeting,
  );
}

/**
 * Count the workdays remaining in the current calendar month (inclusive of today
 * if today itself is a workday — the projection assumes you still have the rest
 * of today to dial, even at 4pm).
 */
export function workdaysRemainingInMonth(
  now: Date,
  workdays: readonly number[],
): number {
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  let count = 0;
  for (let day = now.getDate(); day <= lastDay; day++) {
    const d = new Date(year, month, day);
    const isoDay = ((d.getDay() + 6) % 7) + 1;
    if (workdays.includes(isoDay)) count++;
  }
  return count;
}

/**
 * Count completed workdays before today (excluding today itself, since today is
 * still in progress and would skew the per-day rate).
 */
export function workdaysElapsedInMonth(
  now: Date,
  workdays: readonly number[],
): number {
  const year = now.getFullYear();
  const month = now.getMonth();

  let count = 0;
  for (let day = 1; day < now.getDate(); day++) {
    const d = new Date(year, month, day);
    const isoDay = ((d.getDay() + 6) % 7) + 1;
    if (workdays.includes(isoDay)) count++;
  }
  return count;
}
