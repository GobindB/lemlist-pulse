import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KpiCardProps {
  label: string;
  value: string | number;
  /** Suffix appended directly to the value (e.g. "%", "s", "/day"). */
  unit?: string;
  /** Explanation shown on hover via an Info icon next to the label. */
  hint?: string;
  /** Status hue for the value. */
  tone?: "default" | "success" | "warning" | "destructive" | "muted";
  /** Optional small text in the corner — e.g. window label "today". */
  meta?: string;
  className?: string;
}

const TONE_STYLES: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "text-foreground",
  success: "text-[color:var(--success)]",
  warning: "text-[color:var(--warning)]",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

/**
 * Single-statistic card. Intentionally dense: uppercase tracked label, large
 * tabular-nums value, terse hint. Matches factory-simulator's data-card density.
 */
export function KpiCard({
  label,
  value,
  unit,
  hint,
  tone = "default",
  meta,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
          {label}
        </h3>
        <div className="flex items-center gap-2">
          {meta ? (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-mono">
              {meta}
            </span>
          ) : null}
          {hint ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`How is ${label} calculated?`}
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
                {hint}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-3xl font-semibold tabular-nums leading-none",
            TONE_STYLES[tone],
          )}
        >
          {value}
        </span>
        {unit ? (
          <span className="text-base text-muted-foreground font-mono">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}
