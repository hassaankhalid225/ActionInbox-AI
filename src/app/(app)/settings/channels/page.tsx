import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/context";
import { getChannels, getWebhookEvents } from "@/lib/services/settings";
import { ChannelsManager } from "@/components/settings/channels-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status";
import { timeAgo } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Channels" };
export const dynamic = "force-dynamic";

export default async function ChannelsSettingsPage() {
  const ctx = await requirePermission("channel.manage");
  const [channels, events] = await Promise.all([getChannels(ctx.org.id), getWebhookEvents(ctx.org.id)]);

  return (
    <div className="space-y-5">
      <ChannelsManager
        channels={channels.map((c) => ({ id: c.id, type: c.type, label: c.label, status: c.status, identifier: c.identifier, lastEventAt: c.lastEventAt?.toISOString() ?? null }))}
      />

      <Card>
        <CardHeader><CardTitle className="text-base">Webhook activity</CardTitle></CardHeader>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">No webhook events recorded yet. Inbound provider events appear here for debugging (TRD §12).</p>
          ) : (
            <ul className="divide-y divide-border">
              {events.map((e) => (
                <li key={e.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div><p className="font-medium">{e.provider}</p><p className="text-2xs text-muted-foreground">{e.providerEventId}</p></div>
                  <div className="flex items-center gap-3"><StatusBadge status={e.status === "processed" ? "processed" : e.status === "failed" ? "failed" : "received"} size="sm" /><span className="text-2xs text-muted-foreground">{timeAgo(e.createdAt)}</span></div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
