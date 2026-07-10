"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";

export function InviteAccept({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ redirect: string }>("/api/team/accept", { token, name, password });
      toast.success("Welcome to the team!");
      router.push(res.redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not accept invitation.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded-lg border border-danger/30 bg-danger-muted px-3 py-2 text-sm text-danger">{error}</div>}
      <Field label="Email"><Input leftIcon={<Mail />} value={email} disabled /></Field>
      <Field label="Your name"><Input leftIcon={<User />} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required /></Field>
      <Field label="Create password"><Input type="password" leftIcon={<Lock />} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required /></Field>
      <Button type="submit" className="w-full" loading={loading}>Join workspace <ArrowRight className="size-4" /></Button>
    </form>
  );
}
