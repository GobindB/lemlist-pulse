"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { PaceStatus } from "@/lib/metrics/pacing";

interface CurvePoint {
  hour: number; // 8..17
  actual: number;
}

interface ActualVsTargetCurveProps {
  data: CurvePoint[];
  /** Daily goal — drawn as a horizontal dashed reference line. */
  goal: number;
  /** Projected end-of-day total at current rate. Used to color the line via `status`. */
  projected: number;
  /** Status drives the line color: behind=red, on-track=blue, ahead=green. */
  status: PaceStatus;
  /** Tooltip label for the actual series. */
  metricLabel?: string;
  /** Where the day's "now" is (hour). Drawn as a vertical reference line. */
  nowHour?: number;
  height?: number;
}

const STATUS_COLOR: Record<PaceStatus, string> = {
  behind: "oklch(0.63 0.22 25)", // destructive
  "on-track": "oklch(0.68 0.15 240)", // info
  ahead: "oklch(0.72 0.18 145)", // success
};

const fmtHourTick = (h: number) => {
  const ampm = h >= 12 ? "p" : "a";
  const display = h > 12 ? h - 12 : h;
  return `${display}${ampm}`;
};

const fmtHourLabel = (h: number) => {
  const ampm = h >= 12 ? "PM" : "AM";
  const display = h > 12 ? h - 12 : h;
  return `${display}:00 ${ampm}`;
};

export function ActualVsTargetCurve({
  data,
  goal,
  projected,
  status,
  metricLabel = "Calls",
  nowHour,
  height = 220,
}: ActualVsTargetCurveProps) {
  const color = STATUS_COLOR[status];
  const maxActual = data.reduce((m, p) => Math.max(m, p.actual), 0);
  // Round up to a clean multiple of 5 above the highest value we need to plot,
  // so the y-axis hits whole-number ticks (0, 5, 10, 15, 20) instead of 22, 6, 12.
  const rawMax = Math.max(goal, maxActual, projected, 5);
  const yMax = Math.ceil(rawMax / 5) * 5;
  const tickStep = yMax >= 40 ? 10 : 5;
  const ticks = Array.from(
    { length: Math.floor(yMax / tickStep) + 1 },
    (_, i) => i * tickStep,
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 56, bottom: 8, left: -16 }}
      >
        <defs>
          <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="oklch(0.2 0.005 280)"
          strokeDasharray="2 4"
          vertical={false}
        />
        <XAxis
          dataKey="hour"
          tickFormatter={fmtHourTick}
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
          separator=" "
          formatter={(v: number) => [`${v} ${v === 1 ? "call" : "calls"}`, ""]}
          labelFormatter={(h: number) => fmtHourLabel(h)}
        />

        {/* Goal reference (neutral) */}
        <ReferenceLine
          y={goal}
          stroke="oklch(0.55 0.01 280)"
          strokeDasharray="4 4"
          label={{
            value: `goal ${goal}`,
            fill: "oklch(0.55 0.01 280)",
            fontSize: 10,
            position: "right",
          }}
        />

        {/* Now vertical marker */}
        {nowHour !== undefined ? (
          <ReferenceLine
            x={nowHour}
            stroke="oklch(0.55 0.01 280)"
            strokeDasharray="3 3"
            label={{
              value: "now",
              fill: "oklch(0.55 0.01 280)",
              fontSize: 10,
              position: "top",
            }}
          />
        ) : null}

        {/* Single Area with stroke + fill + dots — keeps tooltip to one entry. */}
        <Area
          type="monotone"
          dataKey="actual"
          name={metricLabel}
          stroke={color}
          strokeWidth={2.5}
          fill="url(#actualFill)"
          dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 4, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
