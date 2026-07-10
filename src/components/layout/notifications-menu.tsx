"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Check, CircleAlert, TriangleAlert, Info, CheckCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";
import { timeAgo } from "@/lib/utils/format";
import { api } from "@/lib/api/client";
import { useRouter } from "next/navigation";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  severity: string;
  isRead: boolean;
  createdAt: string;
};

const ICONS: Record<string, typeof Info> = {
  info: Info,
  warning: TriangleAlert,
  danger: CircleAlert,
  success: CheckCircle2,
};

export function NotificationsMenu({ initial }: { initial: NotificationItem[] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const unread = items.filter((n) => !n.isRead).length;

  async function markAll() {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await api.post("/api/notifications/read-all");
      router.refresh();
    } catch {
      /* optimistic */
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-danger-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button onClick={markAll} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <Check className="size-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[24rem] overflow-y-auto">
          {items.length === 0 ? (
            <EmptyState compact title="You're all caught up" description="No new notifications." className="border-0" />
          ) : (
            items.map((n) => {
              const Icon = ICONS[n.severity] ?? Info;
              const content = (
                <div className={cn("flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50", !n.isRead && "bg-primary-muted/30")}>
                  <div
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4",
                      n.severity === "danger" && "bg-danger-muted text-danger",
                      n.severity === "warning" && "bg-warning-muted text-warning-foreground",
                      n.severity === "success" && "bg-success-muted text-success",
                      n.severity === "info" && "bg-info-muted text-info",
                    )}
                  >
                    <Icon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-2xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                </div>
              );
              return n.linkUrl ? (
                <Link key={n.id} href={n.linkUrl} onClick={() => setOpen(false)}>
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
