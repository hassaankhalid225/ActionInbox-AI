import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/context";
import { getQuote } from "@/lib/services/quotes";
import { getEditorOptions } from "@/lib/services/commerce-options";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { DocEditor } from "@/components/commerce/doc-editor";

export const metadata: Metadata = { title: "Edit quote" };
export const dynamic = "force-dynamic";

export default async function EditQuotePage({ params }: { params: { id: string } }) {
  const ctx = await requirePermission("quote.manage");
  const [quote, { contacts, catalog }] = await Promise.all([getQuote(ctx.org.id, params.id), getEditorOptions(ctx.org.id)]);
  if (!quote) notFound();

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm"><Link href={`/quotes/${quote.id}`}><ArrowLeft className="size-4" /> Back to quote</Link></Button>
      <PageHeader title={`Edit ${quote.number}`} />
      <DocEditor
        kind="quote"
        mode="edit"
        docId={quote.id}
        currency={quote.currency}
        contacts={contacts}
        catalog={catalog}
        initial={{
          contactId: quote.contactId,
          items: quote.items.map((i) => ({ name: i.name, description: i.description, quantity: i.quantity, unitPriceCents: i.unitPriceCents, taxPercent: i.taxPercent })),
          notes: quote.notes,
          terms: quote.terms,
          discountCents: quote.discountCents,
          date: quote.validUntil ? quote.validUntil.toISOString().slice(0, 10) : null,
        }}
      />
    </div>
  );
}
