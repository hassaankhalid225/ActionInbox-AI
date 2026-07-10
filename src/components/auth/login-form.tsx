"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ redirect: string }>("/api/auth/login", { email, password, next });
      toast.success("Welcome back!");
      router.push(res.redirect);
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setError(message);
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail("owner@actioninbox.demo");
    setPassword("Password123");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your ActionInbox workspace.</p>
      </div>

      <button
        type="button"
        onClick={fillDemo}
        className="w-full rounded-lg border border-dashed border-primary/40 bg-primary-muted/40 px-4 py-3 text-left text-sm transition-colors hover:bg-primary-muted"
      >
        <span className="font-medium text-primary">Try the demo →</span>
        <span className="block text-xs text-muted-foreground">Click to fill owner@actioninbox.demo · Password123</span>
      </button>

      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-muted px-3 py-2 text-sm text-danger">{error}</div>
        )}
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            leftIcon={<Mail />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            leftIcon={<Lock />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Sign in <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Start free trial
        </Link>
      </p>
    </div>
  );
}
