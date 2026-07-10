"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { taskSchema } from "@/lib/validation/entities";
import { PRIORITIES, TASK_STATUS } from "@/lib/constants/enums";
import { titleCase } from "@/lib/utils/format";

type Member = { id: string; name: string };
type ContactOpt = { id: string; name: string };
export type TaskFormValue = {
  id: string; title: string; description: string | null; status: string; priority: string;
  dueAt: Date | null; assigneeId: string | null; contactId: string | null;
};

export function TaskFormDialog({
  mode,
  task,
  members,
  contacts,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  mode: "create" | "edit";
  task?: TaskFormValue;
  members: Member[];
  contacts: ContactOpt[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "open",
    priority: task?.priority ?? "normal",
    dueAt: task?.dueAt ? new Date(task.dueAt).toISOString().slice(0, 10) : "",
    assigneeId: task?.assigneeId ?? "",
    contactId: task?.contactId ?? "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setErrors({});
    const parsed = taskSchema.safeParse({
      ...form,
      dueAt: form.dueAt || null,
      assigneeId: form.assigneeId || null,
      contactId: form.contactId || null,
    });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const i of parsed.error.issues) e[String(i.path[0])] = i.message;
      setErrors(e);
      return;
    }
    setLoading(true);
    try {
      if (mode === "create") await api.post("/api/tasks", parsed.data);
      else await api.patch(`/api/tasks/${task!.id}`, parsed.data);
      toast.success(mode === "create" ? "Task created" : "Task updated");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save task.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          {trigger ?? <Button><Plus className="size-4" /> New task</Button>}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "create" ? "New task" : "Edit task"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label="Title" required error={errors.title}>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Follow up with customer…" error={!!errors.title} />
          </Field>
          <Field label="Description">
            <Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_STATUS.map((s) => <SelectItem key={s} value={s}>{titleCase(s)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{titleCase(p)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Due date"><Input type="date" value={form.dueAt} onChange={(e) => set("dueAt", e.target.value)} /></Field>
            <Field label="Assignee">
              <Select value={form.assigneeId} onValueChange={(v) => set("assigneeId", v)}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
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
          <Button onClick={submit} loading={loading}><Save className="size-4" /> {mode === "create" ? "Create" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
