import { cn } from "@/lib/utils";
import type { PaceStatus } from "@/lib/metrics/pacing";

interface PaceCardProps {
  /** "TODAY" / "THIS WEEK" — appears as the small uppercase header. */
  label: string;
  /** Calls (or whatever activity) made so far. */
  actual: number;
  /** Expected by-now per the linear ramp through working hours. */
  expected: number;
  /** End-of-period target (full day or full week). */
  target: number;
  /** Pre-computed status from `paceStatus(actual, expected)`. */
  status: PaceStatus;
  /** Tiny hint describing the metric, e.g. "calls". */
  unit?: string;
  className?: string;
}

const STATUS_BAR: Record<PaceStatus, string> = {
  ahead: "bg-[color:var(--success)]",
  "on-track": "bg-[color:var(--info)]",
  behind: "bg-destructive",
};

const ACTUAL_COLOR: Record<PaceStatus, string> = {
  ahead: "text-[color:var(--success)]",
  "on-track": "text-foreground",
  behind: "text-destructive",
};

/**
 * The "am I on pace" card. Shows actual / expected / target as a horizontal
 * bar with two markers — current actual progress against the target line, and
 * a notch where the linear pace expectation sits right now. Status badge
 * top-right tells you the answer at a glance.
 */
export function PaceCard({
  label,
  actual,
  expected,
  target,
  status,
  unit = "calls",
  className,
}: PaceCardProps) {
  const safeTarget = Math.max(target, 1);
  const actualPct = Math.min(100, (actual / safeTarget) * 100);
  const expectedPct = Math.min(100, (expected / safeTarget) * 100);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-card p-5",
        className,
      )}
    >
      <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
        {label}
      </h3>

      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "text-4xl font-semibold tabular-nums leading-none",
            ACTUAL_COLOR[status],
          )}
        >
          {actual}
        </span>
        <span className="text-base text-muted-foreground font-mono tabular-nums">
          / {target}
        </span>
        <span className="text-xs text-muted-foreground font-mono ml-auto">
          {unit}
        </span>
      </div>

      <div className="space-y-2">
        <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className={cn("absolute inset-y-0 left-0", STATUS_BAR[status])}
            style={{
              width: `${actualPct}%`,
              transition:
                "width 300ms var(--ease-out), background-color 300ms var(--ease-out)",
            }}
          />
          {/* Forecast marker — projected end-of-period total at current rate */}
          <div
            className="absolute inset-y-0 w-px bg-foreground/60"
            style={{
              left: `${expectedPct}%`,
              transition: "left 300ms var(--ease-out)",
            }}
            title={`Projected end-of-period total: ${expected}`}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
          <span>actual {actual}</span>
          <span>pace {expected}</span>
          <span>goal {target}</span>
        </div>
      </div>
    </div>
  );
}
