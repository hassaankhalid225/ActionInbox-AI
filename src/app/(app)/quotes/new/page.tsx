import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/context";
import { getEditorOptions } from "@/lib/services/commerce-options";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { DocEditor } from "@/components/commerce/doc-editor";

export const metadata: Metadata = { title: "New quote" };
export const dynamic = "force-dynamic";

export default async function NewQuotePage({ searchParams }: { searchParams: { contact?: string } }) {
  const ctx = await requirePermission("quote.manage");
  const { contacts, catalog } = await getEditorOptions(ctx.org.id);

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm"><Link href="/quotes"><ArrowLeft className="size-4" /> Quotes</Link></Button>
      <PageHeader title="New quote" description="Build a quote from your catalog and send it for approval." />
      <DocEditor
        kind="quote"
        mode="create"
        currency={ctx.org.currency}
        contacts={contacts}
        catalog={catalog}
        initial={{ contactId: searchParams.contact ?? null, items: [{ name: "", quantity: 1, unitPriceCents: 0, taxPercent: 17 }] }}
      />
    </div>
  );
}
