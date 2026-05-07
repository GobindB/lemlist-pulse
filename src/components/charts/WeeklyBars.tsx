"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";

interface BarDatum {
  /** Short label, e.g. "Mon". */
  day: string;
  /** Calls (or whatever) made that day. */
  actual: number;
  /** Whether this is today (in-progress day). */
  isToday?: boolean;
  /** Whether this day is in the future (hasn't happened yet). */
  isFuture?: boolean;
  /** ISO date for tooltip. */
  date?: string;
}

interface WeeklyBarsProps {
  data: BarDatum[];
  /** Daily target — drawn as a horizontal reference line. */
  target: number;
  height?: number;
  metricLabel?: string;
}

// Status colors mirror the cumulative-dials chart.
const COLOR_HIT = "oklch(0.72 0.18 145 / 0.85)"; // success
const COLOR_MISS = "oklch(0.63 0.22 25 / 0.8)"; // destructive
const COLOR_TODAY_PARTIAL = "oklch(0.68 0.15 240 / 0.8)"; // info (in progress)
const COLOR_FUTURE = "oklch(0.18 0.005 280)"; // muted (hasn't happened)

function barFill(d: BarDatum, target: number): string {
  if (d.isFuture) return COLOR_FUTURE;
  if (d.actual >= target) return COLOR_HIT;
  if (d.isToday) return COLOR_TODAY_PARTIAL;
  return COLOR_MISS;
}

export function WeeklyBars({
  data,
  target,
  height = 220,
  metricLabel = "Calls",
}: WeeklyBarsProps) {
  // Match the cumulative chart: snap y-axis to clean multiples so the goal
  // sits on a tick. Avoids the "0.75 / 1.5 / 2.25" fractional ticks.
  const maxActual = data.reduce((m, d) => Math.max(m, d.actual), 0);
  const rawMax = Math.max(target, maxActual, 5);
  const yMax = Math.ceil(rawMax / 5) * 5;
  const tickStep = yMax >= 40 ? 10 : 5;
  const ticks = Array.from(
    { length: Math.floor(yMax / tickStep) + 1 },
    (_, i) => i * tickStep,
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 56, bottom: 8, left: -16 }}>
        <CartesianGrid
          stroke="oklch(0.2 0.005 280)"
          strokeDasharray="2 4"
          vertical={false}
        />
        <XAxis
          dataKey="day"
          stroke="oklch(0.5 0.01 280)"
          tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke="oklch(0.5 0.01 280)"
          tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
          axisLine={false}
          tickLine={false}
          width={40}
          domain={[0, yMax]}
          ticks={ticks}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "oklch(0.13 0.005 280)",
            border: "1px solid oklch(0.18 0.005 280)",
            borderRadius: 8,
            fontSize: 12,
            padding: "6px 10px",
          }}
          labelStyle={{
            color: "oklch(0.55 0.01 280)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 2,
          }}
          itemStyle={{ color: "oklch(0.97 0.005 280)", padding: 0 }}
          cursor={{ fill: "oklch(0.18 0.005 280 / 0.4)" }}
          separator=" "
          formatter={(v: number) => [`${v} ${v === 1 ? "call" : "calls"}`, ""]}
          labelFormatter={(_, payload) => {
            const p = payload?.[0]?.payload as BarDatum | undefined;
            if (!p) return "";
            return p.date ? `${p.day}, ${p.date}` : p.day;
          }}
        />
        <ReferenceLine
          y={target}
          stroke="oklch(0.55 0.01 280)"
          strokeDasharray="4 4"
          label={{
            value: `goal ${target}`,
            fill: "oklch(0.55 0.01 280)",
            fontSize: 10,
            position: "right",
          }}
        />
        <Bar dataKey="actual" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={barFill(d, target)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
