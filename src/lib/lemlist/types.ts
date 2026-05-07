import { z } from "zod";

/**
 * Lemlist activity types we care about. The `aircall*` prefix is legacy naming —
 * native-dialer calls fire under the same types. Don't be misled by the name.
 */
export const ActivityType = z.enum([
  "aircallCreated",
  "aircallEnded",
  "aircallDone",
  "aircallInterested",
  "aircallNotInterested",
  "emailsSent",
  "emailsOpened",
  "emailsClicked",
  "emailsReplied",
  "emailsBounced",
  "emailsUnsubscribed",
  "emailsInterested",
  "emailsNotInterested",
  "linkedinVisitInvitationDone",
  "linkedinSendInvitationDone",
  "linkedinSendMessageDone",
  "manualInterestedDone",
  "meetingsBooked",
]);
export type ActivityType = z.infer<typeof ActivityType>;

const isoDate = z.string().datetime({ offset: true });

/** Single activity row from GET /activities. Permissive — unknown fields pass through. */
export const Activity = z
  .object({
    _id: z.string(),
    type: z.string(), // not strictly enum: lemlist may emit types we haven't enumerated
    createdAt: isoDate,
    campaignId: z.string().optional(),
    leadId: z.string().optional(),
    userId: z.string().optional(),
    userName: z.string().optional(),
    leadEmail: z.string().optional(),
    leadFirstName: z.string().optional(),
    leadLastName: z.string().optional(),
    teamId: z.string().optional(),
    // Call-specific fields (present on aircall* types)
    duration: z.number().nonnegative().optional(),
    startedAt: isoDate.optional(),
    endedAt: isoDate.optional(),
    /** May be a URL string OR an object — lemlist isn't consistent. We don't display it, so accept anything. */
    recording: z.unknown().optional(),
    recordingSid: z.string().optional(),
    callSid: z.string().optional(),
    callS3Ready: z.boolean().optional(),
    direction: z.enum(["inbound", "outbound"]).optional(),
    phoneProvider: z.string().optional(),
    aircallPhone: z.string().optional(),
    aircallPhoneName: z.string().optional(),
    leadCompanyName: z.string().optional(),
    leadJobTitle: z.string().optional(),
    leadPhone: z.string().optional(),
    sequenceStep: z.number().optional(),
    totalSequenceStep: z.number().optional(),
    metaData: z.record(z.unknown()).optional(),
  })
  .passthrough();
export type Activity = z.infer<typeof Activity>;

export const ActivitiesResponse = z.array(Activity);
export type ActivitiesResponse = z.infer<typeof ActivitiesResponse>;

/** Campaign list row — the public shape from GET /campaigns. */
export const Campaign = z
  .object({
    _id: z.string(),
    name: z.string(),
    status: z.string().optional(),
    archived: z.boolean().optional(),
    labels: z.array(z.string()).optional(),
    createdAt: isoDate.optional(),
  })
  .passthrough();
export type Campaign = z.infer<typeof Campaign>;

export const CampaignsResponse = z.array(Campaign);
export type CampaignsResponse = z.infer<typeof CampaignsResponse>;

/** Per-campaign stats from GET /campaigns/{id}/stats?startDate&endDate. */
export const CampaignStats = z
  .object({
    sent: z.number().int().nonnegative().default(0),
    delivered: z.number().int().nonnegative().default(0),
    opened: z.number().int().nonnegative().default(0),
    clicked: z.number().int().nonnegative().default(0),
    replied: z.number().int().nonnegative().default(0),
    bounced: z.number().int().nonnegative().default(0),
    unsubscribed: z.number().int().nonnegative().default(0),
    interested: z.number().int().nonnegative().default(0),
    notInterested: z.number().int().nonnegative().default(0),
    meetingsBooked: z.number().int().nonnegative().default(0),
    linkedinInvitesSent: z.number().int().nonnegative().default(0),
    linkedinInvitesAccepted: z.number().int().nonnegative().default(0),
  })
  .passthrough();
export type CampaignStats = z.infer<typeof CampaignStats>;

/**
 * Team sender = a lemlist user attached to the team. The API key in env belongs
 * to one of these. The response uses `userId` (not `_id`) and includes the
 * sender's attached campaigns. For single-user accounts the array has length 1.
 */
export const TeamSender = z
  .object({
    userId: z.string(),
    campaigns: z
      .array(
        z
          .object({
            _id: z.string(),
            name: z.string().optional(),
            status: z.string().optional(),
            sendingChannels: z.array(z.string()).optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();
export type TeamSender = z.infer<typeof TeamSender>;

export const TeamSendersResponse = z.array(TeamSender);
export type TeamSendersResponse = z.infer<typeof TeamSendersResponse>;
