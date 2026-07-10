import Link from "next/link";
import type { Metadata } from "next";
import { Users, Phone, Mail, FileText, ReceiptText, Ban } from "lucide-react";
import { requireAuth } from "@/lib/auth/context";
import { getContacts, getContactCounts } from "@/lib/services/contacts";
import { PageHeader } from "@/components/shared/page-header";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ContactFormDialog } from "@/components/customers/contact-form-dialog";
import { timeAgo } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "customer", label: "Customers" },
  { key: "vendor", label: "Vendors" },
  { key: "lead", label: "Leads" },
] as const;

const KIND_VARIANT: Record<string, "primary" | "accent" | "info" | "neutral"> = {
  customer: "primary",
  vendor: "accent",
  lead: "info",
};

function splitTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { kind?: string; q?: string; page?: string; new?: string };
}) {
  const ctx = await requireAuth();
  const kind = searchParams.kind || "all";
  const search = searchParams.q;
  const page = parseInt(searchParams.page ?? "1", 10) || 1;

  const [{ items, total, pageSize }, counts] = await Promise.all([
    getContacts(ctx.org.id, { kind, search, page }),
    getContactCounts(ctx.org.id),
  ]);

  const tabs = FILTERS.map((f) => ({
    key: f.key,
    label: f.label,
    count: (counts as Record<string, number>)[f.key],
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        description="Every customer, vendor, and lead — with their quotes, invoices, and conversations in one place."
        actions={<ContactFormDialog mode="create" defaultKind={kind === "vendor" || kind === "lead" ? kind : "customer"} />}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs tabs={tabs} active={kind} basePath="/customers" paramKey="kind" extraParams={{ q: search }} />
        <SearchInput placeholder="Search name, company, phone, email…" className="lg:w-72" />
      </div>

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title={search ? "No matching contacts" : "No contacts yet"}
            description={
              search
                ? "Try a different search or filter."
                : "Add your first customer, vendor, or lead — or they'll be created automatically from your inbox."
            }
            action={<ContactFormDialog mode="create" defaultKind={kind === "vendor" || kind === "lead" ? kind : "customer"} />}
            className="border-0"
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((c) => {
              const tags = splitTags(c.tags);
              return (
                <li key={c.id}>
                  <Link
                    href={`/customers/${c.id}`}
                    className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:gap-4"
                  >
                    <Avatar name={c.name} size="md" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-sm font-semibold">{c.name}</p>
                          <Badge variant={KIND_VARIANT[c.kind] ?? "neutral"} size="sm">
                            {c.kind}
                          </Badge>
                          {c.isBlocked && (
                            <Badge variant="danger" size="sm">
                              <Ban className="size-3" /> Blocked
                            </Badge>
                          )}
                        </div>
                        <span className="shrink-0 text-2xs text-muted-foreground">{timeAgo(c.updatedAt)}</span>
                      </div>

                      {c.company && <p className="mt-0.5 truncate text-sm text-muted-foreground">{c.company}</p>}

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-2xs text-muted-foreground">
                        {c.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="size-3" /> {c.phone}
                          </span>
                        )}
                        {c.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="size-3" /> {c.email}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <FileText className="size-3" /> {c._count.quotes} quote{c._count.quotes === 1 ? "" : "s"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ReceiptText className="size-3" /> {c._count.invoices} invoice{c._count.invoices === 1 ? "" : "s"}
                        </span>
                      </div>

                      {tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {tags.map((t) => (
                            <Badge key={t} variant="outline" size="sm">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Pagination page={page} total={total} pageSize={pageSize} basePath="/customers" params={{ kind, q: search }} />
    </div>
  );
}
