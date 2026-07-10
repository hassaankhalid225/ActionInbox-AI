"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Mail, Upload, Plus, Radio, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/ui/status";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { timeAgo, titleCase } from "@/lib/utils/format";

type Channel = { id: string; type: string; label: string; status: string; identifier: string | null; lastEventAt: string | null };

const TYPE_META: Record<string, { icon: LucideIcon; label: string; desc: string }> = {
  whatsapp: { icon: MessageSquare, label: "WhatsApp Business", desc: "Official Cloud API — text, media & voice notes." },
  email: { icon: Mail, label: "Email forwarding", desc: "Forward messages to a workspace address." },
  upload: { icon: Upload, label: "Manual uploads", desc: "Drag & drop PDFs, images, and audio." },
};

export function ChannelsManager({ channels }: { channels: Channel[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function connect(type: string) {
    setBusy(type);
    try {
      await api.post("/api/channels", { type, label: TYPE_META[type]!.label });
      toast.success(`${TYPE_META[type]!.label} connected`, { description: "Provider credentials are stubbed in this build." });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not connect.");
    } finally {
      setBusy(null);
    }
  }

  async function toggle(id: string, next: boolean) {
    try {
      await api.patch(`/api/channels/${id}`, { status: next ? "connected" : "disabled" });
      router.refresh();
    } catch {
      toast.error("Could not update channel");
    }
  }

  const activeTypes = new Set(channels.filter((c) => c.status !== "disabled").map((c) => c.type));

  return (
    <div className="space-y-5">
      {/* Connect new */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Object.entries(TYPE_META).map(([type, meta]) => {
          const Icon = meta.icon;
          const connected = activeTypes.has(type);
          return (
            <Card key={type}>
              <CardContent className="p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary-muted text-primary"><Icon className="size-5" /></div>
                <p className="mt-3 text-sm font-medium">{meta.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{meta.desc}</p>
                <Button variant={connected ? "outline" : "primary"} size="sm" className="mt-3 w-full" disabled={connected || busy === type} loading={busy === type} onClick={() => connect(type)}>
                  {connected ? "Connected" : <><Plus className="size-4" /> Connect</>}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connected list */}
      <Card>
        <CardContent className="p-0">
          {channels.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">No channels connected yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {channels.map((c) => {
                const Icon = TYPE_META[c.type]?.icon ?? Radio;
                return (
                  <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-4" /></div>
                      <div>
                        <div className="flex items-center gap-2"><p className="text-sm font-medium">{c.label}</p><Badge variant="outline" size="sm">{titleCase(c.type)}</Badge></div>
                        <p className="text-xs text-muted-foreground">{c.identifier ?? "—"}{c.lastEventAt && ` · last event ${timeAgo(c.lastEventAt)}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={c.status} size="sm" />
                      <Switch checked={c.status === "connected"} onCheckedChange={(v) => toggle(c.id, v)} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
