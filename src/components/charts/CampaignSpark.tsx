"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CampaignSparkDatum {
  id: string;
  name: string;
  status?: string;
  /** Primary headline metric value (e.g., reply count). */
  primary: number;
  /** Suffix for the primary value. */
  primaryUnit?: string;
  /** Secondary contextual rate, displayed as "12% reply" etc. */
  secondaryLabel: string;
  secondaryValue: string;
}

interface CampaignSparkProps {
  title?: string;
  campaigns: CampaignSparkDatum[];
  /** Empty-state message if `campaigns` is empty. */
  emptyMessage?: string;
}

export function CampaignSpark({
  title = "Top campaigns",
  campaigns,
  emptyMessage = "No campaign activity in window.",
}: CampaignSparkProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
          {title}
        </h3>
        <Link
          href="/campaigns"
          className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground hover:text-foreground active:scale-[0.97] [transition:color_150ms_ease,transform_150ms_var(--ease-out)] flex items-center gap-1"
        >
          View all
          <ArrowUpRight className="size-3" />
        </Link>
      </div>
      {campaigns.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <ul>
          {campaigns.map((c, i) => (
            <li key={c.id}>
              <Link
                href={`/campaigns/${c.id}`}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/40 active:scale-[0.99] [transition:background-color_150ms_ease,transform_150ms_var(--ease-out)] group",
                  i !== campaigns.length - 1 && "border-b border-border",
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-foreground">
                    {c.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mt-0.5">
                    {c.status ?? "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold tabular-nums leading-none">
                    {c.primary}
                    {c.primaryUnit ? (
                      <span className="text-xs text-muted-foreground font-mono ml-0.5">
                        {c.primaryUnit}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mt-1">
                    {c.secondaryValue} {c.secondaryLabel}
                  </p>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
