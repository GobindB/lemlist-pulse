"use client";

import { Phone, Mail, Linkedin, CheckCircle2, X, Calendar, Activity as ActivityIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Activity } from "@/lib/lemlist/types";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  activities: Activity[];
  /** Limit the number rendered. Default 25. */
  limit?: number;
}

/** Map activity types to a small icon + a human label + a color tone. */
function describe(type: string): {
  icon: React.ReactNode;
  label: string;
  tone: "default" | "muted" | "success" | "warning" | "destructive";
} {
  if (type === "aircallEnded") return { icon: <Phone className="size-3.5" />, label: "Call ended", tone: "default" };
  if (type === "aircallCreated") return { icon: <Phone className="size-3.5" />, label: "Call started", tone: "muted" };
  if (type === "aircallInterested") return { icon: <CheckCircle2 className="size-3.5" />, label: "Interested (call)", tone: "success" };
  if (type === "aircallNotInterested") return { icon: <X className="size-3.5" />, label: "Not interested (call)", tone: "destructive" };
  if (type === "aircallDone") return { icon: <Phone className="size-3.5" />, label: "Call task done", tone: "muted" };
  if (type === "emailsSent") return { icon: <Mail className="size-3.5" />, label: "Email sent", tone: "muted" };
  if (type === "emailsOpened") return { icon: <Mail className="size-3.5" />, label: "Email opened", tone: "default" };
  if (type === "emailsClicked") return { icon: <Mail className="size-3.5" />, label: "Email clicked", tone: "default" };
  if (type === "emailsReplied") return { icon: <Mail className="size-3.5" />, label: "Email replied", tone: "success" };
  if (type === "emailsBounced") return { icon: <Mail className="size-3.5" />, label: "Email bounced", tone: "destructive" };
  if (type === "emailsInterested") return { icon: <CheckCircle2 className="size-3.5" />, label: "Interested (email)", tone: "success" };
  if (type === "emailsIgnored") return { icon: <Mail className="size-3.5" />, label: "Email ignored", tone: "muted" };
  if (type === "linkedinSendInvitationDone") return { icon: <Linkedin className="size-3.5" />, label: "LinkedIn invite", tone: "muted" };
  if (type === "linkedinSendMessageDone") return { icon: <Linkedin className="size-3.5" />, label: "LinkedIn message", tone: "muted" };
  if (type === "linkedinIgnored") return { icon: <Linkedin className="size-3.5" />, label: "LinkedIn ignored", tone: "muted" };
  if (type === "meetingsBooked") return { icon: <Calendar className="size-3.5" />, label: "Meeting booked", tone: "success" };
  if (type === "paused") return { icon: <ActivityIcon className="size-3.5" />, label: "Lead paused", tone: "muted" };
  if (type === "resumed") return { icon: <ActivityIcon className="size-3.5" />, label: "Lead resumed", tone: "muted" };
  return { icon: <ActivityIcon className="size-3.5" />, label: type, tone: "muted" };
}

const TONE_CLS: Record<ReturnType<typeof describe>["tone"], string> = {
  default: "text-foreground bg-secondary",
  muted: "text-muted-foreground bg-secondary",
  success: "text-[color:var(--success)] bg-[color:var(--success)]/10",
  warning: "text-[color:var(--warning)] bg-[color:var(--warning)]/10",
  destructive: "text-destructive bg-destructive/10",
};

export function ActivityFeed({ activities, limit = 25 }: ActivityFeedProps) {
  const sorted = [...activities]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-5 py-12 text-center">
        <p className="text-xs text-muted-foreground">No recent activity in window.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
          Recent activity
        </h3>
      </div>
      <ul className="divide-y divide-border">
        {sorted.map((a) => {
          const d = describe(a.type);
          const lead = leadName(a);
          return (
            <li key={a._id} className="flex items-start gap-3 px-5 py-3">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md",
                  TONE_CLS[d.tone],
                )}
              >
                {d.icon}
              </span>
              <div className="flex-1 min-w-0 flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{d.label}</span>
                    {lead ? (
                      <span className="text-muted-foreground"> · {lead}</span>
                    ) : null}
                  </p>
                  {a.leadCompanyName ? (
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-mono mt-0.5">
                      {a.leadCompanyName}
                      {a.leadJobTitle ? ` · ${a.leadJobTitle}` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                  {a.duration !== undefined && a.duration > 0 ? (
                    <p className="text-[10px] font-mono text-muted-foreground/70 mt-0.5">
                      {a.duration}s
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function leadName(a: Activity): string | null {
  const fn = a.leadFirstName ?? "";
  const ln = a.leadLastName ?? "";
  const full = `${fn} ${ln}`.trim();
  return full || a.leadEmail || null;
}
