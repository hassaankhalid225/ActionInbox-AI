import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/context";
import { getInvoice } from "@/lib/services/invoices";
import { getEditorOptions } from "@/lib/services/commerce-options";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { DocEditor } from "@/components/commerce/doc-editor";

export const metadata: Metadata = { title: "Edit invoice" };
export const dynamic = "force-dynamic";

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const ctx = await requirePermission("invoice.manage");
  const [invoice, { contacts, catalog }] = await Promise.all([getInvoice(ctx.org.id, params.id), getEditorOptions(ctx.org.id)]);
  if (!invoice) notFound();

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm"><Link href={`/invoices/${invoice.id}`}><ArrowLeft className="size-4" /> Back to invoice</Link></Button>
      <PageHeader title={`Edit ${invoice.number}`} />
      <DocEditor
        kind="invoice"
        mode="edit"
        docId={invoice.id}
        currency={invoice.currency}
        contacts={contacts}
        catalog={catalog}
        initial={{
          contactId: invoice.contactId,
          items: invoice.items.map((i) => ({ name: i.name, description: i.description, quantity: i.quantity, unitPriceCents: i.unitPriceCents, taxPercent: i.taxPercent })),
          notes: invoice.notes,
          terms: invoice.terms,
          discountCents: invoice.discountCents,
          date: invoice.dueAt ? invoice.dueAt.toISOString().slice(0, 10) : null,
        }}
      />
    </div>
  );
}
