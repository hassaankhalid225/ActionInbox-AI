"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { DOC_TYPES } from "@/lib/constants/enums";
import { titleCase } from "@/lib/utils/format";

export function UploadDialog({ contacts, trigger }: { contacts: { id: string; name: string }[]; trigger?: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", docType: "invoice", contactId: "", ocrText: "" });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.title.trim()) {
      toast.error("Give the document a title.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ id: string }>("/api/documents", {
        title: form.title,
        docType: form.docType,
        contactId: form.contactId || null,
        ocrText: form.ocrText || null,
      });
      toast.success("Document uploaded & processed");
      setOpen(false);
      setForm({ title: "", docType: "invoice", contactId: "", ocrText: "" });
      if (res?.id) router.push(`/documents/${res.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not upload document.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button><Upload className="size-4" /> Upload document</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a document</DialogTitle>
          <DialogDescription>PDF, image, or scan. The AI extracts fields and flags obligations.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-muted/40 px-6 py-8 text-center">
            <FileUp className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Drag & drop a file here</p>
            <p className="text-2xs text-muted-foreground">File storage is stubbed in this build — enter details below to simulate processing.</p>
          </div>
          <Field label="Title" required><Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Vendor invoice INV-5521" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <Select value={form.docType} onValueChange={(v) => set("docType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_TYPES.map((d) => <SelectItem key={d} value={d}>{titleCase(d)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Related contact">
              <Select value={form.contactId} onValueChange={(v) => set("contactId", v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="OCR text (paste sample)" hint="Simulates extracted document text.">
            <Textarea rows={3} value={form.ocrText} onChange={(e) => set("ocrText", e.target.value)} placeholder="INVOICE INV-5521 · Amount PKR 592,000 · Due in 30 days…" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} loading={loading}><Upload className="size-4" /> Upload & process</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
