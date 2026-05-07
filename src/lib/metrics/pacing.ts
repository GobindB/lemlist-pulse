import { toZonedTime, getTimezoneOffset } from "date-fns-tz";

export interface WorkingHoursLike {
  timezone: string;
  startHour: number;
  endHour: number;
  workdays: readonly number[];
}

export type PaceStatus = "ahead" | "on-track" | "behind";

/**
 * Linear ramp expectation. Before startHour: 0. After endHour: target. In between:
 * proportional. On non-workdays: 0 (no expectation).
 *
 * The ramp is intentionally linear because any curve we'd pick (heavier mornings,
 * post-lunch slump, etc.) is opinionated and would mislead more than it helps.
 */
export function expectedAtNow(
  now: Date,
  target: number,
  hours: WorkingHoursLike,
): number {
  const local = toZonedTime(now, hours.timezone);
  const isoDay = ((local.getDay() + 6) % 7) + 1; // Sunday=0 → 7, Monday=1
  if (!hours.workdays.includes(isoDay)) return 0;

  const fractionalHour = local.getHours() + local.getMinutes() / 60;
  if (fractionalHour < hours.startHour) return 0;
  if (fractionalHour >= hours.endHour) return target;

  const span = hours.endHour - hours.startHour;
  const elapsed = fractionalHour - hours.startHour;
  return Math.round(target * (elapsed / span));
}

/**
 * Compare actual vs expected with a configurable tolerance band. Default: ±10%
 * of expected counts as on-track.
 */
export function paceStatus(
  actual: number,
  expected: number,
  toleranceFraction = 0.1,
): PaceStatus {
  if (expected === 0) return actual > 0 ? "ahead" : "on-track";
  const lower = expected * (1 - toleranceFraction);
  const upper = expected * (1 + toleranceFraction);
  if (actual < lower) return "behind";
  if (actual > upper) return "ahead";
  return "on-track";
}

/** Quick predicate used by tests; isolates timezone math from the caller. */
export function localHourFraction(now: Date, timezone: string): number {
  const local = toZonedTime(now, timezone);
  return local.getHours() + local.getMinutes() / 60;
}

/**
 * Fraction of the working day elapsed in `[hours.startHour, hours.endHour]`.
 * Before startHour → 0. After endHour → 1. Non-workdays → 0.
 */
export function fractionalDayElapsed(
  now: Date,
  hours: WorkingHoursLike,
): number {
  const local = toZonedTime(now, hours.timezone);
  const isoDay = ((local.getDay() + 6) % 7) + 1;
  if (!hours.workdays.includes(isoDay)) return 0;
  const fractional = local.getHours() + local.getMinutes() / 60;
  if (fractional <= hours.startHour) return 0;
  if (fractional >= hours.endHour) return 1;
  return (fractional - hours.startHour) / (hours.endHour - hours.startHour);
}

/**
 * Fraction of the working week elapsed (Mon–Fri by default). Counts
 * completed workdays since Monday, plus today's partial day.
 */
export function fractionalWeekElapsed(
  now: Date,
  hours: WorkingHoursLike,
): number {
  const local = toZonedTime(now, hours.timezone);
  const isoToday = ((local.getDay() + 6) % 7) + 1;
  const totalWorkdays = hours.workdays.length;
  if (totalWorkdays === 0) return 0;
  // Workdays completed BEFORE today (i.e. iso < isoToday).
  let completed = 0;
  for (const d of hours.workdays) if (d < isoToday) completed += 1;
  const todayFraction = fractionalDayElapsed(now, hours);
  return (completed + todayFraction) / totalWorkdays;
}

/**
 * Linear-extrapolated end-of-period projection: at the current rate, how many
 * will we end up with by the end of the period?
 *
 * actualSoFar = current count. fractionalElapsed = 0..1 portion of period elapsed.
 * Returns 0 when fractionalElapsed is 0 (no data to extrapolate from).
 */
export function projectedEndpoint(
  actualSoFar: number,
  fractionalElapsed: number,
): number {
  if (fractionalElapsed <= 0) return 0;
  return Math.round(actualSoFar / fractionalElapsed);
}

/** Re-exported so callers don't need date-fns-tz directly. */
export { getTimezoneOffset };
