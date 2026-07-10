"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { INDUSTRIES, COUNTRIES, CURRENCIES, TIMEZONES } from "@/lib/constants/options";
import { LANGUAGES } from "@/lib/constants/enums";

type Org = {
  name: string; industry: string | null; country: string; currency: string; timezone: string;
  primaryLang: string; secondaryLang: string | null; taxId: string | null; brandColor: string;
};

export function OrgForm({ org }: { org: Org }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: org.name,
    industry: org.industry ?? INDUSTRIES[0]!,
    country: org.country,
    currency: org.currency,
    timezone: org.timezone,
    primaryLang: org.primaryLang,
    secondaryLang: org.secondaryLang ?? "",
    taxId: org.taxId ?? "",
    brandColor: org.brandColor,
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setLoading(true);
    try {
      await api.patch("/api/settings/org", { profile: { ...form, secondaryLang: form.secondaryLang || null, taxId: form.taxId || null } });
      toast.success("Organization updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Business profile</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Industry">
            <Select value={form.industry} onValueChange={(v) => set("industry", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Country">
            <Select value={form.country} onValueChange={(v) => set("country", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Currency">
            <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Timezone">
            <Select value={form.timezone} onValueChange={(v) => set("timezone", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary language">
            <Select value={form.primaryLang} onValueChange={(v) => set("primaryLang", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Tax ID / NTN"><Input value={form.taxId} onChange={(e) => set("taxId", e.target.value)} placeholder="Optional" /></Field>
        </div>
        <Field label="Brand color" hint="Used on quote/invoice PDFs.">
          <div className="flex items-center gap-3">
            <input type="color" value={form.brandColor} onChange={(e) => set("brandColor", e.target.value)} className="h-10 w-16 cursor-pointer rounded-lg border border-input bg-surface" />
            <Input value={form.brandColor} onChange={(e) => set("brandColor", e.target.value)} className="w-32" />
          </div>
        </Field>
        <div className="flex justify-end pt-2">
          <Button onClick={save} loading={loading}><Save className="size-4" /> Save changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}
