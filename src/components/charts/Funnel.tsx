"use client";

import { cn } from "@/lib/utils";

export interface FunnelStage {
  label: string;
  value: number;
}

interface FunnelProps {
  /** Stages in order, top of funnel first. The largest value defines width=100%. */
  stages: FunnelStage[];
  className?: string;
}

/**
 * Horizontal stacked-bar funnel. Each row shows the stage label, count, and a
 * proportional bar. Conversion rates between stages are rendered to the right
 * of the lower bar so you can see "60% open → click drop" etc.
 */
export function Funnel({ stages, className }: FunnelProps) {
  const top = Math.max(stages[0]?.value ?? 0, 1);

  return (
    <div className={cn("space-y-3", className)}>
      {stages.map((stage, i) => {
        const width = (stage.value / top) * 100;
        const prev = i > 0 ? stages[i - 1].value : null;
        const conversion =
          prev && prev > 0 ? (stage.value / prev) * 100 : null;

        return (
          <div key={stage.label} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="uppercase tracking-wider text-muted-foreground font-medium">
                {stage.label}
              </span>
              <span className="font-mono tabular-nums">
                {stage.value.toLocaleString()}
                {conversion !== null ? (
                  <span className="text-muted-foreground/60 ml-2">
                    {Math.round(conversion)}%
                  </span>
                ) : null}
              </span>
            </div>
            <div className="h-7 rounded-md bg-secondary overflow-hidden">
              <div
                className="h-full bg-foreground/85 transition-[width] duration-500"
                style={{ width: `${Math.max(width, stage.value > 0 ? 2 : 0)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
