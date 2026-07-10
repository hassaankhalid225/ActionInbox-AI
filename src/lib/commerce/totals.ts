// Pure money math — safe to import in client components (no Prisma/server deps).

export type LineInput = {
  name: string;
  description?: string | null;
  quantity: number;
  unitPriceCents: number;
  taxPercent: number;
};

export function computeLine(item: LineInput) {
  const base = Math.round(item.quantity * item.unitPriceCents);
  return { ...item, lineTotalCents: base };
}

export function computeTotals(items: LineInput[], discountCents = 0) {
  const lines = items.map(computeLine);
  const subtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);
  const taxCents = lines.reduce((s, l) => s + Math.round((l.lineTotalCents * l.taxPercent) / 100), 0);
  const totalCents = Math.max(0, subtotalCents + taxCents - discountCents);
  return { lines, subtotalCents, taxCents, discountCents, totalCents };
}
