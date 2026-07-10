"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_LIST, type PlanId } from "@/lib/constants/plans";
import { api } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

export function PlanSwitcher({ current }: { current: PlanId }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function change(plan: PlanId) {
    setBusy(plan);
    try {
      await api.post("/api/billing/plan", { plan });
      toast.success(`Switched to ${plan} plan`);
      router.refresh();
    } catch {
      toast.error("Could not change plan");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {PLAN_LIST.map((plan) => {
        const active = plan.id === current;
        return (
          <div key={plan.id} className={cn("rounded-xl border bg-card p-5", active ? "border-primary ring-1 ring-primary" : "border-border")}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{plan.name}</h3>
              {active && <Badge variant="primary" size="sm">Current</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
            <p className="mt-3"><span className="tabnum text-2xl font-bold">${plan.priceMonthly}</span><span className="text-sm text-muted-foreground">/mo</span></p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {plan.features.slice(0, 4).map((f) => (
                <li key={f} className="flex items-start gap-2 text-muted-foreground"><Check className="mt-0.5 size-3.5 shrink-0 text-success" /> {f}</li>
              ))}
            </ul>
            <Button variant={active ? "outline" : "primary"} size="sm" className="mt-5 w-full" disabled={active || busy === plan.id} loading={busy === plan.id} onClick={() => change(plan.id as PlanId)}>
              {active ? "Current plan" : `Switch to ${plan.name}`}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
