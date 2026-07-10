import { db } from "@/lib/db";
import { computeTotals, computeLine, type LineInput } from "@/lib/commerce/totals";

// Document numbering + catalog resolution for quotes & invoices.
// Pure money math lives in @/lib/commerce/totals (client-safe).

export { computeTotals, computeLine };
export type { LineInput };

async function nextNumber(orgId: string, kind: "quote" | "invoice"): Promise<string> {
  const prefix = kind === "quote" ? "QUO" : "INV";
  const count = kind === "quote"
    ? await db.quote.count({ where: { orgId } })
    : await db.invoice.count({ where: { orgId } });
  return `${prefix}-${1001 + count}`;
}

export const nextQuoteNumber = (orgId: string) => nextNumber(orgId, "quote");
export const nextInvoiceNumber = (orgId: string) => nextNumber(orgId, "invoice");

/** Resolve draft items (from an AI suggestion) to catalog-priced line items. */
export async function resolveDraftItems(
  orgId: string,
  draftItems: { name: string; quantity?: number; catalogId?: string | null }[],
): Promise<LineInput[]> {
  if (!draftItems?.length) return [];
  const catalog = await db.catalogItem.findMany({ where: { orgId, isActive: true } });
  return draftItems.map((d) => {
    const match = d.catalogId
      ? catalog.find((c) => c.id === d.catalogId)
      : catalog.find((c) => c.name.toLowerCase() === d.name.toLowerCase());
    return {
      name: match?.name ?? d.name,
      quantity: d.quantity ?? 1,
      unitPriceCents: match?.priceCents ?? 0,
      taxPercent: match?.taxPercent ?? 0,
    };
  });
}
