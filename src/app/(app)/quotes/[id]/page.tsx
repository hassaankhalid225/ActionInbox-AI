import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { requireAuth, can } from "@/lib/auth/context";
import { getQuote } from "@/lib/services/quotes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { DocPreview } from "@/components/commerce/doc-preview";
import { QuoteActions } from "@/components/commerce/quote-actions";

export const metadata: Metadata = { title: "Quote" };
export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const ctx = await requireAuth();
  const quote = await getQuote(ctx.org.id, params.id);
  if (!quote) notFound();
  const canManage = can(ctx.role, "quote.manage");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm"><Link href="/quotes"><ArrowLeft className="size-4" /> Quotes</Link></Button>
          <h1 className="text-lg font-semibold">{quote.number}</h1>
          <StatusBadge status={quote.status} />
          {quote.version > 1 && <Badge variant="outline" size="sm">v{quote.version}</Badge>}
        </div>
        <QuoteActions id={quote.id} status={quote.status} canManage={canManage} />
      </div>

      {quote.invoices.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary-muted/30 px-4 py-2.5 text-sm">
          <ReceiptText className="size-4 text-primary" />
          Converted to invoice{" "}
          {quote.invoices.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}`} className="font-medium text-primary hover:underline">{inv.number}</Link>
          ))}
        </div>
      )}

      <div className="mx-auto max-w-3xl">
        <DocPreview
          kind="Quotation"
          number={quote.number}
          org={{ name: ctx.org.name, brandColor: ctx.org.brandColor }}
          contact={quote.contact}
          items={quote.items}
          subtotalCents={quote.subtotalCents}
          taxCents={quote.taxCents}
          discountCents={quote.discountCents}
          totalCents={quote.totalCents}
          currency={quote.currency}
          dateLabel="Valid until"
          dateValue={quote.validUntil}
          notes={quote.notes}
          terms={quote.terms}
          status={quote.status}
        />
      </div>
    </div>
  );
}
