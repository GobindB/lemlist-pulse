"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/kpi/KpiCard";
import { PaceCard } from "@/components/kpi/PaceCard";
import { ProjectionCard } from "@/components/kpi/ProjectionCard";
import { ActualVsTargetCurve } from "@/components/charts/ActualVsTargetCurve";
import { WeeklyBars } from "@/components/charts/WeeklyBars";
import {
  CampaignSpark,
  type CampaignSparkDatum,
} from "@/components/charts/CampaignSpark";
import {
  useMe,
  useActivity,
  useCampaigns,
} from "@/hooks/use-dashboard-data";
import {
  callCount,
  connectRate,
  interestedRate,
  totalDurationSec,
  countByType,
} from "@/lib/metrics/derived";
import {
  paceStatus,
  fractionalDayElapsed,
  fractionalWeekElapsed,
  projectedEndpoint,
} from "@/lib/metrics/pacing";
import {
  projectedMeetingsFromCalls,
  workdaysRemainingInMonth,
  workdaysElapsedInMonth,
} from "@/lib/metrics/projection";
import { TARGETS, WORKING_HOURS, BENCHMARKS } from "@/lib/config";
import type { Activity } from "@/lib/lemlist/types";
import { toZonedTime } from "date-fns-tz";

export default function DashboardPage() {
  const { data: me } = useMe();
  const userId = me?.userId;

  const { data: today, error: todayErr } = useActivity("today", userId);
  const { data: week, error: weekErr } = useActivity("week", userId);
  const { data: month } = useActivity("month", userId);
  const { data: campaigns } = useCampaigns();

  const isLoading = !today || !week || !month || !me;

  const stats = useMemo(() => {
    if (!today || !week || !month) return null;
    return computeStats(today.activities, week.activities, month.activities);
  }, [today, week, month]);

  return (
    <div className="space-y-6">
      <PageHeader daysRemaining={stats?.workdaysRemaining} />

      {todayErr || weekErr ? (
        <ErrorBanner
          message={
            todayErr?.message ??
            weekErr?.message ??
            "Lemlist API unreachable."
          }
        />
      ) : null}

      {/* Row 1 — pace + projection */}
      <section className="grid gap-4 md:grid-cols-3">
        {isLoading || !stats ? (
          <>
            <CardSkel />
            <CardSkel />
            <CardSkel />
          </>
        ) : (
          <>
            <PaceCard
              label="Today"
              actual={stats.callsToday}
              expected={stats.expectedToday}
              target={TARGETS.callsPerDay}
              status={stats.todayStatus}
            />
            <PaceCard
              label="This week"
              actual={stats.callsWeek}
              expected={stats.expectedWeek}
              target={TARGETS.callsPerWeek}
              status={stats.weekStatus}
            />
            <ProjectionCard
              booked={stats.meetingsBookedThisMonth}
              projectedDelta={stats.projectedMeetingsDelta}
              goal={TARGETS.meetingsPerMonth}
              basis={stats.projectionBasis}
            />
          </>
        )}
      </section>

      {/* Row 2 — outcome KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !stats ? (
          <>
            <CardSkel sm />
            <CardSkel sm />
            <CardSkel sm />
            <CardSkel sm />
          </>
        ) : (
          <>
            <KpiCard
              label="Connect rate"
              value={Math.round(stats.connectRateWeek * 100)}
              unit="%"
              meta="week · heuristic"
              hint={`${stats.callsWeek} dials, ${Math.round(stats.connectRateWeek * stats.callsWeek)} ≥ ${BENCHMARKS.connectDurationThresholdSec}s`}
              tone={stats.connectRateWeek >= BENCHMARKS.connectRate ? "success" : "muted"}
            />
            <KpiCard
              label="Qualified"
              value={countByType(week?.activities ?? [], ["aircallInterested"])}
              meta="week · marked"
              hint="Calls you flagged as Interested in lemlist"
              tone={
                countByType(week?.activities ?? [], ["aircallInterested"]) > 0
                  ? "success"
                  : "muted"
              }
            />
            <KpiCard
              label="Talk time"
              value={Math.round(stats.talkTimeSec / 60)}
              unit="min"
              meta="week"
              hint={`${stats.talkTimeSec}s across ${stats.callsWeek} dials`}
            />
            <KpiCard
              label="Emails sent"
              value={stats.emailsSentWeek}
              meta="week"
              hint={`Daily target: ${TARGETS.emailsPerDay}`}
              tone={stats.emailsSentWeek >= TARGETS.emailsPerWeek * 0.5 ? "success" : "muted"}
            />
          </>
        )}
      </section>

      {/* Row 3 — today's curve + this week's daily bars (50/50) */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-4">
            Today · cumulative dials
          </h3>
          {isLoading || !stats ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <ActualVsTargetCurve
              data={stats.todayCurve}
              goal={TARGETS.callsPerDay}
              projected={stats.expectedToday}
              status={stats.todayStatus}
              metricLabel="Cumulative"
              nowHour={stats.nowHour}
            />
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-4">
            This week · daily dials
          </h3>
          {isLoading || !stats ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <WeeklyBars data={stats.weekBars} target={TARGETS.callsPerDay} />
          )}
        </div>
      </section>

      {/* Row 5 — top campaigns */}
      <section>
        {!campaigns ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <CampaignSpark campaigns={topCampaigns(campaigns.campaigns)} />
        )}
      </section>
    </div>
  );
}

function PageHeader({ daysRemaining }: { daysRemaining?: number }) {
  const now = new Date();
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Sales Activity
        </p>
        <h1 className="text-2xl font-medium tracking-tight mt-1">
          {now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h1>
      </div>
      <div className="text-right">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {now.toLocaleDateString("en-US", { month: "long" })}
        </p>
        <p className="text-2xl font-medium tracking-tight mt-1 tabular-nums">
          {daysRemaining ?? "—"}{" "}
          <span className="text-base text-muted-foreground font-mono">
            days left
          </span>
        </p>
      </div>
    </div>
  );
}

function CardSkel({ sm }: { sm?: boolean }) {
  return <Skeleton className={sm ? "h-32 w-full rounded-xl" : "h-44 w-full rounded-xl"} />;
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-5 py-3 text-xs text-destructive">
      <span className="font-mono uppercase tracking-wider">api error · </span>
      {message}
    </div>
  );
}

interface ComputedStats {
  callsToday: number;
  callsWeek: number;
  expectedToday: number;
  expectedWeek: number;
  todayStatus: ReturnType<typeof paceStatus>;
  weekStatus: ReturnType<typeof paceStatus>;
  connectRateWeek: number;
  interestedRateWeek: number;
  talkTimeSec: number;
  emailsSentWeek: number;
  meetingsBookedThisMonth: number;
  projectedMeetingsDelta: number;
  projectionBasis: string;
  workdaysRemaining: number;
  todayCurve: { hour: number; actual: number }[];
  weekBars: {
    day: string;
    actual: number;
    isToday?: boolean;
    isFuture?: boolean;
    date?: string;
  }[];
  nowHour: number;
}

function computeStats(
  todayActivities: Activity[],
  weekActivities: Activity[],
  monthActivities: Activity[],
): ComputedStats {
  const now = new Date();
  const localNow = toZonedTime(now, WORKING_HOURS.timezone);

  const callsToday = callCount(todayActivities);
  const callsWeek = callCount(weekActivities);
  const callsMonth = callCount(monthActivities);

  // PACE = projected end-of-period total at your current rate (not "where you should be").
  const todayFraction = fractionalDayElapsed(now, WORKING_HOURS);
  const weekFraction = fractionalWeekElapsed(now, WORKING_HOURS);
  const projectedToday = projectedEndpoint(callsToday, todayFraction);
  const projectedWeek = projectedEndpoint(callsWeek, weekFraction);

  // --- Projection: based on the user's actual month-to-date call rate, NOT the target.
  // We exclude today from both numerator and denominator to avoid skew from a half-day.
  const elapsedWorkdays = workdaysElapsedInMonth(now, WORKING_HOURS.workdays);
  const remainingWorkdays = workdaysRemainingInMonth(now, WORKING_HOURS.workdays);
  const callsBeforeToday = callsMonth - callsToday;
  const actualPerWorkday =
    elapsedWorkdays > 0 ? callsBeforeToday / elapsedWorkdays : 0;
  const projectedDelta = projectedMeetingsFromCalls(
    actualPerWorkday,
    remainingWorkdays,
    BENCHMARKS,
  );

  const basis =
    elapsedWorkdays === 0
      ? `Insufficient data — first workday of the month. Make some calls first.`
      : `At your current pace of ${actualPerWorkday.toFixed(1)} calls/workday (${callsBeforeToday} calls over ${elapsedWorkdays} completed workdays) × ${BENCHMARKS.connectRate * 100}% connect × ${BENCHMARKS.connectToMeeting * 100}% connect→meeting.`;

  return {
    callsToday,
    callsWeek,
    expectedToday: projectedToday,
    expectedWeek: projectedWeek,
    todayStatus: paceStatus(projectedToday, TARGETS.callsPerDay),
    weekStatus: paceStatus(projectedWeek, TARGETS.callsPerWeek),
    connectRateWeek: connectRate(weekActivities),
    interestedRateWeek: interestedRate(weekActivities),
    talkTimeSec: totalDurationSec(weekActivities),
    emailsSentWeek: countByType(weekActivities, ["emailsSent"]),
    meetingsBookedThisMonth: countByType(monthActivities, ["meetingsBooked"]),
    projectedMeetingsDelta: projectedDelta,
    projectionBasis: basis,
    workdaysRemaining: remainingWorkdays,
    todayCurve: buildTodayCurve(todayActivities, localNow),
    weekBars: buildWeekBars(weekActivities, localNow),
    nowHour: localNow.getHours() + localNow.getMinutes() / 60,
  };
}

function buildTodayCurve(activities: Activity[], localNow: Date) {
  const points: { hour: number; actual: number }[] = [];

  for (let h = WORKING_HOURS.startHour; h <= WORKING_HOURS.endHour; h++) {
    const cutoff = new Date(localNow);
    cutoff.setHours(h, 0, 0, 0);

    const actual = activities.filter((a) => {
      if (a.type !== "aircallEnded") return false;
      const t = new Date(a.createdAt);
      return t.getTime() <= cutoff.getTime();
    }).length;

    points.push({ hour: h, actual });
  }
  return points;
}

function buildWeekBars(activities: Activity[], localNow: Date) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const todayIso = ((localNow.getDay() + 6) % 7) + 1; // 1=Mon
  const dayCounts = [0, 0, 0, 0, 0];

  for (const a of activities) {
    if (a.type !== "aircallEnded") continue;
    const localDate = toZonedTime(new Date(a.createdAt), WORKING_HOURS.timezone);
    const isoDay = ((localDate.getDay() + 6) % 7) + 1;
    if (isoDay >= 1 && isoDay <= 5) dayCounts[isoDay - 1] += 1;
  }

  return labels.map((day, i) => {
    const isoDay = i + 1;
    return {
      day,
      actual: dayCounts[i],
      isToday: isoDay === todayIso,
      isFuture: isoDay > todayIso,
      date: labelDate(localNow, isoDay, todayIso),
    };
  });
}

function labelDate(localNow: Date, isoDay: number, todayIso: number): string {
  const offset = isoDay - todayIso;
  const d = new Date(localNow);
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function workdaysSinceMonday(localNow: Date, workdays: readonly number[]): number {
  const todayIso = ((localNow.getDay() + 6) % 7) + 1;
  let count = 0;
  for (let d = 1; d <= todayIso; d++) {
    if (workdays.includes(d)) count++;
  }
  return count;
}

function topCampaigns(campaigns: { _id: string; name: string; status?: string }[]): CampaignSparkDatum[] {
  return campaigns.slice(0, 3).map((c) => ({
    id: c._id,
    name: c.name,
    status: c.status,
    primary: 0,
    primaryUnit: "",
    secondaryLabel: "active",
    secondaryValue: c.status === "running" ? "live" : "—",
  }));
}
