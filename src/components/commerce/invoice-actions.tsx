"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, Printer, Pencil, MoreHorizontal, CircleDollarSign, BellRing, Ban, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { formatMoney, parseMoneyToCents } from "@/lib/utils/format";

export function InvoiceActions({
  id,
  status,
  balanceCents,
  currency,
  canManage,
  canVerify,
}: {
  id: string;
  status: string;
  balanceCents: number;
  currency: string;
  canManage: boolean;
  canVerify: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState((balanceCents / 100).toString());
  const [method, setMethod] = useState("bank");
  const [reference, setReference] = useState("");

  async function act(action: string) {
    setBusy(action);
    try {
      await api.post(`/api/invoices/${id}/actions`, { action });
      toast.success(labelFor(action));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  async function recordPayment() {
    setBusy("pay");
    try {
      await api.post(`/api/invoices/${id}/actions`, {
        action: "record_payment",
        payment: { amountCents: parseMoneyToCents(amount), method, reference: reference || null },
      });
      toast.success("Payment recorded");
      setPayOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not record payment.");
    } finally {
      setBusy(null);
    }
  }

  const isPayable = status !== "paid" && status !== "void" && status !== "draft";

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="size-4" /> Print / PDF</Button>

      {canManage && status === "draft" && (
        <>
          <Button asChild variant="outline" size="sm"><Link href={`/invoices/${id}/edit`}><Pencil className="size-4" /> Edit</Link></Button>
          <Button size="sm" onClick={() => act("send")} loading={busy === "send"}><Send className="size-4" /> Send</Button>
        </>
      )}

      {canVerify && isPayable && (
        <Button size="sm" onClick={() => setPayOpen(true)}><CircleDollarSign className="size-4" /> Record payment</Button>
      )}

      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isPayable && <DropdownMenuItem onClick={() => act("mark_paid")}><Check /> Mark as paid</DropdownMenuItem>}
            {isPayable && <DropdownMenuItem onClick={() => act("followup")}><BellRing /> Schedule follow-up</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={() => act("void")}><Ban /> Void invoice</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent size="sm">
          <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Balance due: <span className="font-medium text-foreground">{formatMoney(balanceCents, currency)}</span></p>
            <Field label={`Amount (${currency})`}><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
            <Field label="Method">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="manual">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Reference (optional)"><Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction ID" /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={recordPayment} loading={busy === "pay"}>Record payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function labelFor(action: string) {
  return {
    send: "Invoice sent",
    mark_paid: "Marked as paid",
    followup: "Follow-up scheduled",
    void: "Invoice voided",
  }[action] ?? "Done";
}
