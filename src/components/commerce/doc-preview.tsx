import { LogoMark } from "@/components/shared/logo";
import { formatMoney, formatDate } from "@/lib/utils/format";

type Line = { id: string; name: string; description?: string | null; quantity: number; unitPriceCents: number; taxPercent: number; lineTotalCents: number };

/** Printable quote/invoice document (SRS FR-041 — branded PDF via print). */
export function DocPreview({
  kind,
  number,
  org,
  contact,
  items,
  subtotalCents,
  taxCents,
  discountCents,
  totalCents,
  paidCents,
  currency,
  dateLabel,
  dateValue,
  notes,
  terms,
  status,
}: {
  kind: "Quotation" | "Invoice";
  number: string;
  org: { name: string; brandColor: string };
  contact?: { name: string; company?: string | null; email?: string | null; phone?: string | null } | null;
  items: Line[];
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  paidCents?: number;
  currency: string;
  dateLabel: string;
  dateValue: Date | string | null;
  notes?: string | null;
  terms?: string | null;
  status: string;
}) {
  return (
    <div id="doc-print" className="rounded-xl border border-border bg-card p-8 shadow-sm print:border-0 print:shadow-none">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <p className="text-lg font-semibold">{org.name}</p>
            <p className="text-sm text-muted-foreground">Powered by ActionInbox AI</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-tight" style={{ color: org.brandColor }}>{kind}</p>
          <p className="tabnum text-sm font-medium">{number}</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{status}</p>
        </div>
      </div>

      <div className="my-6 h-px bg-border" />

      {/* Bill to + date */}
      <div className="flex flex-wrap justify-between gap-6">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Bill to</p>
          <p className="mt-1 font-medium">{contact?.name ?? "—"}</p>
          {contact?.company && <p className="text-sm text-muted-foreground">{contact.company}</p>}
          {contact?.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
          {contact?.phone && <p className="text-sm text-muted-foreground">{contact.phone}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">{dateLabel}</p>
          <p className="mt-1 font-medium">{formatDate(dateValue)}</p>
        </div>
      </div>

      {/* Items */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-2xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 font-semibold">Item</th>
              <th className="pb-2 text-center font-semibold">Qty</th>
              <th className="pb-2 text-right font-semibold">Unit price</th>
              <th className="pb-2 text-right font-semibold">Tax</th>
              <th className="pb-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((l) => (
              <tr key={l.id}>
                <td className="py-2.5">
                  <p className="font-medium">{l.name}</p>
                  {l.description && <p className="text-xs text-muted-foreground">{l.description}</p>}
                </td>
                <td className="tabnum py-2.5 text-center">{l.quantity}</td>
                <td className="tabnum py-2.5 text-right">{formatMoney(l.unitPriceCents, currency)}</td>
                <td className="tabnum py-2.5 text-right text-muted-foreground">{l.taxPercent}%</td>
                <td className="tabnum py-2.5 text-right font-medium">{formatMoney(l.lineTotalCents, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-xs space-y-1.5 text-sm">
          <Row label="Subtotal" value={formatMoney(subtotalCents, currency)} />
          <Row label="Tax" value={formatMoney(taxCents, currency)} />
          {discountCents > 0 && <Row label="Discount" value={`− ${formatMoney(discountCents, currency)}`} />}
          <div className="my-1 h-px bg-border" />
          <Row label="Total" value={formatMoney(totalCents, currency)} bold />
          {paidCents != null && paidCents > 0 && (
            <>
              <Row label="Paid" value={`− ${formatMoney(paidCents, currency)}`} />
              <Row label="Balance due" value={formatMoney(totalCents - paidCents, currency)} bold />
            </>
          )}
        </div>
      </div>

      {(notes || terms) && (
        <div className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
          {notes && <div><p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p><p className="mt-1 text-sm text-muted-foreground">{notes}</p></div>}
          {terms && <div><p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Terms</p><p className="mt-1 text-sm text-muted-foreground">{terms}</p></div>}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={`tabnum ${bold ? "text-base font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
