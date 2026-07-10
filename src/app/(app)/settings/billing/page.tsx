import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { PLANS, USAGE_METRICS, type PlanId } from "@/lib/constants/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status";
import { PlanSwitcher } from "@/components/settings/plan-switcher";
import { formatNumber, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Billing & usage" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const ctx = await requirePermission("billing.manage");
  const period = new Date().toISOString().slice(0, 7);
  const [sub, counters] = await Promise.all([
    db.subscription.findUnique({ where: { orgId: ctx.org.id } }),
    db.usageCounter.findMany({ where: { orgId: ctx.org.id, period } }),
  ]);

  const planId = (sub?.plan as PlanId) ?? "team";
  const plan = PLANS[planId];

  return (
    <div className="space-y-5">
      {/* Current plan */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{plan.name} plan</h2>
              {sub && <StatusBadge status={sub.status} />}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
            {sub?.status === "trialing" && sub.trialEndsAt && (
              <p className="mt-1 text-sm text-warning-foreground">Trial ends {formatDate(sub.trialEndsAt)}</p>
            )}
            {sub?.currentPeriodEnd && sub.status === "active" && (
              <p className="mt-1 text-sm text-muted-foreground">Renews {formatDate(sub.currentPeriodEnd)}</p>
            )}
          </div>
          <div className="text-right">
            <p className="tabnum text-2xl font-bold">${plan.priceMonthly}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            <Badge variant="neutral" size="sm" className="mt-1">Mock billing</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader><CardTitle className="text-base">Usage this month</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {USAGE_METRICS.map((m) => {
            const counter = counters.find((c) => c.metric === m.key);
            const used = counter?.used ?? 0;
            const limit = counter?.limit || plan.limits[m.limitKey];
            const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
            const tone = pct >= 90 ? "danger" : pct >= 75 ? "warning" : "primary";
            return (
              <div key={m.key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{m.label}</span>
                  <span className="tabnum text-muted-foreground">{formatNumber(used)} / {formatNumber(limit)} {m.unit}</span>
                </div>
                <Progress value={pct} tone={tone} />
                {pct >= 90 && <p className="mt-1 text-2xs text-danger">Approaching limit — consider upgrading.</p>}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Change plan</h3>
        <PlanSwitcher current={planId} />
      </div>
    </div>
  );
}
