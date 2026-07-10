"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Package, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field, Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { formatMoney, parseMoneyToCents } from "@/lib/utils/format";
import { computeTotals } from "@/lib/commerce/totals";

type Line = { name: string; description?: string | null; quantity: number; unitPriceCents: number; taxPercent: number };
type Contact = { id: string; name: string };
type CatalogItem = { id: string; name: string; priceCents: number; taxPercent: number; unit: string };

export function DocEditor({
  kind,
  mode,
  docId,
  currency,
  contacts,
  catalog,
  initial,
}: {
  kind: "quote" | "invoice";
  mode: "create" | "edit";
  docId?: string;
  currency: string;
  contacts: Contact[];
  catalog: CatalogItem[];
  initial?: {
    contactId?: string | null;
    items: Line[];
    notes?: string | null;
    terms?: string | null;
    discountCents?: number;
    date?: string | null;
  };
}) {
  const router = useRouter();
  const [contactId, setContactId] = useState(initial?.contactId ?? "");
  const [items, setItems] = useState<Line[]>(
    initial?.items?.length ? initial.items : [{ name: "", quantity: 1, unitPriceCents: 0, taxPercent: 17 }],
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [terms, setTerms] = useState(initial?.terms ?? (kind === "quote" ? "50% advance, 50% on delivery." : "Payment due within 14 days."));
  const [discount, setDiscount] = useState((initial?.discountCents ?? 0) / 100);
  const [date, setDate] = useState(initial?.date ?? "");
  const [loading, setLoading] = useState(false);

  const totals = useMemo(() => computeTotals(items.filter((i) => i.name), Math.round(discount * 100)), [items, discount]);

  function updateLine(i: number, patch: Partial<Line>) {
    setItems((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setItems((prev) => [...prev, { name: "", quantity: 1, unitPriceCents: 0, taxPercent: 17 }]);
  }
  function removeLine(i: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }
  function addCatalog(id: string) {
    const c = catalog.find((x) => x.id === id);
    if (!c) return;
    setItems((prev) => {
      const empty = prev.findIndex((l) => !l.name);
      const line: Line = { name: c.name, quantity: 1, unitPriceCents: c.priceCents, taxPercent: c.taxPercent };
      if (empty >= 0) return prev.map((l, idx) => (idx === empty ? line : l));
      return [...prev, line];
    });
  }

  async function save() {
    const valid = items.filter((i) => i.name.trim());
    if (valid.length === 0) {
      toast.error("Add at least one line item.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        contactId: contactId || null,
        currency,
        notes,
        terms,
        discountCents: Math.round(discount * 100),
        [kind === "quote" ? "validUntil" : "dueAt"]: date || null,
        items: valid,
      };
      const path = kind === "quote" ? "/api/quotes" : "/api/invoices";
      const res = mode === "create"
        ? await api.post<{ id: string }>(path, payload)
        : await api.patch<{ id: string }>(`${path}/${docId}`, payload);
      toast.success(mode === "create" ? `${kind === "quote" ? "Quote" : "Invoice"} created` : "Saved");
      router.push(`/${kind}s/${res.id ?? docId}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save.");
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Line items</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <DataTable>
              <THead>
                <TR>
                  <TH className="w-[40%]">Item</TH>
                  <TH className="w-20">Qty</TH>
                  <TH className="w-32">Unit price</TH>
                  <TH className="w-16">Tax%</TH>
                  <TH className="w-28 text-right">Total</TH>
                  <TH className="w-10" />
                </TR>
              </THead>
              <TBody>
                {items.map((line, i) => (
                  <TR key={i} className="hover:bg-transparent">
                    <TD>
                      <Input value={line.name} onChange={(e) => updateLine(i, { name: e.target.value })} placeholder="Item name" className="h-9" />
                    </TD>
                    <TD>
                      <Input type="number" min={0} value={line.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) || 0 })} className="h-9" />
                    </TD>
                    <TD>
                      <Input type="number" min={0} value={line.unitPriceCents / 100} onChange={(e) => updateLine(i, { unitPriceCents: parseMoneyToCents(e.target.value) })} className="h-9" />
                    </TD>
                    <TD>
                      <Input type="number" min={0} max={100} value={line.taxPercent} onChange={(e) => updateLine(i, { taxPercent: Number(e.target.value) || 0 })} className="h-9" />
                    </TD>
                    <TD className="tabnum text-right text-sm">{formatMoney(Math.round(line.quantity * line.unitPriceCents), currency)}</TD>
                    <TD>
                      <button onClick={() => removeLine(i)} className="text-muted-foreground transition-colors hover:text-danger" aria-label="Remove line">
                        <Trash2 className="size-4" />
                      </button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </DataTable>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={addLine}><Plus className="size-4" /> Add line</Button>
              {catalog.length > 0 && (
                <div className="w-56">
                  <Select onValueChange={addCatalog} value="">
                    <SelectTrigger className="h-9"><span className="flex items-center gap-2 text-muted-foreground"><Package className="size-4" /> Add from catalog</span></SelectTrigger>
                    <SelectContent>
                      {catalog.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name} · {formatMoney(c.priceCents, currency)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Notes & terms</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Notes"><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery details, remarks…" /></Field>
            <Field label="Terms"><Textarea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} /></Field>
          </CardContent>
        </Card>
      </div>

      {/* Summary sidebar */}
      <div className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label={kind === "quote" ? "Customer" : "Bill to"}>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={kind === "quote" ? "Valid until" : "Due date"}>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={`Discount (${currency})`}>
              <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-5">
            <SummaryRow label="Subtotal" value={formatMoney(totals.subtotalCents, currency)} />
            <SummaryRow label="Tax" value={formatMoney(totals.taxCents, currency)} />
            {totals.discountCents > 0 && <SummaryRow label="Discount" value={`− ${formatMoney(totals.discountCents, currency)}`} />}
            <div className="my-1 border-t border-border" />
            <SummaryRow label="Total" value={formatMoney(totals.totalCents, currency)} bold />
          </CardContent>
        </Card>

        <Button className="w-full" onClick={save} loading={loading}>
          <Save className="size-4" /> {mode === "create" ? `Create ${kind}` : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={`tabnum ${bold ? "text-base font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
