import Link from "next/link";
import type { Metadata } from "next";
import { FileText, Plus } from "lucide-react";
import { requireAuth } from "@/lib/auth/context";
import { getQuotes, getQuoteCounts, type QuoteStatusFilter } from "@/lib/services/quotes";
import { PageHeader } from "@/components/shared/page-header";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status";
import { DataTable, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatMoney, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Quotes" };
export const dynamic = "force-dynamic";

const FILTERS: { key: QuoteStatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "accepted", label: "Accepted" },
  { key: "converted", label: "Converted" },
  { key: "expired", label: "Expired" },
];

export default async function QuotesPage({ searchParams }: { searchParams: { status?: string; q?: string; page?: string } }) {
  const ctx = await requireAuth();
  const status = (searchParams.status as QuoteStatusFilter) || "all";
  const page = parseInt(searchParams.page ?? "1", 10) || 1;
  const [{ items, total, pageSize }, counts] = await Promise.all([
    getQuotes(ctx.org.id, { status, search: searchParams.q, page }),
    getQuoteCounts(ctx.org.id),
  ]);
  const tabs = FILTERS.map((f) => ({ key: f.key, label: f.label, count: counts[f.key] }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Quotes"
        description="Draft, send, and convert quotes into invoices."
        actions={<Button asChild><Link href="/quotes/new"><Plus className="size-4" /> New quote</Link></Button>}
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs tabs={tabs} active={status} basePath="/quotes" paramKey="status" extraParams={{ q: searchParams.q }} />
        <SearchInput placeholder="Search quotes…" className="lg:w-64" />
      </div>

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={<FileText />}
            title="No quotes yet"
            description="Create a quote manually, or approve a quote action card from your inbox."
            action={<Button asChild><Link href="/quotes/new">New quote</Link></Button>}
            className="border-0"
          />
        ) : (
          <DataTable>
            <THead>
              <TR>
                <TH>Number</TH>
                <TH>Customer</TH>
                <TH>Status</TH>
                <TH>Valid until</TH>
                <TH className="text-right">Total</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((q) => (
                <TR key={q.id} className="cursor-pointer">
                  <TD>
                    <Link href={`/quotes/${q.id}`} className="font-medium text-primary hover:underline">{q.number}</Link>
                  </TD>
                  <TD>{q.contact?.name ?? "—"}</TD>
                  <TD><StatusBadge status={q.status} size="sm" /></TD>
                  <TD className="text-muted-foreground">{formatDate(q.validUntil)}</TD>
                  <TD className="tabnum text-right font-medium">{formatMoney(q.totalCents, q.currency)}</TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        )}
      </Card>
      <Pagination page={page} total={total} pageSize={pageSize} basePath="/quotes" params={{ status, q: searchParams.q }} />
    </div>
  );
}
