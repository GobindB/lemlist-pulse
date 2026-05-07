"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

interface CurvePoint {
  hour: number; // 8..17
  actual: number;
}

interface ActualVsTargetCurveProps {
  data: CurvePoint[];
  /** Daily goal — drawn as a horizontal dashed reference line. */
  goal: number;
  /** Projected end-of-day total at current rate — drawn as a fainter reference line. */
  projected: number;
  /** Line label for the actual series (used in tooltip). */
  metricLabel?: string;
  /** Where the day's "now" is (hour). Drawn as a vertical reference line. */
  nowHour?: number;
  height?: number;
}

const fmtHour = (h: number) => {
  const ampm = h >= 12 ? "p" : "a";
  const display = h > 12 ? h - 12 : h;
  return `${display}${ampm}`;
};

export function ActualVsTargetCurve({
  data,
  goal,
  projected,
  metricLabel = "Calls",
  nowHour,
  height = 220,
}: ActualVsTargetCurveProps) {
  // Y-axis upper bound: at least the goal, with some headroom if actuals exceed it.
  const maxActual = data.reduce((m, p) => Math.max(m, p.actual), 0);
  const yMax = Math.max(goal, maxActual) * 1.1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 56, bottom: 8, left: -16 }}
      >
        <CartesianGrid
          stroke="oklch(0.2 0.005 280)"
          strokeDasharray="2 4"
          vertical={false}
        />
        <XAxis
          dataKey="hour"
          tickFormatter={fmtHour}
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
        />
        <Tooltip
          contentStyle={{
            background: "oklch(0.13 0.005 280)",
            border: "1px solid oklch(0.18 0.005 280)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "oklch(0.97 0.005 280)" }}
          formatter={(v: number) => [v, metricLabel]}
          labelFormatter={(h: number) => fmtHour(h)}
        />

        {/* Goal line */}
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

        {/* Projection line — only render when distinct from x-axis to reduce clutter */}
        {projected > 0 && projected < yMax ? (
          <ReferenceLine
            y={projected}
            stroke="oklch(0.78 0.16 85)"
            strokeDasharray="2 4"
            label={{
              value: `pace ${projected}`,
              fill: "oklch(0.78 0.16 85)",
              fontSize: 10,
              position: "right",
            }}
          />
        ) : null}

        {/* "Now" vertical marker */}
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

        <Line
          type="monotone"
          dataKey="actual"
          name={metricLabel}
          stroke="oklch(0.97 0.005 280)"
          strokeWidth={2}
          dot={{ r: 2.5, fill: "oklch(0.97 0.005 280)" }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
