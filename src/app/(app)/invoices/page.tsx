import Link from "next/link";
import type { Metadata } from "next";
import { ReceiptText, Plus } from "lucide-react";
import { requireAuth } from "@/lib/auth/context";
import { getInvoices, getInvoiceCounts, type InvoiceStatusFilter } from "@/lib/services/invoices";
import { PageHeader } from "@/components/shared/page-header";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { StatTile } from "@/components/shared/stat-tile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status";
import { DataTable, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatMoney, dueLabel } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Invoices" };
export const dynamic = "force-dynamic";

const FILTERS: { key: InvoiceStatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "partial", label: "Partial" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
];

export default async function InvoicesPage({ searchParams }: { searchParams: { status?: string; q?: string; page?: string } }) {
  const ctx = await requireAuth();
  const status = (searchParams.status as InvoiceStatusFilter) || "all";
  const page = parseInt(searchParams.page ?? "1", 10) || 1;
  const [{ items, total, pageSize, outstanding }, counts] = await Promise.all([
    getInvoices(ctx.org.id, { status, search: searchParams.q, page }),
    getInvoiceCounts(ctx.org.id),
  ]);
  const tabs = FILTERS.map((f) => ({ key: f.key, label: f.label, count: counts[f.key] }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Invoices"
        description="Draft, send, track payments, and follow up on overdue invoices."
        actions={<Button asChild><Link href="/invoices/new"><Plus className="size-4" /> New invoice</Link></Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Outstanding" value={formatMoney(outstanding, ctx.org.currency)} tone="warning" hint="Sent, partial & overdue" />
        <StatTile label="Overdue" value={counts.overdue} tone="danger" href="/invoices?status=overdue" />
        <StatTile label="Paid" value={counts.paid} tone="success" href="/invoices?status=paid" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs tabs={tabs} active={status} basePath="/invoices" paramKey="status" extraParams={{ q: searchParams.q }} />
        <SearchInput placeholder="Search invoices…" className="lg:w-64" />
      </div>

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={<ReceiptText />}
            title="No invoices yet"
            description="Create an invoice, convert a quote, or approve an invoice action card."
            action={<Button asChild><Link href="/invoices/new">New invoice</Link></Button>}
            className="border-0"
          />
        ) : (
          <DataTable>
            <THead>
              <TR>
                <TH>Number</TH>
                <TH>Customer</TH>
                <TH>Status</TH>
                <TH>Due</TH>
                <TH className="text-right">Total</TH>
                <TH className="text-right">Balance</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((inv) => {
                const balance = inv.totalCents - inv.paidCents;
                const due = dueLabel(inv.dueAt);
                return (
                  <TR key={inv.id}>
                    <TD><Link href={`/invoices/${inv.id}`} className="font-medium text-primary hover:underline">{inv.number}</Link></TD>
                    <TD>{inv.contact?.name ?? "—"}</TD>
                    <TD><StatusBadge status={inv.status} size="sm" /></TD>
                    <TD><span className={cn("text-xs font-medium", due.tone === "danger" ? "text-danger" : due.tone === "warning" ? "text-warning-foreground" : "text-muted-foreground")}>{due.label}</span></TD>
                    <TD className="tabnum text-right">{formatMoney(inv.totalCents, inv.currency)}</TD>
                    <TD className="tabnum text-right font-medium">{balance > 0 ? formatMoney(balance, inv.currency) : "—"}</TD>
                  </TR>
                );
              })}
            </TBody>
          </DataTable>
        )}
      </Card>
      <Pagination page={page} total={total} pageSize={pageSize} basePath="/invoices" params={{ status, q: searchParams.q }} />
    </div>
  );
}
