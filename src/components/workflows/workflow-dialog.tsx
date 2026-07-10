"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field, Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { WORKFLOW_TRIGGERS, INTENTS, INTENT_LABELS, type Intent } from "@/lib/constants/enums";
import { titleCase } from "@/lib/utils/format";

const TRIGGER_LABELS: Record<string, string> = {
  inbound_received: "When an inbound item is received",
  intent_detected: "When an intent is detected",
  invoice_due: "When an invoice becomes due",
  low_confidence: "When AI confidence is low",
  payment_proof: "When a payment proof arrives",
};

const ACTIONS = [
  { type: "assign_role", label: "Assign to Finance team", config: { role: "finance" } },
  { type: "add_label", label: "Add a label", config: { label: "auto" } },
  { type: "set_priority", label: "Set priority to High", config: { priority: "high" } },
  { type: "notify_managers", label: "Notify managers", config: { title: "Workflow triggered" } },
];

export function WorkflowDialog({ trigger }: { trigger?: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<string>("inbound_received");
  const [intent, setIntent] = useState<string>("payment_proof");
  const [selectedActions, setSelectedActions] = useState<string[]>(["assign_role"]);

  function toggleAction(type: string) {
    setSelectedActions((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  async function submit() {
    if (!name.trim() || selectedActions.length === 0) {
      toast.error("Add a name and at least one action.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/workflows", {
        name,
        description,
        trigger: triggerType,
        isActive: true,
        requiresApproval: false,
        conditions: [{ field: "intent", op: "eq", value: intent }],
        actions: selectedActions.map((type) => {
          const a = ACTIONS.find((x) => x.type === type)!;
          return { type, configJson: JSON.stringify(a.config) };
        }),
      });
      toast.success("Workflow rule created");
      setOpen(false);
      setName("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create rule.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button><Plus className="size-4" /> New rule</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New workflow rule</DialogTitle>
          <DialogDescription>Automate routing, labeling, and escalation. Trigger → condition → actions.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Rule name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Route payment proofs to Finance" /></Field>
          <Field label="Description"><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          <Field label="Trigger">
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{WORKFLOW_TRIGGERS.map((t) => <SelectItem key={t} value={t}>{TRIGGER_LABELS[t] ?? titleCase(t)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Condition — intent equals">
            <Select value={intent} onValueChange={setIntent}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{INTENTS.map((i) => <SelectItem key={i} value={i}>{INTENT_LABELS[i as Intent]}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div>
            <Label>Actions</Label>
            <div className="mt-2 space-y-2 rounded-lg border border-border p-3">
              {ACTIONS.map((a) => (
                <label key={a.type} className="flex cursor-pointer items-center gap-3 text-sm">
                  <Checkbox checked={selectedActions.includes(a.type)} onCheckedChange={() => toggleAction(a.type)} />
                  {a.label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} loading={loading}><Save className="size-4" /> Create rule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
