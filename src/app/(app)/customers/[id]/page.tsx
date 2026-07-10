import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Phone, Mail, Languages, Ban, FileText, ReceiptText, MessageSquare, Plus } from "lucide-react";
import { requireAuth, can } from "@/lib/auth/context";
import { getContact } from "@/lib/services/contacts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StatTile } from "@/components/shared/stat-tile";
import { StatusBadge, PriorityBadge } from "@/components/ui/status";
import { EmptyState } from "@/components/ui/empty-state";
import { ContactFormDialog } from "@/components/customers/contact-form-dialog";
import { formatMoney, formatDate, timeAgo, titleCase } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Customer" };
export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const ctx = await requireAuth();
  const contact = await getContact(ctx.org.id, params.id);
  if (!contact) notFound();

  const canManage = can(ctx.role, "customer.manage");
  const currency = ctx.org.currency;
  const totalInvoiced = contact.invoices.reduce((s, i) => s + i.totalCents, 0);
  const outstanding = contact.invoices.filter((i) => i.status !== "paid" && i.status !== "void").reduce((s, i) => s + (i.totalCents - i.paidCents), 0);
  const tags = (contact.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm"><Link href="/customers"><ArrowLeft className="size-4" /> Customers</Link></Button>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={contact.name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{contact.name}</h1>
                <Badge variant={contact.kind === "vendor" ? "accent" : "primary"} size="sm">{titleCase(contact.kind)}</Badge>
                {contact.isBlocked && <Badge variant="danger" size="sm"><Ban className="size-3" /> Blocked</Badge>}
              </div>
              {contact.company && <p className="text-sm text-muted-foreground">{contact.company}</p>}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {contact.phone && <span className="flex items-center gap-1"><Phone className="size-3.5" /> {contact.phone}</span>}
                {contact.email && <span className="flex items-center gap-1"><Mail className="size-3.5" /> {contact.email}</span>}
                {contact.language && <span className="flex items-center gap-1"><Languages className="size-3.5" /> {titleCase(contact.language)}</span>}
              </div>
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((t) => <Badge key={t} variant="outline" size="sm">{t}</Badge>)}
                </div>
              )}
            </div>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm"><Link href={`/quotes/new?contact=${contact.id}`}><Plus className="size-4" /> Quote</Link></Button>
              <ContactFormDialog mode="edit" contact={contact} trigger={<Button variant="outline" size="sm">Edit</Button>} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatTile label="Total invoiced" value={formatMoney(totalInvoiced, currency)} tone="primary" />
        <StatTile label="Outstanding" value={formatMoney(outstanding, currency)} tone="warning" />
        <StatTile label="Quotes" value={contact._count.quotes} tone="info" />
        <StatTile label="Open tasks" value={contact.tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length} tone="accent" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Invoices */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base"><ReceiptText className="size-4 text-muted-foreground" /> Invoices</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link href={`/invoices/new?contact=${contact.id}`}>New</Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            {contact.invoices.length === 0 ? <EmptyBlock label="No invoices yet" /> : (
              <ul className="divide-y divide-border">
                {contact.invoices.map((inv) => (
                  <li key={inv.id}>
                    <Link href={`/invoices/${inv.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-muted/40">
                      <div className="flex items-center gap-2"><span className="text-sm font-medium">{inv.number}</span><StatusBadge status={inv.status} size="sm" /></div>
                      <span className="tabnum text-sm">{formatMoney(inv.totalCents, inv.currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Quotes */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base"><FileText className="size-4 text-muted-foreground" /> Quotes</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link href={`/quotes/new?contact=${contact.id}`}>New</Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            {contact.quotes.length === 0 ? <EmptyBlock label="No quotes yet" /> : (
              <ul className="divide-y divide-border">
                {contact.quotes.map((q) => (
                  <li key={q.id}>
                    <Link href={`/quotes/${q.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-muted/40">
                      <div className="flex items-center gap-2"><span className="text-sm font-medium">{q.number}</span><StatusBadge status={q.status} size="sm" /></div>
                      <span className="tabnum text-sm">{formatMoney(q.totalCents, q.currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Conversations */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="size-4 text-muted-foreground" /> Recent conversations</CardTitle></CardHeader>
          <CardContent className="p-0">
            {contact.conversations.length === 0 ? <EmptyBlock label="No conversations yet" /> : (
              <ul className="divide-y divide-border">
                {contact.conversations.map((c) => {
                  const last = c.items[0];
                  return (
                    <li key={c.id}>
                      <Link href={last ? `/inbox/${last.id}` : "/inbox"} className="block px-5 py-3 hover:bg-muted/40">
                        <div className="flex items-center justify-between"><span className="text-sm font-medium">{titleCase(c.channelType)}</span><span className="text-2xs text-muted-foreground">{timeAgo(c.lastMessageAt)}</span></div>
                        {last?.bodyText && <p className="mt-0.5 truncate text-xs text-muted-foreground">{last.bodyText}</p>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader><CardTitle className="text-base">Tasks</CardTitle></CardHeader>
          <CardContent className="p-0">
            {contact.tasks.length === 0 ? <EmptyBlock label="No tasks yet" /> : (
              <ul className="divide-y divide-border">
                {contact.tasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2"><span className="text-sm">{t.title}</span></div>
                    <div className="flex items-center gap-2"><PriorityBadge priority={t.priority} size="sm" /><StatusBadge status={t.status} size="sm" /></div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {contact.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm text-muted-foreground">{contact.notes}</p></CardContent>
        </Card>
      )}
    </div>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return <p className="px-5 pb-5 text-sm text-muted-foreground">{label}</p>;
}
