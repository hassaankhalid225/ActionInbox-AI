import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles, ExternalLink } from "lucide-react";
import { requireAuth, can } from "@/lib/auth/context";
import { getActionQueue, getActionCounts, type ActionQueueFilter } from "@/lib/services/action-queue";
import { PageHeader } from "@/components/shared/page-header";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ActionReviewCard } from "@/components/actions/action-review-card";

export const metadata: Metadata = { title: "Actions" };
export const dynamic = "force-dynamic";

const FILTERS: { key: ActionQueueFilter; label: string }[] = [
  { key: "open", label: "To review" },
  { key: "needs_review", label: "Needs review" },
  { key: "deferred", label: "Deferred" },
  { key: "executed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export default async function ActionsPage({ searchParams }: { searchParams: { filter?: string } }) {
  const ctx = await requireAuth();
  const filter = (searchParams.filter as ActionQueueFilter) || "open";
  const [actions, counts] = await Promise.all([getActionQueue(ctx.org.id, filter), getActionCounts(ctx.org.id)]);
  const canReview = can(ctx.role, "action.review");

  const tabs = FILTERS.map((f) => ({ key: f.key, label: f.label, count: (counts as Record<string, number>)[f.key] }));

  return (
    <div className="space-y-5">
      <PageHeader title="Actions" description="Review AI-suggested actions grounded in source evidence. Approve, edit, reject, or defer." />

      <FilterTabs tabs={tabs} active={filter} basePath="/actions" />

      {actions.length === 0 ? (
        <EmptyState
          icon={<Sparkles />}
          title={filter === "open" ? "No actions to review" : "Nothing here"}
          description={filter === "open" ? "You're all caught up. New inbound items will generate action cards automatically." : "Try a different filter."}
          action={<Button asChild><Link href="/inbox">Go to inbox</Link></Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {actions.map((a) => (
            <div key={a.id} className="space-y-2">
              {a.contactName && (
                <Link href={a.inboundItemId ? `/inbox/${a.inboundItemId}` : "#"} className="flex items-center gap-1 px-1 text-xs font-medium text-muted-foreground hover:text-primary">
                  {a.contactName} <ExternalLink className="size-3" />
                </Link>
              )}
              <ActionReviewCard action={a} canReview={canReview} currency={ctx.org.currency} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
