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
  /** Whether this is today (renders a slightly brighter bar). */
  isToday?: boolean;
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

export function WeeklyBars({
  data,
  target,
  height = 220,
  metricLabel = "Calls",
}: WeeklyBarsProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
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
        />
        <Tooltip
          contentStyle={{
            background: "oklch(0.13 0.005 280)",
            border: "1px solid oklch(0.18 0.005 280)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "oklch(0.97 0.005 280)" }}
          cursor={{ fill: "oklch(0.18 0.005 280 / 0.4)" }}
          formatter={(v: number) => [v, metricLabel]}
          labelFormatter={(_, payload) => {
            const p = payload?.[0]?.payload as BarDatum | undefined;
            return p?.date ? `${p.day} · ${p.date}` : (p?.day ?? "");
          }}
        />
        <ReferenceLine
          y={target}
          stroke="oklch(0.55 0.01 280)"
          strokeDasharray="3 3"
          label={{
            value: `target ${target}`,
            fill: "oklch(0.55 0.01 280)",
            fontSize: 10,
            position: "right",
          }}
        />
        <Bar dataKey="actual" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={
                d.isToday
                  ? "oklch(0.97 0.005 280)"
                  : d.actual >= target
                    ? "oklch(0.72 0.18 145 / 0.85)"
                    : "oklch(0.55 0.01 280)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
