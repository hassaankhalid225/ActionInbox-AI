import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/context";
import { getEditorOptions } from "@/lib/services/commerce-options";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { DocEditor } from "@/components/commerce/doc-editor";

export const metadata: Metadata = { title: "New invoice" };
export const dynamic = "force-dynamic";

export default async function NewInvoicePage({ searchParams }: { searchParams: { contact?: string } }) {
  const ctx = await requirePermission("invoice.manage");
  const { contacts, catalog } = await getEditorOptions(ctx.org.id);

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm"><Link href="/invoices"><ArrowLeft className="size-4" /> Invoices</Link></Button>
      <PageHeader title="New invoice" description="Create an invoice from your catalog and send it for payment." />
      <DocEditor
        kind="invoice"
        mode="create"
        currency={ctx.org.currency}
        contacts={contacts}
        catalog={catalog}
        initial={{ contactId: searchParams.contact ?? null, items: [{ name: "", quantity: 1, unitPriceCents: 0, taxPercent: 17 }] }}
      />
    </div>
  );
}
