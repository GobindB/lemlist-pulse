"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/kpi/KpiCard";
import { Funnel } from "@/components/charts/Funnel";
import { ActivityFeed } from "@/components/ActivityFeed";
import { useCampaigns, useActivity, useMe } from "@/hooks/use-dashboard-data";
import { connectRate, replyRate } from "@/lib/metrics/derived";
import { startOfMonth, endOfMonth, formatISO } from "date-fns";
import type { CampaignStats } from "@/lib/lemlist/types";

interface StatsResponse {
  id: string;
  start: string;
  end: string;
  stats: CampaignStats;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json();
};

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: me } = useMe();
  const { data: campaignsData } = useCampaigns();
  const { data: activityData } = useActivity("month", me?.userId, id);

  const monthStart = formatISO(startOfMonth(new Date()), { representation: "date" });
  const monthEnd = formatISO(endOfMonth(new Date()), { representation: "date" });
  const statsKey = `/api/lemlist/stats?id=${encodeURIComponent(id)}&start=${monthStart}&end=${monthEnd}`;
  const { data: statsData } = useSWR<StatsResponse>(statsKey, fetcher);

  const campaign = campaignsData?.campaigns.find((c) => c._id === id);
  const activities = activityData?.activities ?? [];
  const stats = statsData?.stats;

  const funnel = stats
    ? [
        { label: "Sent", value: stats.sent },
        { label: "Opened", value: stats.opened },
        { label: "Clicked", value: stats.clicked },
        { label: "Replied", value: stats.replied },
        { label: "Meetings booked", value: stats.meetingsBooked },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3" />
            All campaigns
          </Link>
          <h1 className="text-2xl font-medium tracking-tight mt-2">
            {campaign?.name ?? <Skeleton className="h-7 w-72" />}
          </h1>
          {campaign?.status ? (
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono mt-1">
              {campaign.status}
              {campaign.archived ? " · archived" : ""}
            </p>
          ) : null}
        </div>
      </div>

      {/* KPI strip */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!stats ? (
          <>
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </>
        ) : (
          <>
            <KpiCard
              label="Emails sent"
              value={stats.sent}
              meta="this month"
            />
            <KpiCard
              label="Reply rate"
              value={Math.round(replyRate(stats) * 100)}
              unit="%"
              meta="this month"
              hint={`${stats.replied} of ${stats.sent} sent`}
              tone={stats.replied > 0 ? "success" : "muted"}
            />
            <KpiCard
              label="Meetings booked"
              value={stats.meetingsBooked}
              meta="this month"
              tone={stats.meetingsBooked > 0 ? "success" : "muted"}
            />
            <KpiCard
              label="Connect rate"
              value={Math.round(connectRate(activities) * 100)}
              unit="%"
              meta="month, calls"
              hint="Calls with duration ≥ 30s"
              tone={connectRate(activities) > 0 ? "success" : "muted"}
            />
          </>
        )}
      </section>

      {/* Funnel + activity */}
      <section className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
              Funnel
            </h3>
            <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground/70">
              this month
            </span>
          </div>
          {!stats ? (
            <div className="space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : (
            <Funnel stages={funnel} />
          )}
        </div>

        <div className="lg:col-span-3">
          {!activityData ? (
            <Skeleton className="h-96 w-full rounded-xl" />
          ) : (
            <ActivityFeed activities={activities} limit={20} />
          )}
        </div>
      </section>
    </div>
  );
}
