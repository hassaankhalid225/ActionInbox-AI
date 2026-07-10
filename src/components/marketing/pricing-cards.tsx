"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { PLAN_LIST } from "@/lib/constants/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export function PricingCards() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center gap-3">
        <span className={cn("text-sm font-medium", !yearly && "text-foreground", yearly && "text-muted-foreground")}>Monthly</span>
        <button
          onClick={() => setYearly((v) => !v)}
          className="relative h-6 w-11 rounded-full bg-primary transition-colors"
          aria-label="Toggle billing period"
        >
          <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform", yearly ? "translate-x-5" : "translate-x-0.5")} />
        </button>
        <span className={cn("text-sm font-medium", yearly && "text-foreground", !yearly && "text-muted-foreground")}>
          Yearly <Badge variant="success" size="sm" className="ml-1">Save ~17%</Badge>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {PLAN_LIST.map((plan) => {
          const price = yearly ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
                plan.highlight ? "border-primary ring-1 ring-primary shadow-lg" : "border-border",
              )}
            >
              {plan.highlight && (
                <Badge variant="primary" className="absolute -top-3 left-6">Most popular</Badge>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="tabnum text-4xl font-bold tracking-tight">${price}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              {yearly && <p className="mt-1 text-xs text-muted-foreground">Billed ${plan.priceYearly}/year</p>}
              <Button asChild variant={plan.highlight ? "primary" : "outline"} className="mt-6">
                <Link href="/signup">Start free trial</Link>
              </Button>
              <ul className="mt-6 space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Usage add-ons available for extra OCR pages, voice minutes, AI actions, and storage.
      </p>
    </div>
  );
}
