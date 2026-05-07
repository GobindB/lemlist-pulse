"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampaigns } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";

export default function CampaignsPage() {
  const { data, error } = useCampaigns();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          All campaigns
        </p>
        <h1 className="text-2xl font-medium tracking-tight mt-1">Campaigns</h1>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-5 py-3 text-xs text-destructive">
          <span className="font-mono uppercase tracking-wider">api error · </span>
          {error.message}
        </div>
      ) : null}

      {!data ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <ul className="divide-y divide-border">
            {data.campaigns.map((c) => (
              <li key={c._id}>
                <Link
                  href={`/campaigns/${c._id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-secondary/40 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mt-0.5">
                      {c.status ?? "—"}
                      {c.archived ? " · archived" : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      c.status === "running"
                        ? "bg-[color:var(--success)] animate-pulse"
                        : "bg-muted-foreground/30",
                    )}
                  />
                  <ArrowUpRight className="size-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
