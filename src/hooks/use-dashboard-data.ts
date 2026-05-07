"use client";

import useSWR, { type SWRConfiguration } from "swr";
import type { Activity, Campaign, CampaignStats } from "@/lib/lemlist/types";

interface MeResponse {
  userId: string;
  campaignCount: number;
}

interface ActivityResponse {
  range: "today" | "week" | "month";
  startDate: string;
  endDate: string;
  activities: Activity[];
}

interface CampaignsResponse {
  campaigns: Campaign[];
}

interface StatsResponse {
  id: string;
  start: string;
  end: string;
  stats: CampaignStats;
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Request failed: ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
};

const SHARED: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 30 * 1000,
};

export function useMe() {
  return useSWR<MeResponse>("/api/lemlist/me", fetcher, {
    ...SHARED,
    refreshInterval: 0, // userId doesn't change
  });
}

export function useActivity(
  range: "today" | "week" | "month",
  userId?: string,
  campaignId?: string,
) {
  const search = new URLSearchParams({ range });
  if (userId) search.set("userId", userId);
  if (campaignId) search.set("campaignId", campaignId);
  return useSWR<ActivityResponse>(
    `/api/lemlist/activity?${search.toString()}`,
    fetcher,
    {
      ...SHARED,
      refreshInterval: 60 * 1000,
    },
  );
}

export function useCampaigns() {
  return useSWR<CampaignsResponse>("/api/lemlist/campaigns", fetcher, {
    ...SHARED,
    refreshInterval: 10 * 60 * 1000,
  });
}

export function useCampaignStats(id: string, start: string, end: string) {
  const key =
    id && start && end
      ? `/api/lemlist/stats?id=${encodeURIComponent(id)}&start=${start}&end=${end}`
      : null;
  return useSWR<StatsResponse>(key, fetcher, {
    ...SHARED,
    refreshInterval: 5 * 60 * 1000,
  });
}
