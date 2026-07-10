"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { forgotSchema } from "@/lib/validation/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = forgotSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email");
      return;
    }
    // NOTE: password-reset email delivery is stubbed in dev (see README →
    // pending integrations). We always show a success state to avoid user
    // enumeration.
    setError(null);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success-muted text-success">
          <CheckCircle2 className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email}</span>, we&apos;ve sent a reset link.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login"><ArrowLeft className="size-4" /> Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" htmlFor="email" error={error ?? undefined}>
          <Input id="email" type="email" leftIcon={<Mail />} placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} error={!!error} />
        </Field>
        <Button type="submit" className="w-full">Send reset link</Button>
      </form>
      <Button asChild variant="ghost" className="w-full">
        <Link href="/login"><ArrowLeft className="size-4" /> Back to sign in</Link>
      </Button>
    </div>
  );
}
