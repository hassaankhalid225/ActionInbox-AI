"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { signupSchema } from "@/lib/validation/auth";
import { passwordStrength } from "@/lib/auth/password";
import { cn } from "@/lib/utils/cn";

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", orgName: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = passwordStrength(form.password);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ redirect: string }>("/api/auth/signup", parsed.data);
      toast.success("Workspace created! Let's set things up.");
      router.push(res.redirect);
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not create your account.";
      setErrors({ email: message });
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create your workspace</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Start your 14-day free trial. No card required.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name" htmlFor="name" error={errors.name}>
          <Input id="name" leftIcon={<User />} placeholder="Aisha Khan" value={form.name} onChange={set("name")} error={!!errors.name} />
        </Field>
        <Field label="Business name" htmlFor="orgName" error={errors.orgName}>
          <Input id="orgName" leftIcon={<Building2 />} placeholder="Karachi Traders Co." value={form.orgName} onChange={set("orgName")} error={!!errors.orgName} />
        </Field>
        <Field label="Work email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" leftIcon={<Mail />} placeholder="you@company.com" value={form.email} onChange={set("email")} error={!!errors.email} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <Input id="password" type="password" leftIcon={<Lock />} placeholder="At least 8 characters" value={form.password} onChange={set("password")} error={!!errors.password} />
          {form.password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i < strength.score
                        ? strength.score <= 2
                          ? "bg-danger"
                          : strength.score <= 3
                            ? "bg-warning"
                            : "bg-success"
                        : "bg-muted",
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{strength.label}</span>
            </div>
          )}
        </Field>
        <Button type="submit" className="w-full" loading={loading}>
          Create workspace <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
