"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { reminderSchema } from "@/lib/validation/entities";
import { REMINDER_KINDS } from "@/lib/constants/enums";
import { titleCase } from "@/lib/utils/format";

export function ReminderFormDialog({ contacts, trigger }: { contacts: { id: string; name: string }[]; trigger?: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ title: "", remindAt: "", kind: "followup", contactId: "" });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setErrors({});
    const parsed = reminderSchema.safeParse({ ...form, contactId: form.contactId || null });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const i of parsed.error.issues) e[String(i.path[0])] = i.message;
      setErrors(e);
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/reminders", parsed.data);
      toast.success("Reminder scheduled");
      setOpen(false);
      setForm({ title: "", remindAt: "", kind: "followup", contactId: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create reminder.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button variant="outline"><Plus className="size-4" /> New reminder</Button>}</DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader><DialogTitle>New reminder</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label="Title" required error={errors.title}><Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Follow up on payment…" error={!!errors.title} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Remind at" required error={errors.remindAt}><Input type="date" value={form.remindAt} onChange={(e) => set("remindAt", e.target.value)} error={!!errors.remindAt} /></Field>
            <Field label="Type">
              <Select value={form.kind} onValueChange={(v) => set("kind", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REMINDER_KINDS.map((k) => <SelectItem key={k} value={k}>{titleCase(k)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Related customer">
            <Select value={form.contactId} onValueChange={(v) => set("contactId", v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} loading={loading}><Save className="size-4" /> Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
