"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { TONES } from "@/lib/constants/enums";
import { titleCase } from "@/lib/utils/format";

type Settings = {
  lowConfidenceThreshold?: number;
  requireApprovalMessages?: boolean;
  requireApprovalInvoices?: boolean;
  autoCreateTasks?: boolean;
  defaultTone?: string;
};

export function AiForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    lowConfidenceThreshold: settings.lowConfidenceThreshold ?? 70,
    requireApprovalMessages: settings.requireApprovalMessages ?? true,
    requireApprovalInvoices: settings.requireApprovalInvoices ?? true,
    autoCreateTasks: settings.autoCreateTasks ?? true,
    defaultTone: settings.defaultTone ?? "friendly",
  });

  async function save() {
    setLoading(true);
    try {
      await api.patch("/api/settings/org", { settings: form });
      toast.success("AI settings saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle className="text-base">Approval policy</CardTitle></CardHeader>
        <CardContent className="divide-y divide-border">
          <Row label="Require approval for external messages" desc="AI-drafted replies wait for a human before sending (BR-001)." checked={form.requireApprovalMessages} onChange={(v) => setForm((f) => ({ ...f, requireApprovalMessages: v }))} />
          <Row label="Require approval for invoices" desc="Invoices are drafted, never auto-sent." checked={form.requireApprovalInvoices} onChange={(v) => setForm((f) => ({ ...f, requireApprovalInvoices: v }))} />
          <Row label="Auto-create internal tasks" desc="Let AI create internal tasks without approval." checked={form.autoCreateTasks} onChange={(v) => setForm((f) => ({ ...f, autoCreateTasks: v }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Extraction & drafting</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <Field label={`Low-confidence review threshold — ${form.lowConfidenceThreshold}%`} hint="Extractions below this go to manual review (BR-002).">
            <input type="range" min={40} max={95} step={5} value={form.lowConfidenceThreshold} onChange={(e) => setForm((f) => ({ ...f, lowConfidenceThreshold: Number(e.target.value) }))} className="w-full accent-primary" />
          </Field>
          <Field label="Default drafting tone">
            <Select value={form.defaultTone} onValueChange={(v) => setForm((f) => ({ ...f, defaultTone: v }))}>
              <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{titleCase(t)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="rounded-lg border border-info/30 bg-info-muted/40 p-3 text-sm text-info">
            AI provider: <span className="font-medium">mock (deterministic)</span>. Configure a real provider (Anthropic/OpenAI) via <code className="rounded bg-info/10 px-1">AI_PROVIDER</code> in your environment.
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={loading}><Save className="size-4" /> Save AI settings</Button>
      </div>
    </div>
  );
}

function Row({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div><Label>{label}</Label><p className="text-sm text-muted-foreground">{desc}</p></div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
