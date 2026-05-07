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
  expected: number;
}

interface ActualVsTargetCurveProps {
  data: CurvePoint[];
  /** Line label for the actual series, e.g. "Calls". */
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
  metricLabel = "Calls",
  nowHour,
  height = 220,
}: ActualVsTargetCurveProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 16, bottom: 8, left: -16 }}
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
        />
        <Tooltip
          contentStyle={{
            background: "oklch(0.13 0.005 280)",
            border: "1px solid oklch(0.18 0.005 280)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "oklch(0.97 0.005 280)" }}
          formatter={(v: number, name: string) => [v, name]}
          labelFormatter={(h: number) => fmtHour(h)}
        />
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
          dataKey="expected"
          name="Pace"
          stroke="oklch(0.55 0.01 280)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
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
