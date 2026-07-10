"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { catalogItemSchema } from "@/lib/validation/entities";
import { parseMoneyToCents } from "@/lib/utils/format";

export type CatalogFormItem = {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  unit: string;
  priceCents: number;
  taxPercent: number;
  trackStock: boolean;
  stockQty: number | null;
  isActive: boolean;
  aliases: { id: string; alias: string; language: string | null }[];
};

type Props = {
  mode: "create" | "edit";
  item?: CatalogFormItem;
  trigger?: React.ReactNode;
  /** Open on mount (used for the `?new` deep-link on the catalog page). */
  defaultOpen?: boolean;
};

export function CatalogFormDialog({ mode, item, trigger, defaultOpen = false }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(defaultOpen);
  const [loading, setLoading] = React.useState(false);

  // Form state — reset each time the dialog opens.
  const [name, setName] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [unit, setUnit] = React.useState("unit");
  const [price, setPrice] = React.useState("");
  const [taxPercent, setTaxPercent] = React.useState("0");
  const [trackStock, setTrackStock] = React.useState(false);
  const [stockQty, setStockQty] = React.useState("0");
  const [isActive, setIsActive] = React.useState(true);
  const [aliases, setAliases] = React.useState<string[]>([]);
  const [aliasDraft, setAliasDraft] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function hydrate() {
    setName(item?.name ?? "");
    setSku(item?.sku ?? "");
    setDescription(item?.description ?? "");
    setUnit(item?.unit ?? "unit");
    setPrice(item ? String(item.priceCents / 100) : "");
    setTaxPercent(item ? String(item.taxPercent) : "0");
    setTrackStock(item?.trackStock ?? false);
    setStockQty(item?.stockQty != null ? String(item.stockQty) : "0");
    setIsActive(item?.isActive ?? true);
    setAliases(item?.aliases.map((a) => a.alias) ?? []);
    setAliasDraft("");
    setErrors({});
  }

  function onOpenChange(next: boolean) {
    if (next) hydrate();
    setOpen(next);
  }

  function commitAliasDraft(raw: string) {
    const parts = raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return;
    setAliases((prev) => Array.from(new Set([...prev, ...parts])));
    setAliasDraft("");
  }

  function onAliasKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitAliasDraft(aliasDraft);
    } else if (e.key === "Backspace" && !aliasDraft && aliases.length) {
      setAliases((prev) => prev.slice(0, -1));
    }
  }

  function removeAlias(value: string) {
    setAliases((prev) => prev.filter((a) => a !== value));
  }

  async function submit() {
    // Fold any pending alias text into the list before validating.
    const pending = aliasDraft
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const finalAliases = Array.from(new Set([...aliases, ...pending]));

    const payload = {
      sku: sku.trim() || null,
      name: name.trim(),
      description: description.trim() || null,
      unit: unit.trim() || "unit",
      priceCents: parseMoneyToCents(price || "0"),
      taxPercent: Math.round(Number(taxPercent) || 0),
      trackStock,
      stockQty: trackStock ? Math.round(Number(stockQty) || 0) : null,
      isActive,
      aliases: finalAliases,
    };

    const parsed = catalogItemSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        fieldErrors[key] ??= issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "edit" && item) {
        await api.patch(`/api/catalog/${item.id}`, parsed.data);
        toast.success("Item updated.");
      } else {
        await api.post("/api/catalog", parsed.data);
        toast.success("Item added to your catalog.");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the item.");
    } finally {
      setLoading(false);
    }
  }

  const defaultTrigger =
    mode === "edit" ? (
      <Button variant="outline" size="sm">Edit</Button>
    ) : (
      <Button><Plus className="size-4" /> New item</Button>
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit item" : "New catalog item"}</DialogTitle>
          <DialogDescription>
            Products and services power quotes, invoices, and AI recognition of the names your customers actually use.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto px-0.5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required error={errors.name} className="sm:col-span-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cement (50kg bag)" error={!!errors.name} />
            </Field>

            <Field label="SKU" hint="Optional internal code" error={errors.sku}>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. CEM-50" error={!!errors.sku} />
            </Field>

            <Field label="Unit" hint="e.g. unit, bag, hour, kg" error={errors.unit}>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="unit" error={!!errors.unit} />
            </Field>

            <Field label="Description" error={errors.description} className="sm:col-span-2">
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description shown on quotes and invoices." error={!!errors.description} />
            </Field>

            <Field label="Price" hint="Per unit, before tax" error={errors.priceCents}>
              <Input type="number" min="0" step="0.01" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" error={!!errors.priceCents} />
            </Field>

            <Field label="Tax %" error={errors.taxPercent}>
              <Input type="number" min="0" max="100" step="1" inputMode="numeric" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} placeholder="0" error={!!errors.taxPercent} />
            </Field>
          </div>

          <Field label="Recognized names (aliases)" hint="Colloquial or Roman-Urdu names the AI should map to this item. Press Enter or comma to add." error={errors.aliases}>
            <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-surface px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring">
              {aliases.map((alias) => (
                <Badge key={alias} variant="primary" className="gap-1">
                  {alias}
                  <button type="button" onClick={() => removeAlias(alias)} className="rounded-full hover:text-danger" aria-label={`Remove ${alias}`}>
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              <input
                value={aliasDraft}
                onChange={(e) => setAliasDraft(e.target.value)}
                onKeyDown={onAliasKeyDown}
                onBlur={() => commitAliasDraft(aliasDraft)}
                placeholder={aliases.length ? "Add another…" : "e.g. saria, sariya, steel bar"}
                className="h-7 min-w-[8rem] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </div>
          </Field>

          <div className="grid gap-3 rounded-xl border border-border bg-surface-muted/40 p-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Track stock</span>
              <Switch checked={trackStock} onCheckedChange={setTrackStock} />
            </label>
            {trackStock ? (
              <Field label="Stock quantity" error={errors.stockQty} className="sm:col-span-1">
                <Input type="number" min="0" step="1" inputMode="numeric" value={stockQty} onChange={(e) => setStockQty(e.target.value)} placeholder="0" error={!!errors.stockQty} />
              </Field>
            ) : (
              <div className="hidden sm:block" />
            )}
            <label className="flex items-center justify-between gap-3 sm:col-span-2">
              <span className="text-sm font-medium">Active <span className="font-normal text-muted-foreground">— available for quotes & invoices</span></span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={submit} loading={loading}>
            <Save className="size-4" /> {mode === "edit" ? "Save changes" : "Add item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
