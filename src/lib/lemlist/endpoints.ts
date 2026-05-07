import { fetchJson } from "./client";
import {
  ActivitiesResponse,
  CampaignsResponse,
  CampaignStats,
  TeamSendersResponse,
  type Activity,
  type Campaign,
  type CampaignStats as CampaignStatsT,
  type TeamSender,
} from "./types";

/** Lemlist's activity feed. Offset paginated, max 100 per page. */
export interface GetActivitiesParams {
  type?: string;
  campaignId?: string;
  leadId?: string;
  startDate?: string; // ISO 8601
  endDate?: string; // ISO 8601
  offset?: number;
  limit?: number; // max 100
}

export async function getActivities(params: GetActivitiesParams = {}): Promise<Activity[]> {
  return fetchJson<Activity[]>({
    path: "/activities",
    query: {
      ...params,
      version: "v2",
      limit: Math.min(params.limit ?? 100, 100),
    },
    schema: ActivitiesResponse,
  });
}

/**
 * Page through /activities collecting all results. Uses the rate-limited
 * fetchJson under the hood. Stops when a page returns < limit rows.
 */
export async function getAllActivities(
  params: Omit<GetActivitiesParams, "offset" | "limit"> = {},
  pageSize = 100,
): Promise<Activity[]> {
  const all: Activity[] = [];
  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const page = await getActivities({ ...params, offset, limit: pageSize });
    all.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
    // Safety valve — lemlist accounts can have huge histories. Cap at 5000 / call.
    if (all.length >= 5000) break;
  }
  return all;
}

export async function getCampaigns(): Promise<Campaign[]> {
  return fetchJson<Campaign[]>({
    path: "/campaigns",
    schema: CampaignsResponse,
  });
}

export async function getCampaignStats(
  id: string,
  startDate: string,
  endDate: string,
): Promise<CampaignStatsT> {
  return fetchJson<CampaignStatsT>({
    path: `/campaigns/${id}/stats`,
    query: { startDate, endDate },
    schema: CampaignStats,
  });
}

export async function getTeamSenders(): Promise<TeamSender[]> {
  return fetchJson<TeamSender[]>({
    path: "/team/senders",
    schema: TeamSendersResponse,
  });
}
