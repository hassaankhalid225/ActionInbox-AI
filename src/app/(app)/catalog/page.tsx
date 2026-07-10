import type { Metadata } from "next";
import { Package } from "lucide-react";
import { requireAuth } from "@/lib/auth/context";
import { getCatalogItems, getCatalogCounts } from "@/lib/services/catalog";
import { PageHeader } from "@/components/shared/page-header";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status";
import { DataTable, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { CatalogFormDialog } from "@/components/catalog/catalog-form-dialog";
import { CatalogRowActions } from "@/components/catalog/catalog-row-actions";
import { formatMoney } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Catalog" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

export default async function CatalogPage({ searchParams }: { searchParams: { q?: string; filter?: string; page?: string; new?: string } }) {
  const ctx = await requireAuth();
  const filter = searchParams.filter ?? "all";
  const page = parseInt(searchParams.page ?? "1", 10) || 1;
  const activeOnly = filter === "active" ? true : filter === "inactive" ? false : undefined;

  const [{ items, total, pageSize }, counts] = await Promise.all([
    getCatalogItems(ctx.org.id, { search: searchParams.q, activeOnly, page }),
    getCatalogCounts(ctx.org.id),
  ]);
  const tabs = FILTERS.map((f) => ({ key: f.key, label: f.label, count: (counts as Record<string, number>)[f.key] }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Catalog"
        description="Products & services used for quotes, invoices, and AI recognition."
        actions={<CatalogFormDialog mode="create" defaultOpen={searchParams.new === "1"} />}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs tabs={tabs} active={filter} basePath="/catalog" extraParams={{ q: searchParams.q }} />
        <SearchInput placeholder="Search products, SKUs, aliases…" className="lg:w-72" />
      </div>

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title={searchParams.q ? "No matching items" : "Your catalog is empty"}
            description="Add products and services with prices, taxes, and Roman-Urdu aliases so the AI can recognize them."
            action={<CatalogFormDialog mode="create" trigger={<Button>Add your first item</Button>} />}
            className="border-0"
          />
        ) : (
          <DataTable>
            <THead>
              <TR>
                <TH>SKU</TH>
                <TH>Name</TH>
                <TH>Unit</TH>
                <TH className="text-right">Price</TH>
                <TH>Tax</TH>
                <TH>Aliases</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((item) => (
                <TR key={item.id}>
                  <TD className="tabnum text-xs text-muted-foreground">{item.sku ?? "—"}</TD>
                  <TD>
                    <p className="font-medium">{item.name}</p>
                    {item.description && <p className="max-w-xs truncate text-xs text-muted-foreground">{item.description}</p>}
                  </TD>
                  <TD className="text-muted-foreground">{item.unit}</TD>
                  <TD className="tabnum text-right font-medium">{formatMoney(item.priceCents, ctx.org.currency)}</TD>
                  <TD className="text-muted-foreground">{item.taxPercent}%</TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      {item.aliases.slice(0, 2).map((a) => <Badge key={a.id} variant="outline" size="sm">{a.alias}</Badge>)}
                      {item.aliases.length > 2 && <Badge variant="neutral" size="sm">+{item.aliases.length - 2}</Badge>}
                    </div>
                  </TD>
                  <TD><StatusBadge status={item.isActive ? "active" : "disabled"} size="sm" /></TD>
                  <TD><CatalogRowActions item={item} /></TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        )}
      </Card>
      <Pagination page={page} total={total} pageSize={pageSize} basePath="/catalog" params={{ filter, q: searchParams.q }} />
    </div>
  );
}
