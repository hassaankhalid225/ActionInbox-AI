import Link from "next/link";
import type { Metadata } from "next";
import { Inbox as InboxIcon, Paperclip, Sparkles } from "lucide-react";
import { requireAuth } from "@/lib/auth/context";
import { getInboxItems, getInboxCounts, type InboxFilter } from "@/lib/services/inbox";
import { PageHeader } from "@/components/shared/page-header";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ConfidenceBadge, IntentBadge, PriorityBadge, StatusBadge } from "@/components/ui/status";
import { KindIcon, ChannelIcon, channelLabel } from "@/components/inbox/kind-icon";
import { SimulateDialog } from "@/components/inbox/simulate-dialog";
import { formatRelative, truncate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Inbox" };
export const dynamic = "force-dynamic";

const FILTERS: { key: InboxFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "unprocessed", label: "Unprocessed" },
  { key: "needs_review", label: "Needs review" },
  { key: "mine", label: "Assigned to me" },
  { key: "urgent", label: "Urgent" },
  { key: "low_confidence", label: "Low confidence" },
];

export default async function InboxPage({ searchParams }: { searchParams: { filter?: string; q?: string; page?: string } }) {
  const ctx = await requireAuth();
  const filter = (searchParams.filter as InboxFilter) || "all";
  const search = searchParams.q;
  const page = parseInt(searchParams.page ?? "1", 10) || 1;

  const [{ items, total, pageSize }, counts] = await Promise.all([
    getInboxItems(ctx.org.id, { filter, userId: ctx.user.id, search, page }),
    getInboxCounts(ctx.org.id, ctx.user.id),
  ]);

  const tabs = FILTERS.map((f) => ({
    key: f.key,
    label: f.label,
    count: (counts as Record<string, number>)[f.key],
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inbox"
        description="Every inbound item across WhatsApp, email, and uploads — one queue."
        actions={<SimulateDialog />}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs tabs={tabs} active={filter} basePath="/inbox" extraParams={{ q: search }} />
        <SearchInput placeholder="Search messages, contacts…" className="lg:w-72" />
      </div>

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={<InboxIcon />}
            title={search ? "No matching items" : "You're all caught up"}
            description={search ? "Try a different search or filter." : "Connect more channels, upload a file, or simulate an inbound message to see the pipeline."}
            action={<SimulateDialog />}
            className="border-0"
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/inbox/${item.id}`}
                  className={cn("flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:gap-4", !item.isRead && "bg-primary-muted/20")}
                >
                  <div className="relative">
                    <Avatar name={item.contact?.name ?? item.fromIdentifier ?? "Unknown"} size="md" color={item.contact ? undefined : "#94a3b8"} />
                    <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-card bg-surface text-muted-foreground [&_svg]:size-3">
                      <ChannelIcon channel={item.channelType} />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {!item.isRead && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                        <p className={cn("truncate text-sm", item.isRead ? "font-medium" : "font-semibold")}>
                          {item.contact?.name ?? item.fromIdentifier ?? "Unknown sender"}
                        </p>
                        <span className="hidden text-2xs text-muted-foreground sm:inline">· {channelLabel(item.channelType)}</span>
                      </div>
                      <span className="shrink-0 text-2xs text-muted-foreground">{formatRelative(item.receivedAt)}</span>
                    </div>

                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                      <KindIcon kind={item.kind} className="shrink-0 text-muted-foreground/70" />
                      {truncate(item.analysis?.summary || item.bodyText || (item.attachments[0]?.filename ?? "Attachment"), 90)}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <IntentBadge intent={item.intent} size="sm" />
                      {item.status === "processing" && <StatusBadge status="processing" size="sm" />}
                      {item.status === "needs_review" && <StatusBadge status="needs_review" size="sm" />}
                      {item.priority === "urgent" && <PriorityBadge priority="urgent" size="sm" />}
                      {item.confidence != null && item.status === "processed" && <ConfidenceBadge value={item.confidence} size="sm" />}
                      {item._count.suggestions > 0 && (
                        <span className="inline-flex items-center gap-1 text-2xs text-muted-foreground">
                          <Sparkles className="size-3" /> {item._count.suggestions} action{item._count.suggestions > 1 ? "s" : ""}
                        </span>
                      )}
                      {item.attachments.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-2xs text-muted-foreground">
                          <Paperclip className="size-3" /> {item.attachments.length}
                        </span>
                      )}
                      {item.assignedTo && (
                        <span className="ml-auto hidden items-center gap-1 text-2xs text-muted-foreground sm:flex">
                          <Avatar name={item.assignedTo.name} color={item.assignedTo.avatarColor} size="xs" /> {item.assignedTo.name.split(" ")[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Pagination page={page} total={total} pageSize={pageSize} basePath="/inbox" params={{ filter, q: search }} />
    </div>
  );
}
