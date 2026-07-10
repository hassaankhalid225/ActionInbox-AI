import Link from "next/link";
import type { Metadata } from "next";
import {
  Inbox,
  ShieldCheck,
  TriangleAlert,
  CircleDollarSign,
  ArrowRight,
  Sparkles,
  Plus,
  FileText,
  Upload,
} from "lucide-react";
import { requireAuth } from "@/lib/auth/context";
import { getDashboard } from "@/lib/services/dashboard";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { StatTile } from "@/components/shared/stat-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfidenceBadge, IntentBadge, PriorityBadge, StatusBadge } from "@/components/ui/status";
import { ActionIcon } from "@/components/shared/action-icon";
import { Avatar } from "@/components/ui/avatar";
import { TrendChart } from "@/components/charts/trend-chart";
import { ACTION_TYPE_LABELS, type ActionType } from "@/lib/constants/enums";
import { formatMoney, formatRelative, dueLabel, timeAgo } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await requireAuth();
  const data = await getDashboard(ctx.org.id);
  const sub = await db.subscription.findUnique({ where: { orgId: ctx.org.id } });
  const currency = ctx.org.currency;

  const firstName = ctx.user.name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description="Here's what needs your attention today."
        actions={
          <>
            <Button asChild variant="outline"><Link href="/inbox"><Inbox className="size-4" /> Open inbox</Link></Button>
            <Button asChild><Link href="/actions"><Sparkles className="size-4" /> Review actions</Link></Button>
          </>
        }
      />

      {sub?.status === "trialing" && sub.trialEndsAt && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-primary/30 bg-primary-muted/40 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-5" /></div>
            <div>
              <p className="text-sm font-medium">You're on the Team trial</p>
              <p className="text-sm text-muted-foreground">
                {Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86400000))} days left · Explore every feature free.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline"><Link href="/settings/billing">Manage plan</Link></Button>
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Unprocessed inbox" value={data.stats.unprocessedInbox} icon={<Inbox />} tone="primary" href="/inbox" hint="Items awaiting AI or triage" />
        <StatTile label="Pending approvals" value={data.stats.pendingActions} icon={<ShieldCheck />} tone="accent" href="/actions" hint="Action cards to review" />
        <StatTile label="Overdue invoices" value={data.stats.overdueCount} icon={<TriangleAlert />} tone="danger" href="/invoices?status=overdue" hint="Follow up to recover cash" />
        <StatTile label="Outstanding receivable" value={formatMoney(data.stats.receivable, currency)} icon={<CircleDollarSign />} tone="success" href="/invoices" hint={`${data.stats.automationRate}% automation rate`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's priority actions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Today&apos;s priority actions</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">AI suggestions grounded in source evidence, waiting for your review.</p>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href="/actions">View all <ArrowRight className="size-4" /></Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            {data.todaysActions.length === 0 ? (
              <div className="p-5">
                <EmptyState compact icon={<Sparkles />} title="You're all caught up" description="No pending action cards right now. New inbound items will appear here automatically." action={<Button asChild size="sm"><Link href="/inbox">Go to inbox</Link></Button>} />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {data.todaysActions.map((a) => (
                  <li key={a.id}>
                    <Link href={`/actions?item=${a.inboundItemId ?? ""}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40">
                      <ActionIcon type={a.type} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{a.title}</p>
                          <Badge variant="outline" size="sm">{ACTION_TYPE_LABELS[a.type as ActionType] ?? a.type}</Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {a.inboundItem?.contact?.name ?? "Unknown contact"} · {a.summary}
                        </p>
                      </div>
                      <div className="hidden flex-col items-end gap-1 sm:flex">
                        <ConfidenceBadge value={a.confidence} size="sm" />
                        <PriorityBadge priority={a.priority} size="sm" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Quick actions + overdue */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <QuickAction href="/quotes/new" icon={<FileText />} label="New quote" />
              <QuickAction href="/invoices/new" icon={<Plus />} label="New invoice" />
              <QuickAction href="/inbox?compose=upload" icon={<Upload />} label="Upload file" />
              <QuickAction href="/customers?new=1" icon={<Plus />} label="Add customer" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Overdue payments</CardTitle>
              <Button asChild variant="ghost" size="sm"><Link href="/invoices?status=overdue">All</Link></Button>
            </CardHeader>
            <CardContent className="p-0">
              {data.overdueInvoices.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-muted-foreground">No overdue invoices. </p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.overdueInvoices.map((inv) => {
                    const due = dueLabel(inv.dueAt);
                    return (
                      <li key={inv.id}>
                        <Link href={`/invoices/${inv.id}`} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{inv.contact?.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{inv.number}</p>
                          </div>
                          <div className="text-right">
                            <p className="tabnum text-sm font-medium">{formatMoney(inv.totalCents - inv.paidCents, inv.currency)}</p>
                            <span className={cn("text-2xs font-medium", due.tone === "danger" ? "text-danger" : "text-muted-foreground")}>{due.label}</span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trend + recent inbox */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inbound vs. completed</CardTitle>
            <p className="text-sm text-muted-foreground">Last 14 days of inbound items and completed actions.</p>
          </CardHeader>
          <CardContent>
            {data.series.length > 0 ? (
              <TrendChart data={data.series} />
            ) : (
              <EmptyState compact title="No trend data yet" description="Analytics build up as you process items." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent inbox</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link href="/inbox">All</Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentInbox.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted-foreground">No inbound items yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.recentInbox.map((item) => (
                  <li key={item.id}>
                    <Link href={`/inbox/${item.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                      <Avatar name={item.contact?.name ?? "Unknown"} size="sm" color={item.contact ? undefined : "#94a3b8"} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">{item.contact?.name ?? item.fromIdentifier ?? "Unknown"}</p>
                          <span className="shrink-0 text-2xs text-muted-foreground">{formatRelative(item.receivedAt)}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <IntentBadge intent={item.intent} size="sm" />
                          {item.status === "needs_review" && <StatusBadge status="needs_review" size="sm" />}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 text-center transition-all hover:border-primary/40 hover:bg-primary-muted/30 [&_svg]:size-5 [&_svg]:text-primary"
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
