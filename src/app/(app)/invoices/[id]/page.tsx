import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, FileText } from "lucide-react";
import { requireAuth, can } from "@/lib/auth/context";
import { getInvoice } from "@/lib/services/invoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status";
import { Badge } from "@/components/ui/badge";
import { DocPreview } from "@/components/commerce/doc-preview";
import { InvoiceActions } from "@/components/commerce/invoice-actions";
import { formatMoney, formatDateTime, titleCase } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Invoice" };
export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const ctx = await requireAuth();
  const invoice = await getInvoice(ctx.org.id, params.id);
  if (!invoice) notFound();

  const balance = invoice.totalCents - invoice.paidCents;
  const canManage = can(ctx.role, "invoice.manage");
  const canVerify = can(ctx.role, "payment.verify");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm"><Link href="/invoices"><ArrowLeft className="size-4" /> Invoices</Link></Button>
          <h1 className="text-lg font-semibold">{invoice.number}</h1>
          <StatusBadge status={invoice.status} />
          {invoice.version > 1 && <Badge variant="outline" size="sm">v{invoice.version}</Badge>}
        </div>
        <InvoiceActions id={invoice.id} status={invoice.status} balanceCents={balance} currency={invoice.currency} canManage={canManage} canVerify={canVerify} />
      </div>

      {invoice.quote && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted/40 px-4 py-2.5 text-sm">
          <FileText className="size-4 text-muted-foreground" />
          Created from quote <Link href={`/quotes/${invoice.quote.id}`} className="font-medium text-primary hover:underline">{invoice.quote.number}</Link>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <DocPreview
            kind="Invoice"
            number={invoice.number}
            org={{ name: ctx.org.name, brandColor: ctx.org.brandColor }}
            contact={invoice.contact}
            items={invoice.items}
            subtotalCents={invoice.subtotalCents}
            taxCents={invoice.taxCents}
            discountCents={invoice.discountCents}
            totalCents={invoice.totalCents}
            paidCents={invoice.paidCents}
            currency={invoice.currency}
            dateLabel="Due date"
            dateValue={invoice.dueAt}
            notes={invoice.notes}
            terms={invoice.terms}
            status={invoice.status}
          />
        </div>

        <div className="space-y-5 print:hidden">
          <Card>
            <CardHeader><CardTitle className="text-base">Payment status</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="tabnum font-medium">{formatMoney(invoice.totalCents, invoice.currency)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="tabnum">{formatMoney(invoice.paidCents, invoice.currency)}</span></div>
              <div className="flex justify-between border-t border-border pt-2"><span className="font-medium">Balance due</span><span className="tabnum font-semibold">{formatMoney(balance, invoice.currency)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Payment history</CardTitle></CardHeader>
            <CardContent className="p-0">
              {invoice.payments.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {invoice.payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <div>
                        <p className="tabnum font-medium">{formatMoney(p.amountCents, invoice.currency)}</p>
                        <p className="text-2xs text-muted-foreground">{titleCase(p.method)} · {formatDateTime(p.createdAt)}</p>
                      </div>
                      <StatusBadge status={p.status === "verified" ? "paid" : p.status} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
