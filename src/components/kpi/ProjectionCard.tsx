import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectionCardProps {
  /** Meetings already booked in the current period. */
  booked: number;
  /** Forward-projected meetings from remaining activity × benchmarks. */
  projectedDelta: number;
  /** End-of-period stretch target for color cue. */
  goal?: number;
  /** Description of how the projection was computed. Tooltip-style hint. */
  basis: string;
  className?: string;
}

/**
 * "Where will I land" card. Shows booked + projected delta as a stacked bar
 * with the totals below. Deliberately marks the projection as a separate
 * (lighter) segment so you can see what's earned vs. what's forecast.
 */
export function ProjectionCard({
  booked,
  projectedDelta,
  goal,
  basis,
  className,
}: ProjectionCardProps) {
  const total = booked + projectedDelta;
  const denom = Math.max(goal ?? total, 1);
  const bookedPct = (booked / denom) * 100;
  const projectedPct = (projectedDelta / denom) * 100;
  const onTrack = goal === undefined ? true : total >= goal;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-card p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
          Month-end projection
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="How is this calculated?"
              className="text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            align="start"
            className="max-w-xs leading-relaxed"
          >
            {basis}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-semibold tabular-nums leading-none">
          {total}
        </span>
        <span className="text-base text-muted-foreground font-mono">
          meetings
        </span>
        {goal !== undefined ? (
          <span
            className={cn(
              "text-xs font-mono ml-auto",
              onTrack
                ? "text-[color:var(--success)]"
                : "text-[color:var(--warning)]",
            )}
          >
            {onTrack ? "on goal" : `goal ${goal}`}
          </span>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="bg-foreground transition-[width] duration-500"
            style={{ width: `${bookedPct}%` }}
            title={`Booked: ${booked}`}
          />
          <div
            className="bg-foreground/30 transition-[width] duration-500"
            style={{ width: `${projectedPct}%` }}
            title={`Projected: ${projectedDelta}`}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-foreground" />
            booked {booked}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-foreground/30" />
            projected {projectedDelta > 0 ? "+" : ""}
            {projectedDelta}
          </span>
        </div>
      </div>

    </div>
  );
}
