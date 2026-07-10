"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Save } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { contactSchema, type ContactInput } from "@/lib/validation/entities";

type ContactKind = "customer" | "vendor" | "lead";

export type ContactFormValue = {
  id: string;
  kind: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  language: string | null;
  tags: string | null;
  notes: string | null;
};

const KINDS: { value: ContactKind; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "vendor", label: "Vendor" },
  { value: "lead", label: "Lead" },
];

const LANGUAGES: { value: string; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ur", label: "Urdu" },
  { value: "ur-roman", label: "Roman Urdu" },
  { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" },
];

export function ContactFormDialog({
  mode,
  contact,
  trigger,
  defaultKind = "customer",
}: {
  mode: "create" | "edit";
  contact?: ContactFormValue;
  trigger?: ReactNode;
  defaultKind?: ContactKind;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [kind, setKind] = useState<string>(contact?.kind ?? defaultKind);
  const [name, setName] = useState(contact?.name ?? "");
  const [company, setCompany] = useState(contact?.company ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [language, setLanguage] = useState<string>(contact?.language ?? "en");
  const [tags, setTags] = useState(contact?.tags ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");

  function reset() {
    setKind(contact?.kind ?? defaultKind);
    setName(contact?.name ?? "");
    setCompany(contact?.company ?? "");
    setPhone(contact?.phone ?? "");
    setEmail(contact?.email ?? "");
    setLanguage(contact?.language ?? "en");
    setTags(contact?.tags ?? "");
    setNotes(contact?.notes ?? "");
    setErrors({});
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) reset();
  }

  async function submit() {
    const candidate = {
      kind,
      name: name.trim(),
      company: company.trim() || null,
      phone: phone.trim() || null,
      email: email.trim(),
      language: language || null,
      tags: tags.trim() || null,
      notes: notes.trim() || null,
    };

    const parsed = contactSchema.safeParse(candidate);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    const payload: ContactInput = parsed.data;
    setLoading(true);
    setErrors({});
    try {
      if (mode === "create") {
        await api.post("/api/customers", payload);
        toast.success("Contact created.");
      } else if (contact) {
        await api.patch(`/api/customers/${contact.id}`, payload);
        toast.success("Contact updated.");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <UserPlus className="size-4" /> New contact
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New contact" : "Edit contact"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a customer, vendor, or lead to your workspace."
              : "Update this contact's details."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" error={errors.kind}>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Language" error={errors.language}>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Name" required error={errors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ahmed Raza" error={!!errors.name} />
          </Field>

          <Field label="Company" error={errors.company}>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Raza Traders" error={!!errors.company} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" error={errors.phone}>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1112223" error={!!errors.phone} />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" error={!!errors.email} />
            </Field>
          </div>

          <Field label="Tags" hint="Comma-separated (e.g. wholesale, priority)" error={errors.tags}>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="wholesale, priority" error={!!errors.tags} />
          </Field>

          <Field label="Notes" error={errors.notes}>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes about this contact…" error={!!errors.notes} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} loading={loading}>
            {mode === "create" ? <UserPlus className="size-4" /> : <Save className="size-4" />}
            {mode === "create" ? "Create contact" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
